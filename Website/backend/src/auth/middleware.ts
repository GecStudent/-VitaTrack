import { Request, Response, NextFunction } from 'express';
import { validateToken } from './jwt';
import { JwtPayload } from './types';

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }
  const token = authHeader.split(' ')[1];
  const payload = validateToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
  req.user = payload as JwtPayload;
  next();
}

// Example route protection usage:
// app.get('/api/protected', authenticateJWT, (req, res) => { ... }); 