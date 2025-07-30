// Mock environment variables BEFORE importing the jwt module
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.JWT_ISSUER = 'test-issuer';
process.env.JWT_AUDIENCE = 'test-audience';

import jwt from 'jsonwebtoken';
import { generateToken, validateToken, blacklistToken, generateRefreshToken } from '../../../src/auth/jwt';
import { JwtPayload, RefreshTokenPayload } from '../../../src/auth/types';


describe('JWT Authentication', () => {
  const mockPayload: JwtPayload = {
    sub: '12345',
    email: 'test@example.com',
    role: 'user',
    sessionId: 'test-session-id'
  };
  
  const mockRefreshPayload: RefreshTokenPayload = {
    sub: '12345',
    sessionId: 'test-session-id'
  };
  
  test('should generate a valid JWT token', () => {
    const token = generateToken(mockPayload);
    
    // Token should be a string
    expect(typeof token).toBe('string');
    
    // Token should be verifiable
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string, {
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE
    }) as JwtPayload;
    
    // Decoded token should match payload
    expect(decoded.sub).toBe(mockPayload.sub);
    expect(decoded.email).toBe(mockPayload.email);
    expect(decoded.role).toBe(mockPayload.role);
    expect(decoded.sessionId).toBe(mockPayload.sessionId);
  });
  
  test('should generate a valid refresh token', () => {
    const token = generateRefreshToken(mockRefreshPayload);
    
    // Token should be a string
    expect(typeof token).toBe('string');
    
    // Token should be verifiable
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string, {
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE
    }) as RefreshTokenPayload;
    
    // Decoded token should match payload
    expect(decoded.sub).toBe(mockRefreshPayload.sub);
    expect(decoded.sessionId).toBe(mockRefreshPayload.sessionId);
  });
  
  test('should validate a valid token', () => {
    const token = generateToken(mockPayload);
    const result = validateToken(token);
    
    // Result should be the decoded payload
    expect(result).not.toBeNull();
    expect(result?.sub).toBe(mockPayload.sub);
    expect(result?.email).toBe(mockPayload.email);
  });
  
  test('should reject an invalid token', () => {
    const result = validateToken('invalid-token');
    
    // Result should be null
    expect(result).toBeNull();
  });
  
  test('should reject a blacklisted token', () => {
    const token = generateToken(mockPayload);
    
    // Blacklist the token
    blacklistToken(token);
    
    // Validation should fail
    const result = validateToken(token);
    expect(result).toBeNull();
  });
});