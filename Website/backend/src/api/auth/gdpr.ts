import fs from 'fs';
import path from 'path';
import { AuditLogger } from '../../utils/auditLogger';

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const consentLogPath = path.join(logsDir, 'gdpr-consent.log');
const dataAccessLogPath = path.join(logsDir, 'gdpr-data-access.log');

/**
 * Log user consent for GDPR compliance
 * @param userId User ID
 * @param consentType Type of consent given
 * @param timestamp Date and time of consent
 */
export function logConsent(userId: string, consentType: string, timestamp: Date): void {
  try {
    const logEntry = `${timestamp.toISOString()} | user: ${userId} | consent: ${consentType}\n`;
    fs.appendFileSync(consentLogPath, logEntry);
    
    // Also log to audit system
    AuditLogger.log('gdpr_consent_recorded', { userId, consentType, timestamp });
  } catch (err) {
    console.error('Failed to log consent:', err);
    // Don't throw - we don't want to fail registration if logging fails
  }
}

/**
 * Remove sensitive data from user object
 * @param user User object
 * @returns User object with sensitive data removed
 */
export function minimizeData(user: any): Record<string, unknown> {
  // Create a copy to avoid modifying the original
  const safeUser = { ...user };
  
  // Remove sensitive fields
  delete safeUser.password_hash;
  
  // Optionally mask other PII if not needed
  // safeUser.email = maskEmail(safeUser.email);
  
  return safeUser;
}

/**
 * Log terms acceptance for GDPR compliance
 * @param userId User ID
 * @param timestamp Date and time of acceptance
 */
export function logTermsAcceptance(userId: string, timestamp: Date): void {
  try {
    const logEntry = `${timestamp.toISOString()} | user: ${userId} | terms_accepted\n`;
    fs.appendFileSync(consentLogPath, logEntry);
    
    // Also log to audit system
    AuditLogger.log('terms_accepted', { userId, timestamp });
  } catch (err) {
    console.error('Failed to log terms acceptance:', err);
  }
}

/**
 * Log data access for GDPR compliance
 * @param userId User ID
 * @param accessorId ID of user or system accessing the data
 * @param purpose Purpose of data access
 * @param timestamp Date and time of access
 */
export function logDataAccess(userId: string, accessorId: string, purpose: string, timestamp: Date): void {
  try {
    const logEntry = `${timestamp.toISOString()} | user: ${userId} | accessor: ${accessorId} | purpose: ${purpose}\n`;
    fs.appendFileSync(dataAccessLogPath, logEntry);
    
    // Also log to audit system
    AuditLogger.log('data_access', { userId, accessorId, purpose, timestamp });
  } catch (err) {
    console.error('Failed to log data access:', err);
  }
}

/**
 * Prepare user data for export (GDPR right to data portability)
 * @param userId User ID
 * @returns Object containing all user data
 */
export async function prepareDataExport(userId: string): Promise<Record<string, unknown>> {
  // This would typically query all user-related tables and compile the data
  // For now, we'll return a placeholder
  
  // Log the export request
  logDataAccess(userId, 'system', 'data_export', new Date());
  
  return {
    message: 'Data export functionality to be implemented',
    userId
  };
}

/**
 * Handle data deletion request (GDPR right to be forgotten)
 * @param userId User ID
 * @returns Success status
 */
export async function handleDataDeletion(userId: string): Promise<boolean> {
  // This would typically anonymize or delete user data
  // For now, we'll return a placeholder
  
  // Log the deletion request
  AuditLogger.log('data_deletion_requested', { userId, timestamp: new Date() });
  
  return true;
}

/**
 * Mask email for privacy
 * @param email Email address
 * @returns Masked email (e.g., j***@example.com)
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  
  const [localPart, domain] = email.split('@');
  
  if (localPart.length <= 1) return email;
  
  const firstChar = localPart[0];
  const maskedLocal = firstChar + '***';
  
  return `${maskedLocal}@${domain}`;
}

/**
 * Check if user has given specific consent
 * @param userId User ID
 * @param consentType Type of consent to check
 * @returns Whether consent has been given
 */
export async function hasConsent(): Promise<boolean> {
  // This would typically check a consents database table
  // For now, we'll return a placeholder
  return true;
}