import express from 'express';
import userRepository from '../../database/repositories/UserRepository';
import { AuditLogger } from '../../utils/auditLogger';
import { sendWelcomeEmail } from './email';
import { verifyEmailToken } from '../../auth/emailVerification';

const router = express.Router();

// GET route for email verification links - redirects to verification page
router.get('/', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      // Redirect to verification page with error
      return res.redirect('/verification-page?error=invalid_token');
    }

    // Verify the JWT token
    const payload = verifyEmailToken(token);
    
    if (!payload) {
      AuditLogger.log('email_verification_failed', { reason: 'invalid_or_expired_token' });
      return res.redirect('/verification-page?error=expired_token');
    }

    const { userId, email } = payload;
    
    if (!userId || !email) {
      AuditLogger.log('email_verification_failed', { reason: 'missing_data_in_token' });
      return res.redirect('/verification-page?error=invalid_token');
    }

    // Find the user by ID
    const user = await userRepository.findById(userId);
    
    if (!user) {
      AuditLogger.log('email_verification_failed', { userId, email, reason: 'user_not_found' });
      return res.redirect('/verification-page?error=user_not_found');
    }

    // Verify that the email in the token matches the user's email
    if (user.email !== email) {
      AuditLogger.log('email_verification_failed', { userId, email, reason: 'email_mismatch' });
      return res.redirect('/verification-page?error=email_mismatch');
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return res.redirect('/verification-page?status=already_verified');
    }

    // Update user's email verification status
    await userRepository.updateUser(user.id, { 
      emailVerified: true
    });

    // Send welcome email after successful verification
    const welcomeEmailSent = await sendWelcomeEmail(user.email, user.first_name);

    // Log successful verification
    AuditLogger.log('email_verification_successful', { 
      userId: user.id, 
      email: user.email,
      welcomeEmailSent
    });

    // Redirect to verification page with success status
    return res.redirect(`/verification-page?status=success&welcomeEmailSent=${welcomeEmailSent}`);
  } catch (err) {
    console.error('Email verification error:', err);
    AuditLogger.log('email_verification_error', { 
      error: (err as Error).message,
      stack: (err as Error).stack
    });
    return res.redirect('/verification-page?error=server_error');
  }
});

// POST route for API calls (existing functionality)
router.post('/', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // Verify the JWT token
    const payload = verifyEmailToken(token);
    
    if (!payload) {
      AuditLogger.log('email_verification_failed', { reason: 'invalid_or_expired_token' });
      return res.status(400).json({ error: 'Verification link expired or invalid' });
    }

    const { userId, email } = payload;
    
    if (!userId || !email) {
      AuditLogger.log('email_verification_failed', { reason: 'missing_data_in_token' });
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    // Find the user by ID
    const user = await userRepository.findById(userId);
    
    if (!user) {
      AuditLogger.log('email_verification_failed', { userId, email, reason: 'user_not_found' });
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify that the email in the token matches the user's email
    if (user.email !== email) {
      AuditLogger.log('email_verification_failed', { userId, email, reason: 'email_mismatch' });
      return res.status(400).json({ error: 'Email verification failed' });
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return res.status(200).json({ message: 'Email already verified' });
    }

    // Update user's email verification status
    await userRepository.updateUser(user.id, { 
      emailVerified: true
      // emailTokenCreatedAt: undefined // Change null to undefined
    });

    // Send welcome email after successful verification
    const welcomeEmailSent = await sendWelcomeEmail(user.email, user.first_name);

    // Log successful verification
    AuditLogger.log('email_verification_successful', { 
      userId: user.id, 
      email: user.email,
      welcomeEmailSent
    });

    return res.status(200).json({ 
      message: 'Email verified successfully', 
      welcomeEmailSent 
    });
  } catch (err) {
    console.error('Email verification error:', err);
    AuditLogger.log('email_verification_error', { 
      error: (err as Error).message,
      stack: (err as Error).stack
    });
    return res.status(500).json({ error: 'Email verification failed due to server error' });
  }
});

export default router;