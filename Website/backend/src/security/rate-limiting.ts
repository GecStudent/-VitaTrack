import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { AuditLogger } from '../utils/auditLogger';
import { getConfig } from '../config';
// Replace this line
// import { Redis } from 'redis';
// With this
import type { RedisClientType } from 'redis';

// Redis client for distributed rate limiting
let redisClient: RedisClientType | null = null;

// Initialize Redis client if URL is available
export async function initRedisClient() {
  try {
    const { redisUrl } = getConfig();
    if (redisUrl) {
      const redis = require('redis');
      redisClient = redis.createClient({
        url: redisUrl,
        legacyMode: false
      });
      
      if (redisClient) {
        await redisClient.connect();
        
        redisClient.on('error', (err: Error) => {
          console.error('Redis client error:', err);
          // Fallback to memory store if Redis fails
          redisClient = null;
        });
      }
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to initialize Redis client:', error);
    return false;
  }
}

// Custom store implementation using Redis
class RedisStore {
  prefix: string;
  
  constructor(prefix = 'rl:') {
    this.prefix = prefix;
  }
  
  async increment(key: string): Promise<{ totalHits: number, resetTime: Date }> {
    if (!redisClient) {
      throw new Error('Redis client not available');
    }
    
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const resetTime = new Date(now + windowMs);
    const redisKey = this.prefix + key;
    
    const multi = redisClient.multi();
    multi.incr(redisKey);
    multi.pExpire(redisKey, windowMs);
    
    const results = await multi.exec();
    const totalHits = results?.[0] as number || 0;
    
    return { totalHits, resetTime };
  }
  
  async decrement(key: string): Promise<void> {
    if (!redisClient) {
      throw new Error('Redis client not available');
    }
    
    const redisKey = this.prefix + key;
    await redisClient.decr(redisKey);
  }
  
  async resetKey(key: string): Promise<void> {
    if (!redisClient) {
      throw new Error('Redis client not available');
    }
    
    const redisKey = this.prefix + key;
    await redisClient.del(redisKey);
  }
}

// Get client IP address, handling proxies
export function getClientIp(req: Request): string {
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    const ips = Array.isArray(xForwardedFor) 
      ? xForwardedFor[0] 
      : xForwardedFor.split(',')[0].trim();
    return ips;
  }
  return req.ip || '127.0.0.1';
}

// Generate key based on IP and optional user ID
export function generateRateLimitKey(req: Request, includeUser = true): string {
  const ip = getClientIp(req);
  if (includeUser && req.user && req.user.sub) {
    return `${ip}:${req.user.sub}`;
  }
  return ip;
}

// Standard rate limiter for general API endpoints
export const standardRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  // Fix the keyGenerator function signature
  keyGenerator: (req: Request) => generateRateLimitKey(req),
  handler: (req: Request, res: Response, _next: NextFunction) => {
    AuditLogger.logSecurity('rate_limit_exceeded', {
      ip: getClientIp(req),
      userId: req.user?.sub || 'anonymous',
      path: req.path,
      method: req.method
    });
    res.status(429).json({ error: 'Too many requests, please try again later.' });
  }
});

// Strict rate limiter for sensitive endpoints (auth, password reset)
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later.' },
  // Fix the keyGenerator function signature
  keyGenerator: (req: Request) => generateRateLimitKey(req),
  handler: (req: Request, res: Response, _next: NextFunction) => {
    AuditLogger.logSecurity('strict_rate_limit_exceeded', {
      ip: getClientIp(req),
      userId: req.user?.sub || 'anonymous',
      path: req.path,
      method: req.method
    });
    res.status(429).json({ error: 'Too many attempts, please try again later.' });
  }
});

// API key rate limiter (for external integrations)
export const apiKeyRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const apiKey = req.headers['x-api-key'] as string;
    return apiKey || generateRateLimitKey(req, false);
  },
  handler: (req: Request, res: Response, _next: NextFunction) => {
    AuditLogger.logSecurity('api_key_rate_limit_exceeded', {
      apiKey: req.headers['x-api-key'] || 'none',
      ip: getClientIp(req),
      path: req.path,
      method: req.method
    });
    res.status(429).json({ error: 'API rate limit exceeded.' });
  }
});

// Per-endpoint custom rate limiter factory
export function createEndpointRateLimiter(options: {
  windowMs?: number;
  max?: number;
  message?: string;
  includeUser?: boolean;
}) {
  return rateLimit({
    windowMs: options.windowMs || 60 * 1000, // Default: 1 minute
    max: options.max || 30, // Default: 30 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: options.message || 'Too many requests for this endpoint.' },
    keyGenerator: (req: Request) => generateRateLimitKey(req, options.includeUser !== false),
    handler: (req: Request, res: Response, _next: NextFunction) => {
      AuditLogger.logSecurity('endpoint_rate_limit_exceeded', {
        ip: getClientIp(req),
        userId: req.user?.sub || 'anonymous',
        path: req.path,
        method: req.method,
        limit: options.max,
        window: options.windowMs
      });
      res.status(429).json({ error: options.message || 'Too many requests for this endpoint.' });
    }
  });
}

// DDoS protection middleware
export function ddosProtection(req: Request, res: Response, next: NextFunction) {
  // Implement more sophisticated DDoS detection here
  // This is a simple example that could be expanded with more complex detection algorithms
  const ip = getClientIp(req);
  
  // Check for suspicious patterns (example: too many requests in a very short time)
  // In a real implementation, this would use a time-series database or Redis to track request patterns
  
  // For now, we'll just pass through and rely on the rate limiters
  next();
}

// API key management (in-memory for demo, use database in production)
const apiKeys: Record<string, {
  owner: string;
  scopes: string[];
  createdAt: Date;
  lastUsed?: Date;
  rateLimit: number;
}> = {};

// Validate API key middleware
export function validateApiKey(requiredScopes: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Sanitize the API key header to prevent prototype pollution
    const apiKeyHeader = req.headers['x-api-key'];
    const apiKey = typeof apiKeyHeader === 'string' ? apiKeyHeader : '';
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key is required' });
    }
    
    const keyData = apiKeys[apiKey];
    if (!keyData) {
      AuditLogger.logSecurity('invalid_api_key_attempt', {
        ip: getClientIp(req),
        apiKey: apiKey,
        path: req.path
      });
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    // Check if key has required scopes
    if (requiredScopes.length > 0) {
      const hasRequiredScopes = requiredScopes.every(scope => keyData.scopes.includes(scope));
      if (!hasRequiredScopes) {
        AuditLogger.logSecurity('api_key_insufficient_scope', {
          ip: getClientIp(req),
          apiKey: apiKey,
          path: req.path,
          requiredScopes,
          providedScopes: keyData.scopes
        });
        return res.status(403).json({ error: 'Insufficient scope for this operation' });
      }
    }
    
    // Update last used timestamp
    keyData.lastUsed = new Date();
    
    // Add API key info to request for downstream use
    req.apiKeyData = keyData;
    
    next();
  };
}

// Generate a new API key
export function generateApiKey(owner: string, scopes: string[] = [], rateLimit = 60): string {
  const key = Buffer.from(Math.random().toString(36) + Date.now().toString() + owner)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 32);
    
  apiKeys[key] = {
    owner,
    scopes,
    createdAt: new Date(),
    rateLimit
  };
  
  return key;
}

// Revoke an API key
export function revokeApiKey(key: string): boolean {
  if (apiKeys[key]) {
    delete apiKeys[key];
    return true;
  }
  return false;
}

// Extend Request interface to include API key data
declare global {
  namespace Express {
    interface Request {
      apiKeyData?: {
        owner: string;
        scopes: string[];
        createdAt: Date;
        lastUsed?: Date;
        rateLimit: number;
      };
    }
  }
}