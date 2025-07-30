import { Request, Response, NextFunction } from 'express';
import { AuditLogger } from '../utils/auditLogger';
import { getClientIp } from './rate-limiting';
import logger from '../utils/logger';

// In-memory store for suspicious activities (use Redis in production)
const suspiciousActivities = new Map<string, {
  count: number;
  firstDetected: Date;
  lastDetected: Date;
  activities: Array<{ type: string; details: any; timestamp: Date }>;
}>();

// Suspicious activity types
export enum SuspiciousActivityType {
  MULTIPLE_FAILED_LOGINS = 'multiple_failed_logins',
  UNUSUAL_REQUEST_PATTERN = 'unusual_request_pattern',
  PARAMETER_TAMPERING = 'parameter_tampering',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'unauthorized_access_attempt',
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',
  ABNORMAL_DATA_ACCESS = 'abnormal_data_access',
  SUSPICIOUS_FILE_UPLOAD = 'suspicious_file_upload',
  UNUSUAL_GEOGRAPHIC_ACCESS = 'unusual_geographic_access'
}

// Record suspicious activity
export function recordSuspiciousActivity(ip: string, userId: string | null, type: SuspiciousActivityType, details: any) {
  const key = userId || ip;
  const now = new Date();
  const activity = { type, details, timestamp: now };
  
  if (suspiciousActivities.has(key)) {
    const record = suspiciousActivities.get(key)!;
    record.count += 1;
    record.lastDetected = now;
    record.activities.push(activity);
    
    // Keep only the last 10 activities to prevent memory issues
    if (record.activities.length > 10) {
      record.activities.shift();
    }
  } else {
    suspiciousActivities.set(key, {
      count: 1,
      firstDetected: now,
      lastDetected: now,
      activities: [activity]
    });
  }
  
  // Log the suspicious activity
  AuditLogger.logSecurity('suspicious_activity', {
    ip,
    userId,
    type,
    details,
    timestamp: now
  });
  
  // Check if threshold is reached for automated response
  const record = suspiciousActivities.get(key)!;
  if (record.count >= 5) {
    // Trigger automated response
    handleThreatResponse(ip, userId, record);
  }
}

// Handle threat response
function handleThreatResponse(ip: string, userId: string | null, record: any) {
  // Implement automated responses based on threat level
  // This could include temporary IP bans, account lockouts, etc.
  
  logger.warn(`Automated threat response triggered for ${userId || ip}`, {
    ip,
    userId,
    activityCount: record.count,
    firstDetected: record.firstDetected,
    lastDetected: record.lastDetected
  });
  
  // Example: Notify security team for high-risk threats
  if (record.count >= 10) {
    // In production, send alerts via email, SMS, or security monitoring system
    logger.error(`HIGH RISK THREAT DETECTED for ${userId || ip}`, {
      ip,
      userId,
      activities: record.activities
    });
  }
}

// Middleware to detect suspicious patterns
export function detectSuspiciousPatterns(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  const userId = req.user?.sub || null;
  
  // Check for suspicious URL parameters
  const suspiciousParams = ['exec', 'eval', 'script', 'alert', 'document.cookie', 'onload', 'onerror'];
  const queryString = req.url.split('?')[1] || '';
  
  if (suspiciousParams.some(param => queryString.includes(param))) {
    recordSuspiciousActivity(ip, userId, SuspiciousActivityType.PARAMETER_TAMPERING, {
      url: req.url,
      queryString
    });
  }
  
  // Check for unusual request headers
  const suspiciousHeaders = ['x-forwarded-host', 'x-host', 'x-forwarded-server', 'x-http-host-override'];
  const hasUnusualHeaders = suspiciousHeaders.some(header => req.headers[header]);
  
  if (hasUnusualHeaders) {
    recordSuspiciousActivity(ip, userId, SuspiciousActivityType.UNUSUAL_REQUEST_PATTERN, {
      headers: req.headers
    });
  }
  
  // Continue with the request
  next();
}

// Middleware to detect unauthorized access attempts
export function detectUnauthorizedAccess(req: Request, res: Response, next: NextFunction) {
  const originalStatus = res.status;
  
  // Override res.status to detect 401/403 responses
  res.status = function(code: number) {
    if (code === 401 || code === 403) {
      const ip = getClientIp(req);
      const userId = req.user?.sub || null;
      
      recordSuspiciousActivity(ip, userId, SuspiciousActivityType.UNAUTHORIZED_ACCESS_ATTEMPT, {
        path: req.path,
        method: req.method,
        statusCode: code
      });
    }
    
    return originalStatus.call(this, code);
  };
  
  next();
}

// Middleware to detect brute force attempts
export function detectBruteForce(req: Request, res: Response, next: NextFunction) {
  // This middleware should be applied to login/authentication routes
  const originalStatus = res.status;
  
  // Override res.status to detect failed login attempts (401)
  res.status = function(code: number) {
    if (code === 401 && req.path.includes('/login')) {
      const ip = getClientIp(req);
      const email = req.body.email || 'unknown';
      
      recordSuspiciousActivity(ip, null, SuspiciousActivityType.BRUTE_FORCE_ATTEMPT, {
        email,
        path: req.path
      });
    }
    
    return originalStatus.call(this, code);
  };
  
  next();
}

// Middleware to detect abnormal data access patterns
export function detectAbnormalDataAccess(req: Request, res: Response, next: NextFunction) {
  // This should be applied to data retrieval endpoints
  if (req.method === 'GET' && req.user) {
    // Check if user is accessing unusual amount of records
    const limit = parseInt(req.query.limit as string) || 0;
    const unusualLimit = 1000; // Define what's considered unusual
    
    if (limit > unusualLimit) {
      const ip = getClientIp(req);
      const userId = req.user.sub;
      
      recordSuspiciousActivity(ip, userId, SuspiciousActivityType.ABNORMAL_DATA_ACCESS, {
        path: req.path,
        limit,
        query: req.query
      });
    }
  }
  
  next();
}

// Middleware to detect suspicious file uploads
export function detectSuspiciousFileUploads(req: Request, res: Response, next: NextFunction) {
  // This should be applied to file upload endpoints
  if (req.method === 'POST' && req.is('multipart/form-data')) {
    // Check file uploads in the request
    if (req.files) {
      const files = Array.isArray(req.files) ? req.files : Object.values(req.files);
      
      // Check for suspicious file types or sizes
      const suspiciousFiles = files.filter((file: any) => {
        const suspiciousExtensions = ['.exe', '.php', '.jsp', '.asp', '.bat', '.sh', '.dll'];
        const fileName = file.originalname || file.name || '';
        const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
        
        // Check file extension and size (>10MB is suspicious for this example)
        return suspiciousExtensions.includes(fileExtension) || file.size > 10 * 1024 * 1024;
      });
      
      if (suspiciousFiles.length > 0) {
        const ip = getClientIp(req);
        const userId = req.user?.sub || null;
        
        recordSuspiciousActivity(ip, userId, SuspiciousActivityType.SUSPICIOUS_FILE_UPLOAD, {
          path: req.path,
          files: suspiciousFiles.map((file: any) => ({
            name: file.originalname || file.name,
            size: file.size,
            mimetype: file.mimetype
          }))
        });
      }
    }
  }
  
  next();
}

// Get suspicious activity report
export function getSuspiciousActivityReport(ip?: string, userId?: string) {
  if (ip || userId) {
    const key = userId || ip;
    return suspiciousActivities.get(key!) || null;
  }
  
  // Return all suspicious activities
  return Array.from(suspiciousActivities.entries()).map(([key, value]) => ({
    identifier: key,
    ...value
  }));
}

// Clear suspicious activity record
export function clearSuspiciousActivity(ip?: string, userId?: string) {
  if (ip || userId) {
    const key = userId || ip;
    return suspiciousActivities.delete(key!);
  }
  
  return false;
}

// Extend Request interface for file uploads
declare global {
  namespace Express {
    interface Request {
      // Remove the conflicting files property declaration
    }
  }
}