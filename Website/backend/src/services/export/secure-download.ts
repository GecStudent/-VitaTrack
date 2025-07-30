import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { AuditLogger } from '../../utils/auditLogger';
import { getConfig } from '../../config';

// In-memory store for download tokens (in production, use a database)
const downloadTokens = new Map<string, {
  filePath: string;
  userId: string;
  expiresAt: Date;
  downloadCount: number;
  maxDownloads: number;
  }>();

/**
 * Generate a secure download token
 * @param userId User ID
 * @param filePath Path to the file
 * @param options Download options
 * @returns Download token
 */
export function generateDownloadToken(
  userId: string,
  filePath: string,
  options: {
    expiresIn?: number; // Seconds
    maxDownloads?: number;
  } = {}
): string {
  // Generate a unique token
  const token = uuidv4();
  
  // Set default options using config values
  const expiresIn = options.expiresIn || getConfig().export.rateLimitWindowMs; // 1 hour
  const maxDownloads = options.maxDownloads || getConfig().export.maxDownloads;
  
  // Store token details
  downloadTokens.set(token, {
    filePath,
    userId,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
    downloadCount: 0,
    maxDownloads
  });
  
  // Log token generation
  AuditLogger.log('download_token_generated', {
    userId,
    token,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
    maxDownloads,
    timestamp: new Date()
  });
  
  return token;
}

/**
 * Validate a download token
 * @param token Download token
 * @returns Validation result
 */
export function validateDownloadToken(token: string): {
  valid: boolean;
  filePath?: string;
  userId?: string;
  error?: string;
} {
  // Check if token exists
  if (!downloadTokens.has(token)) {
    return { valid: false, error: 'Invalid download token' };
  }
  
  const tokenDetails = downloadTokens.get(token)!;
  
  // Check if token has expired
  if (new Date() > tokenDetails.expiresAt) {
    // Clean up expired token
    downloadTokens.delete(token);
    return { valid: false, error: 'Download token has expired' };
  }
  
  // Check if max downloads reached
  if (tokenDetails.downloadCount >= tokenDetails.maxDownloads) {
    return { valid: false, error: 'Maximum download count reached' };
  }
  
  // Check if file exists
  if (!fs.existsSync(tokenDetails.filePath)) {
    return { valid: false, error: 'Export file not found' };
  }
  
  return {
    valid: true,
    filePath: tokenDetails.filePath,
    userId: tokenDetails.userId
  };
}

/**
 * Record a download attempt
 * @param token Download token
 * @returns Success status
 */
export function recordDownload(token: string): boolean {
  // Check if token exists
  if (!downloadTokens.has(token)) {
    return false;
  }
  
  const tokenDetails = downloadTokens.get(token)!;
  
  // Increment download count
  tokenDetails.downloadCount++;
  downloadTokens.set(token, tokenDetails);
  
  // Log the download
  AuditLogger.log('export_downloaded', {
    userId: tokenDetails.userId,
    token,
    downloadCount: tokenDetails.downloadCount,
    timestamp: new Date()
  });
  
  // Clean up if max downloads reached
  if (tokenDetails.downloadCount >= tokenDetails.maxDownloads) {
    // We keep the token to track that it's been fully used
    // In a real implementation with a database, you might set a 'consumed' flag
  }
  
  return true;
}

/**
 * Derive a key from password using PBKDF2 with random salt
 * @param password Password to derive key from
 * @param salt Salt for key derivation
 * @returns Derived key
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  // Use PBKDF2 with 100,000 iterations for better security
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

/**
 * Encrypt a file for secure download using AES-GCM
 * @param filePath Path to the file
 * @param password Encryption password
 * @returns Path to the encrypted file
 */
export function encryptFile(filePath: string, password: string): string {
  try {
    // Validate that encryption key is set
    const encryptionKey = getConfig().export.encryptionKey;
    if (!encryptionKey) {
      throw new Error('Encryption key not configured');
    }
    
    // Read the file
    const fileData = fs.readFileSync(filePath);
    
    // Generate a random salt and IV
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12); // GCM uses 12-byte IV
    
    // Derive key from password or use the configured encryption key
    const key = deriveKey(password || encryptionKey, salt);
    
    // Create cipher using AES-GCM for authenticated encryption
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    // Encrypt the file
    const encrypted = Buffer.concat([
      cipher.update(fileData),
      cipher.final()
    ]);
    
    // Get the authentication tag
    const tag = cipher.getAuthTag();
    
    // Combine salt, IV, tag, and encrypted data
    const encryptedData = Buffer.concat([
      salt,     // 16 bytes
      iv,       // 12 bytes
      tag,      // 16 bytes
      encrypted // variable length
    ]);
    
    // Write the encrypted file
    const encryptedFilePath = `${filePath}.enc`;
    fs.writeFileSync(encryptedFilePath, encryptedData);
    
    return encryptedFilePath;
  } catch (error) {
    AuditLogger.logError('file_encryption_error', { filePath, error });
    throw new Error('Failed to encrypt file');
  }
}

/**
 * Decrypt a file using AES-GCM
 * @param encryptedFilePath Path to the encrypted file
 * @param password Decryption password
 * @returns Path to the decrypted file
 */
export function decryptFile(encryptedFilePath: string, password: string): string {
  try {
    // Validate that encryption key is set
    const encryptionKey = getConfig().export.encryptionKey;
    if (!encryptionKey) {
      throw new Error('Encryption key not configured');
    }
    
    // Read the encrypted file
    const encryptedData = fs.readFileSync(encryptedFilePath);
    
    // Extract components
    const salt = encryptedData.slice(0, 16);
    const iv = encryptedData.slice(16, 28);
    const tag = encryptedData.slice(28, 44);
    const encrypted = encryptedData.slice(44);
    
    // Derive key from password or use the configured encryption key
    const key = deriveKey(password || encryptionKey, salt);
    
    // Create decipher using AES-GCM
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt the file
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    // Write the decrypted file
    const decryptedFilePath = encryptedFilePath.replace('.enc', '.dec');
    fs.writeFileSync(decryptedFilePath, decrypted);
    
    return decryptedFilePath;
  } catch (error) {
    AuditLogger.logError('file_decryption_error', { encryptedFilePath, error });
    throw new Error('Failed to decrypt file');
  }
}

/**
 * Generate a secure download URL
 * @param token Download token
 * @param baseUrl Base URL
 * @returns Download URL
 */
export function generateDownloadUrl(token: string, baseUrl: string): string {
  return `${baseUrl}/api/users/data-export/secure-download/${token}`;
}