import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError, registerSchema, requestValidator } from '../../../src/middleware/requestValidator';

describe('Request Validator Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.MockedFunction<NextFunction>;
  
  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      path: '/test',
      body: {},
      query: {},
      params: {}
    };
    mockResponse = {};
    nextFunction = jest.fn() as jest.MockedFunction<NextFunction>;
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('should pass validation when schema is valid', () => {
    // Register a test schema
    const testSchema = Joi.object({
      query: Joi.object({
        name: Joi.string().required()
      }),
      body: Joi.object().optional(),
      params: Joi.object().optional()
    });
    registerSchema('GET:/test', testSchema);
    
    // Set valid query params
    mockRequest.query = { name: 'test' };
    mockRequest.body = {};
    mockRequest.params = {};
    
    // Call middleware
    requestValidator(mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Expect next to be called without error
    expect(nextFunction).toHaveBeenCalledWith();
  });
  
  test('should fail validation when schema is invalid', () => {
    // Register a test schema
    const testSchema = Joi.object({
      query: Joi.object({
        name: Joi.string().required()
      }),
      body: Joi.object().optional(),
      params: Joi.object().optional()
    });
    registerSchema('GET:/test', testSchema);
    
    // Set invalid query params (missing required field)
    mockRequest.query = {};
    mockRequest.body = {};
    mockRequest.params = {};
    
    // Call middleware
    requestValidator(mockRequest as Request, mockResponse as Response, nextFunction);
    
    // Expect next to be called with ValidationError
    expect(nextFunction).toHaveBeenCalledWith(expect.any(ValidationError));
    
    // Check if the error has the expected ValidationError properties
    const error = nextFunction.mock.calls[0][0] as any;
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.status).toBe(400);
    expect(error.details).toBeDefined();
  });
  
  test('should skip validation when no schema is registered', () => {
    // Create a new request object with different path to avoid read-only property issue
    const noSchemaRequest = {
      ...mockRequest,
      path: '/no-schema'
    };
    
    // Call middleware
    requestValidator(noSchemaRequest as Request, mockResponse as Response, nextFunction);
    
    // Expect next to be called without error
    expect(nextFunction).toHaveBeenCalledWith();
  });
});