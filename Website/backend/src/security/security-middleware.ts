import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { AuditLogger } from '../utils/auditLogger';
import { getClientIp } from './rate-limiting';
import { AppError } from '../middleware/errorHandler';

// Content Security Policy configuration
export const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://fonts.googleapis.com'],
    imgSrc: ["'self'", 'data:', 'https://cdn.jsdelivr.net', 'https://vitatrack-assets.s3.amazonaws.com'],
    connectSrc: ["'self'", 'https://api.vitatrack.health'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
    formAction: ["'self'"],
    upgradeInsecureRequests: [],
  },
  reportOnly: process.env.NODE_ENV !== 'production'
};

// Enhanced Helmet configuration
export const helmetConfig = {
  contentSecurityPolicy: cspConfig,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: 'same-origin' as const },
  crossOriginResourcePolicy: { policy: 'same-origin' as const },
  dnsPrefetchControl: { allow: false },
  expectCt: {
    maxAge: 86400,
    enforce: true
  },
  frameguard: { action: 'deny' as const },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' as const },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' as const },
  xssFilter: true
};

// Apply security headers middleware
export const securityHeaders = helmet(helmetConfig);

// SQL Injection prevention middleware
export function sqlInjectionPrevention(req: Request, res: Response, next: NextFunction) {
  // Check for common SQL injection patterns in query parameters and body
  const checkSqlInjection = (obj: any): boolean => {
    if (!obj) return false;
    
    if (typeof obj === 'string') {
      // Check for common SQL injection patterns
      const sqlPatterns = [
        /('|\\s)\s*OR\s+['"\d]\s*=\s*['"\d]/i,
        /('|\\s)\s*AND\s+['"\d]\s*=\s*['"\d]/i,
        /--\s/,
        /;\s*DROP\s+TABLE/i,
        /;\s*DELETE\s+FROM/i,
        /UNION\s+ALL\s+SELECT/i,
        /INSERT\s+INTO.+VALUES/i,
        /SELECT\s+.+FROM/i,
        /ALTER\s+TABLE/i,
        /EXEC\s+xp_/i,
        /EXEC\s+sp_/i
      ];
      
      return sqlPatterns.some(pattern => pattern.test(obj));
    }
    
    if (typeof obj === 'object') {
      return Object.values(obj).some(value => checkSqlInjection(value));
    }
    
    return false;
  };
  
  // Check query parameters and request body
  if (checkSqlInjection(req.query) || checkSqlInjection(req.body)) {
    AuditLogger.logSecurity('sql_injection_attempt', {
      ip: getClientIp(req),
      userId: req.user?.sub || 'anonymous',
      path: req.path,
      method: req.method,
      query: req.query,
      body: req.body
    });
    
    return res.status(403).json({ error: 'Invalid input detected' });
  }
  
  next();
}

// XSS Protection middleware
export function xssProtection(req: Request, res: Response, next: NextFunction) {
  // Sanitize input to prevent XSS attacks
  const sanitizeXss = (obj: any): any => {
    if (!obj) return obj;
    
    if (typeof obj === 'string') {
      // Replace potentially dangerous characters
      return obj
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .replace(/`/g, '&#96;');
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeXss(item));
    }
    
    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeXss(value);
      }
      return sanitized;
    }
    
    return obj;
  };
  
  // Sanitize request body and query parameters
  req.body = sanitizeXss(req.body);
  req.query = sanitizeXss(req.query);
  
  next();
}

// CSRF token validation middleware
const csrfTokens = new Map<string, { token: string, expires: Date }>(); // In-memory store (use Redis in production)

// Generate CSRF token
export function generateCsrfToken(userId: string): string {
  const token = Buffer.from(Math.random().toString(36) + Date.now().toString() + userId)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '');
  
  // Set expiration to 1 hour from now
  const expires = new Date();
  expires.setHours(expires.getHours() + 1);
  
  csrfTokens.set(userId, { token, expires });
  
  return token;
}

// Validate CSRF token middleware
export function validateCsrfToken(req: Request, res: Response, next: NextFunction) {
  // Skip for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip CSRF validation for public endpoints that don't require authentication
  const publicEndpoints = [
    '/api/auth/register',
    '/api/auth/login',
    '/api/auth/refresh',
    '/api/auth/verify-email',
    '/api/auth/password-reset',
    '/health',
    '/verification-page',
    '/favicon.ico'
  ];
  
  if (publicEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
    return next();
  }
  
  const token = req.headers['x-csrf-token'] as string;
  const userId = req.user?.sub;
  
  if (!token || !userId) {
    return res.status(403).json({ error: 'CSRF token required' });
  }
  
  const storedData = csrfTokens.get(userId);
  
  if (!storedData || storedData.token !== token || new Date() > storedData.expires) {
    AuditLogger.logSecurity('csrf_validation_failure', {
      ip: getClientIp(req),
      userId,
      path: req.path,
      method: req.method
    });
    
    return res.status(403).json({ error: 'Invalid or expired CSRF token' });
  }
  
  // Generate a new token for the next request
  const newToken = generateCsrfToken(userId);
  res.setHeader('X-CSRF-Token', newToken);
  
  next();
}

// Input validation middleware
export function validateRequestSchema(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = schema.validate({
        body: req.body,
        query: req.query,
        params: req.params
      }, { abortEarly: false });
      
      if (error) {
        const details = error.details.map((detail: any) => ({
          message: detail.message,
          path: detail.path
        }));
        
        return next(new AppError('Validation failed', 400));
      }
      
      // Update request with validated values
      req.body = value.body;
      req.query = value.query;
      req.params = value.params;
      
      next();
    } catch (err) {
      next(new AppError('Validation error', 400));
    }
  };
}

// Secure cookie middleware
export function secureCookies(req: Request, res: Response, next: NextFunction) {
  // Instead of overriding res.cookie, we'll create a helper function
  // that can be used to set secure cookies
  (res as any).setSecureCookie = function(name: string, value: string, options: any = {}) {
    const secureOptions = {
      ...options,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: options.maxAge || 24 * 60 * 60 * 1000 // 24 hours default
    };
    
    return this.cookie(name, value, secureOptions);
  };
  
  next();
}

// Validate content type middleware
export function validateContentType(allowedTypes: string[] = ['application/json']) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.headers['content-type'];
      
      if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
        return res.status(415).json({ error: 'Unsupported Media Type' });
      }
    }
    
    next();
  };
}