import express from 'express';
import { Request, Response } from 'express';
import userRepository from '../../database/repositories/UserRepository';
import { AuditLogger } from '../../utils/auditLogger';
import { generatePasswordResetToken, verifyPasswordResetToken } from '../../auth/emailVerification';
import { sendPasswordResetEmail } from './email';
import { validateEmail, validatePassword } from './validation';
import { hashPassword } from '../../auth/security';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for password reset requests
// 5 requests per hour per IP to prevent abuse
const resetRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per window
  message: { error: 'Too many password reset requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for password reset verification
// 10 attempts per hour per IP
const resetVerifyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per window
  message: { error: 'Too many password reset attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Request a password reset
 * POST /api/auth/password-reset/request
 */
router.post('/request', resetRequestLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Validate email format
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // Log the request (without revealing if user exists)
    AuditLogger.log('password_reset_requested', { email, ip: req.ip });

    // Find user by email
    const user = await userRepository.findByEmail(email, false);

    // If user doesn't exist, still return success to prevent user enumeration
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return res.status(200).json({ 
        message: 'If your email is registered, you will receive password reset instructions' 
      });
    }

    // Generate password reset token
    const resetToken = generatePasswordResetToken(user.id, user.email);

    // Send password reset email
    const fullName = `${user.first_name} ${user.last_name}`;
    const emailSent = await sendPasswordResetEmail(user.email, fullName, resetToken);

    if (!emailSent) {
      console.error(`Failed to send password reset email to ${email}`);
      AuditLogger.logError('password_reset_email_failed', { userId: user.id, email });
      return res.status(500).json({ error: 'Failed to send password reset email' });
    }

    // Log successful email sending
    AuditLogger.log('password_reset_email_sent', { userId: user.id, email });

    return res.status(200).json({ 
      message: 'If your email is registered, you will receive password reset instructions' 
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    AuditLogger.logError('password_reset_request_error', { error: (error as Error).message });
    return res.status(500).json({ error: 'An error occurred processing your request' });
  }
});

/**
 * Verify password reset token and set new password
 * POST /api/auth/password-reset/verify
 */
router.post('/verify', resetVerifyLimiter, async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    // Validate inputs
    if (!token) {
      return res.status(400).json({ error: 'Reset token is required' });
    }

    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    // Validate password strength
    if (!validatePassword(newPassword)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character' 
      });
    }

    // Verify the token
    const payload = verifyPasswordResetToken(token);
    if (!payload) {
      AuditLogger.logError('password_reset_invalid_token', { ip: req.ip });
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Find the user
    const user = await userRepository.findByEmail(payload.email, false);
    if (!user) {
      AuditLogger.logError('password_reset_user_not_found', { email: payload.email });
      return res.status(400).json({ error: 'User not found' });
    }

    // Hash the new password
    const passwordHash = await hashPassword(newPassword);

    // Update the user's password
    await userRepository.updateUser(user.id, { password_hash: passwordHash });

    // Log the successful password reset
    AuditLogger.log('password_reset_successful', { 
      userId: user.id, 
      email: user.email,
      ip: req.ip 
    });

    return res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Password reset verification error:', error);
    AuditLogger.logError('password_reset_verification_error', { error: (error as Error).message });
    return res.status(500).json({ error: 'An error occurred processing your request' });
  }
});

export default router;