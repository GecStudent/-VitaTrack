import morgan from 'morgan';
import { Request } from 'express';
import logger from '../utils/logger';

// Custom token for user ID from JWT
morgan.token('user-id', (req: Request) => {
  return req.user ? req.user.sub : 'anonymous';
});

// Custom token for request body (sanitized)
morgan.token('request-body', (req: Request) => {
  if (!req.body) return '-';
  
  // Create a sanitized copy without sensitive fields
  const sanitized = { ...req.body };
  if (sanitized.password) sanitized.password = '[REDACTED]';
  if (sanitized.token) sanitized.token = '[REDACTED]';
  
  return JSON.stringify(sanitized);
});

// Stream to redirect Morgan logs to Winston
const stream = {
  write: (message: string) => {
    // Remove the newline that Morgan adds
    const trimmedMessage = message.trim();
    logger.http(trimmedMessage);
  }
};

// Development format - colorful and detailed
const developmentFormat = ':method :url :status :response-time ms - :res[content-length] - :user-id :request-body';

// Production format - machine parseable
const productionFormat = ':remote-addr - :user-id [:date[iso]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';

// Export appropriate logger based on environment
export const httpLogger = morgan(
  process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  { stream }
);