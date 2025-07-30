import { Request, Response } from 'express';
import { ValidationError } from './requestValidator';
import logger from '../utils/logger';

// Custom application error class
export class AppError extends Error {
  public status: number;
  public isOperational: boolean;

  constructor(message: string, status = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
export function errorHandler(err: Record<string, unknown>, req: Request, res: Response) {
  // Default error status and message
  let status = typeof err.status === 'number' ? err.status : 500;
  let message = err.message || 'Internal Server Error';
  let details = undefined;
  
  // Log error
  logger.error(`${err.name || 'Error'}: ${message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Handle specific error types
  if (err instanceof ValidationError) {
    details = err.details;
  } else if (err.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized';
  } else if (err.name === 'ForbiddenError') {
    status = 403;
    message = 'Forbidden';
  } else if (err.name === 'NotFoundError') {
    status = 404;
    message = 'Resource not found';
  }

  // Send response
  res.status(status).json({
    error: {
      message,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
}