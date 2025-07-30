import express from 'express';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import userRepository from '../../database/repositories/UserRepository';
import { comparePassword, isAccountLocked, recordFailedAttempt, resetFailedAttempts, logSecurityEvent, isMfaEnabled, verifyMfaCode } from '../../auth/security';
import { generateToken, generateRefreshToken } from '../../auth/jwt';
import { JwtPayload, RefreshTokenPayload, UserRole } from '../../auth/types';
import { minimizeData } from './gdpr';

const router = express.Router();

interface LoginRequestBody {
  email: string;
  password: string;
  deviceInfo?: string;
  rememberMe?: boolean;
  mfaCode?: string;
}

router.post('/', async (req: Request, res: Response) => {
  try {
    // Handle both body and query parameters
    const data = req.body && Object.keys(req.body).length > 0 ? req.body : req.query;
    
    const { email, password, deviceInfo, rememberMe, mfaCode } = data as LoginRequestBody;
    
    // Basic validation
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    
    // Check if account is locked
    if (isAccountLocked(email)) {
      logSecurityEvent('login_attempt_locked_account', { email, ip: req.ip });
      res.status(403).json({ 
        error: 'Account is temporarily locked due to multiple failed attempts. Please try again later.'
      });
      return;
    }
    
    // Find user by email
    const user = await userRepository.findByEmail(email);
    
    // User not found or password doesn't match
    if (!user || !(await comparePassword(password, user.password_hash))) {
      // Record failed attempt
      recordFailedAttempt(email);
      logSecurityEvent('failed_login', { email, ip: req.ip });
      
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    
    // Check if email is verified
    if (!user.emailVerified) {
      res.status(403).json({ 
        error: 'Email not verified. Please check your inbox for verification email.',
        needsVerification: true
      });
      return;
    }
    
    // Check for MFA if enabled
    if (isMfaEnabled(user.id)) {
      // If MFA is required but code not provided
      if (!mfaCode) {
        res.status(200).json({ 
          requiresMfa: true,
          message: 'Please enter your MFA code'
        });
        return;
      }
      
      // Verify MFA code
      if (!verifyMfaCode(user.id, mfaCode)) {
        logSecurityEvent('failed_mfa', { userId: user.id, ip: req.ip });
        res.status(401).json({ error: 'Invalid MFA code' });
        return;
      }
    }
    
    // Reset failed attempts counter
    resetFailedAttempts(email);
    
    // Generate session ID
    const sessionId = uuidv4();
    
    // Create JWT payload
    const tokenPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.activity_level as UserRole, // This should be updated to use a proper role field
      sessionId: sessionId
    };
    
    // Create refresh token payload
    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      sessionId: sessionId
    };
    
    // Generate tokens
    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(refreshPayload);
    
    // Store session info (in a real app, this would go to a database)
    // This is a placeholder for actual session storage
    const sessionInfo = {
      userId: user.id,
      sessionId: sessionId,
      device: deviceInfo || req.headers['user-agent'] || 'unknown',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000), // 7 or 30 days
      revoked: false
    };
    
    // Log successful login
    logSecurityEvent('successful_login', { 
      userId: user.id, 
      email: user.email,
      ip: req.ip,
      device: sessionInfo.device
    });
    
    // Return tokens and user info
    res.status(200).json({
      accessToken,
      refreshToken,
      user: minimizeData(user as any),
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    });
    
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed due to server error' });
  }
});

export default router;