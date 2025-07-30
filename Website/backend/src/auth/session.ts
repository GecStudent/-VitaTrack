import { AuthSession } from './types';

// In a real application, this would be stored in a database
// This is just an in-memory implementation for demonstration
const sessions: Record<string, AuthSession[]> = {};

// Create a new session
export function createSession(userId: string, sessionId: string, device: string, rememberMe = false): AuthSession {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7)); // 7 or 30 days
  
  const session: AuthSession = {
    userId,
    sessionId,
    device,
    createdAt: new Date(),
    expiresAt,
    revoked: false
  };
  
  if (!sessions[userId]) {
    sessions[userId] = [];
  }
  
  sessions[userId].push(session);
  return session;
}

// Get all sessions for a user
export function getUserSessions(userId: string): AuthSession[] {
  return sessions[userId] || [];
}

// Revoke a specific session
export function revokeSession(userId: string, sessionId: string): boolean {
  const userSessions = sessions[userId];
  if (!userSessions) return false;
  
  const sessionIndex = userSessions.findIndex(s => s.sessionId === sessionId);
  if (sessionIndex === -1) return false;
  
  userSessions[sessionIndex].revoked = true;
  return true;
}

// Revoke all sessions for a user except the current one
export function revokeOtherSessions(userId: string, currentSessionId: string): number {
  const userSessions = sessions[userId];
  if (!userSessions) return 0;
  
  let count = 0;
  userSessions.forEach(session => {
    if (session.sessionId !== currentSessionId && !session.revoked) {
      session.revoked = true;
      count++;
    }
  });
  
  return count;
}

// Check if a session is valid
export function isSessionValid(userId: string, sessionId: string): boolean {
  const userSessions = sessions[userId];
  if (!userSessions) return false;
  
  const session = userSessions.find(s => s.sessionId === sessionId);
  if (!session) return false;
  
  return !session.revoked && new Date() < session.expiresAt;
}

// Clean up expired sessions
export function cleanupExpiredSessions(): void {
  const now = new Date();
  Object.keys(sessions).forEach(userId => {
    sessions[userId] = sessions[userId].filter(session => {
      return session.expiresAt > now;
    });
  });
}