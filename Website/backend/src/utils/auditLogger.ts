import fs from 'fs';
import path from 'path';
import logger from './logger';

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const auditLogPath = path.join(logsDir, 'audit.log');

export class AuditLogger {
  /**
   * Log an audit event
   * @param eventType Type of event
   * @param details Event details
   */
  static log(eventType: string, details: any): void {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        eventType,
        details,
        environment: process.env.NODE_ENV || 'development'
      };
      
      // Write to file
      fs.appendFileSync(
        auditLogPath, 
        JSON.stringify(logEntry) + '\n'
      );
      
      // Also log to Winston
      logger.info(`AUDIT: ${eventType}`, details);
      
      // In production, you might also send to a monitoring service
      if (process.env.NODE_ENV === 'production') {
        // Example: send to monitoring service
        // monitoringService.logAudit(logEntry);
      }
    } catch (err) {
      logger.error('Failed to write audit log:', { error: (err as Error).message });
    }
  }
  
  /**
   * Log security-related events
   * @param eventType Type of security event
   * @param details Event details
   */
  static logSecurity(eventType: string, details: any): void {
    this.log(`security_${eventType}`, {
      ...details,
      securityEvent: true
    });
  }
  
  /**
   * Log an error event
   * @param eventType Type of error event
   * @param details Error details
   */
  static logError(eventType: string, details: any): void {
    this.log(`error_${eventType}`, {
      ...details,
      isError: true
    });
  }
  
  /**
   * Get audit logs for a specific user
   * @param userId User ID
   * @param startDate Start date for logs
   * @param endDate End date for logs
   * @returns Array of log entries
   */
  static async getUserLogs(userId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    try {
      // In a real implementation, this would query a database or log aggregation service
      // For now, we'll read from the file (not efficient for production)
      
      const logs = fs.readFileSync(auditLogPath, 'utf-8')
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => JSON.parse(line))
        .filter(log => {
          // Filter by user ID
          const hasUserId = log.details && 
            (log.details.userId === userId || log.details.user_id === userId);
          
          if (!hasUserId) return false;
          
          // Filter by date range if provided
          if (startDate || endDate) {
            const logDate = new Date(log.timestamp);
            if (startDate && logDate < startDate) return false;
            if (endDate && logDate > endDate) return false;
          }
          
          return true;
        });
      
      return logs;
    } catch (err) {
      logger.error('Failed to get user logs:', { error: (err as Error).message });
      return [];
    }
  }
}