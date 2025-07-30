import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Ensure secret is loaded
const JWT_SECRET = process.env.JWT_SECRET || '';
if (!JWT_SECRET) {
  console.error('JWT_SECRET environment variable is not set!');
  process.exit(1);
}

// Email verification token interface
export interface EmailVerificationPayload {
  userId: string;
  email: string;
  iat?: number;  // issued at
  exp?: number;  // expiration time
}

/**
 * Generate a JWT token for email verification that expires in 24 hours
 */
export function generateEmailVerificationToken(userId: string, email: string): string {
  const payload: EmailVerificationPayload = { userId, email };
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h',  // 24 hours
    issuer: process.env.JWT_ISSUER || 'vitatrack-api',
    audience: 'email-verification'
  });
}

/**
 * Verify an email verification token
 */
export function verifyEmailToken(token: string): EmailVerificationPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: process.env.JWT_ISSUER || 'vitatrack-api',
      audience: 'email-verification'
    }) as EmailVerificationPayload;
  } catch {
    return null;
  }
}

// Password reset token interface
export interface PasswordResetPayload {
  userId: string;
  email: string;
  iat?: number;  // issued at
  exp?: number;  // expiration time
}

/**
 * Generate a JWT token for password reset that expires in 1 hour
 */
export function generatePasswordResetToken(userId: string, email: string): string {
  const payload: PasswordResetPayload = { userId, email };
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '1h',  // 1 hour
    issuer: process.env.JWT_ISSUER || 'vitatrack-api',
    audience: 'password-reset'
  });
}

/**
 * Verify a password reset token
 */
export function verifyPasswordResetToken(token: string): PasswordResetPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: process.env.JWT_ISSUER || 'vitatrack-api',
      audience: 'password-reset'
    }) as PasswordResetPayload;
  } catch {
    return null;
  }
}