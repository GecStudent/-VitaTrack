import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// Custom error for validation failures
export class ValidationError extends Error {
  public status: number;
  public details: any;

  constructor(message: string, details: any) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
    this.details = details;
  }
}

// Schema registry to store validation schemas by route
const schemaRegistry: Record<string, Joi.Schema> = {};

// Register a schema for a specific route
export function registerSchema(route: string, schema: Joi.Schema): void {
  schemaRegistry[route] = schema;
}

// Middleware to validate request against registered schema
export function requestValidator(req: Request, res: Response, next: NextFunction) {
  const route = `${req.method}:${req.path}`;
  const schema = schemaRegistry[route];

  if (!schema) {
    return next(); // No schema registered for this route
  }

  const { error, value } = schema.validate({
    body: req.body,
    query: req.query,
    params: req.params
  }, { abortEarly: false });

  if (error) {
    const details = error.details.map(detail => ({
      message: detail.message,
      path: detail.path
    }));
    return next(new ValidationError('Validation failed', details));
  }

  // Update request with validated values
  req.body = value.body;
  req.query = value.query;
  req.params = value.params;

  next();
}