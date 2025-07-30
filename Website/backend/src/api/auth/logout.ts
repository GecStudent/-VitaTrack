import express from 'express';
import { Request, Response } from 'express';
import { blacklistToken } from '../../auth/jwt';
import { revokeSession } from '../../auth/session';
import { AuditLogger } from '../../utils/auditLogger';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    // Get the token from the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Get user from the request (set by authenticateJWT middleware)
    const user = req.user;
    
    if (!user || !user.sessionId) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    // Blacklist the current token
    blacklistToken(token);
    
    // Revoke the session
    revokeSession(user.sub, user.sessionId);
    
    // Log the logout event
    AuditLogger.logSecurity('logout', { 
      userId: user.sub,
      sessionId: user.sessionId,
      ip: req.ip
    });
    
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ error: 'Logout failed due to server error' });
  }
});

export default router;