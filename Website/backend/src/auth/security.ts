import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// In-memory lockout for demo (use DB/Redis in production)
const failedAttempts: Record<string, { count: number; lastFailed: Date }> = {};
const ACCOUNT_LOCKOUT_THRESHOLD = parseInt(process.env.ACCOUNT_LOCKOUT_THRESHOLD || '5', 10);
const ACCOUNT_LOCKOUT_DURATION = parseInt((process.env.ACCOUNT_LOCKOUT_DURATION || '15').replace(/\D/g, ''), 10); // in minutes

export function isAccountLocked(email: string): boolean {
  const entry = failedAttempts[email];
  if (!entry) return false;
  const now = new Date();
  if (entry.count >= ACCOUNT_LOCKOUT_THRESHOLD) {
    const diff = (now.getTime() - entry.lastFailed.getTime()) / 60000;
    if (diff < ACCOUNT_LOCKOUT_DURATION) return true;
    else {
      failedAttempts[email] = { count: 0, lastFailed: now };
      return false;
    }
  }
  return false;
}

export function recordFailedAttempt(email: string) {
  const now = new Date();
  if (!failedAttempts[email]) failedAttempts[email] = { count: 1, lastFailed: now };
  else {
    failedAttempts[email].count += 1;
    failedAttempts[email].lastFailed = now;
  }
}

export function resetFailedAttempts(email: string) {
  delete failedAttempts[email];
}

export function logSecurityEvent(event: string, details: Record<string, unknown>) {
  // In production, log to a file or monitoring system
  console.log(`[SECURITY EVENT] ${event}`, details);
}

// MFA and social auth stubs
export function isMfaEnabled(_userId: string): boolean {
  // Implement actual check
  return false;
}

export function verifyMfaCode(_userId: string, _code: string): boolean {
  // Implement actual verification
  return true;
}

export function prepareSocialAuth(_provider: string) {
  // Implement social auth preparation (Google, Facebook, etc.)
} 