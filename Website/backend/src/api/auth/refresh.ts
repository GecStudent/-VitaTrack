import express from 'express';
import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { generateToken, blacklistToken } from '../../auth/jwt';
import { JwtPayload, RefreshTokenPayload } from '../../auth/types';
import { logSecurityEvent } from '../../auth/security';
import userRepository from '../../database/repositories/UserRepository';
import { UserRole } from '../../auth/types';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_ISSUER = process.env.JWT_ISSUER || 'vitatrack-api';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'vitatrack-users';

router.post('/', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }
    
    // Verify the refresh token
    try {
      const payload = jwt.verify(refreshToken, JWT_SECRET, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      }) as RefreshTokenPayload;
      
      // Get user from database
      const user = await userRepository.findById(payload.sub);
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }
      
      // Check if session is valid (in a real app, check against stored sessions)
      // This is a placeholder for actual session validation
      
      // Generate a new session ID
      const newSessionId = uuidv4();
      
      // Create new JWT payload
      const tokenPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: 'user', // fallback to 'user' or map from activity_level if needed
        sessionId: newSessionId
      };
      
      // Generate new tokens
      const newAccessToken = generateToken(tokenPayload);
      
      // Blacklist the old refresh token
      blacklistToken(refreshToken);
      
      // Create new refresh token payload
      const refreshPayload: RefreshTokenPayload = {
        sub: user.id,
        sessionId: newSessionId
      };
      
      // Generate new refresh token
      const options: SignOptions = {
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN as unknown as number | undefined) || 7 * 24 * 60 * 60, // fallback to 7 days in seconds
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      };
      const newRefreshToken = jwt.sign(refreshPayload, JWT_SECRET, options);
      
      // Log token refresh
      logSecurityEvent('token_refresh', { 
        userId: user.id,
        ip: req.ip
      });
      
      return res.status(200).json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '1h'
      });
      
    } catch (error) {
      logSecurityEvent('invalid_refresh_token', { 
        ip: req.ip,
        error: (error as Error).message
      });
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    
  } catch (err) {
    console.error('Token refresh error:', err);
    return res.status(500).json({ error: 'Token refresh failed' });
  }
});

export default router;