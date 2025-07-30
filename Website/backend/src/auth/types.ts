// Define available roles
export type UserRole = 'user' | 'admin' | 'moderator';

// JWT Access Token Payload (used with jwt.sign / jwt.verify)
export interface JwtPayload {
  sub: string;            // user id (standard JWT subject)
  email: string;
  role: UserRole;
  sessionId: string;
  iat?: number;           // issued at
  exp?: number;           // expiration time
}

// JWT Refresh Token Payload
export interface RefreshTokenPayload {
  sub: string;            // user id
  sessionId: string;
  iat?: number;
  exp?: number;
}

// Auth session record (typically stored in DB)
export interface AuthSession {
  userId: string;
  sessionId: string;
  device: string;
  createdAt: Date;
  expiresAt: Date;
  revoked: boolean;
}
