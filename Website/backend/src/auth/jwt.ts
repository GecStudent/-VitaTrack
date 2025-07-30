import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { JwtPayload, RefreshTokenPayload } from './types';

dotenv.config();

// Ensure secret is loaded
const JWT_SECRET = process.env.JWT_SECRET || '';
if (!JWT_SECRET) {
  console.error('JWT_SECRET environment variable is not set!');
  process.exit(1); // Exit the application if the secret is not provided
}

// Load config with fallback values
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN as string) || '1h';
const JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN as string) || '7d';
const JWT_ISSUER: string = process.env.JWT_ISSUER || 'vitatrack-api';
const JWT_AUDIENCE: string = process.env.JWT_AUDIENCE || 'vitatrack-users';

// In-memory blacklist (use Redis in production)
const blacklistedTokens = new Set<string>();

// 🔐 Generate Access Token
export function generateToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as unknown as number | undefined,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

// 🔁 Generate Refresh Token
export function generateRefreshToken(payload: RefreshTokenPayload): string {
  const options: SignOptions = {
    expiresIn: JWT_REFRESH_EXPIRES_IN as unknown as number | undefined,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

// ✅ Validate Token
export function validateToken(token: string): JwtPayload | null {
  try {
    if (blacklistedTokens.has(token)) return null;

    const options: VerifyOptions = {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    };

    return jwt.verify(token, JWT_SECRET, options) as JwtPayload;
  } catch {
    return null;
  }
}

// 🚫 Blacklist Token
export function blacklistToken(token: string): void {
  blacklistedTokens.add(token);
}
