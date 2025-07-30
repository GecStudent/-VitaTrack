import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
// Replace the import from swagger.json with our new swagger-config
// import swaggerDocument from '../swagger.json';
import swaggerSpec from './docs/swagger-config';
import path from 'path';
import fs from 'fs';
import { errorHandler } from './middleware/errorHandler';
import { requestValidator } from './middleware/requestValidator';
import { authenticateJWT } from './auth/middleware';
import authRouter from './api/auth/index';
import usersRouter from './api/users'; 
import foodRouter from './api/food'; 
import mealsRouter from './api/meals'; 
import exerciseRouter from './api/exercise';
import goalsRouter from './api/goals';
import waterRouter from './api/water';
import sleepRouter from './api/sleep';
import recommendationsRouter from './api/recommendations';
import reportsRouter from './api/reports';
import logger from './utils/logger';
import { httpLogger } from './middleware/logger';
import { getConfig } from './config';

// Import security modules
import { 
  securityHeaders, 
  sqlInjectionPrevention, 
  xssProtection, 
  validateCsrfToken,
  secureCookies,
  validateContentType
} from './security/security-middleware';
import { 
  standardRateLimiter, 
  strictRateLimiter, 
  apiKeyRateLimiter,
  ddosProtection,
  initRedisClient
} from './security/rate-limiting';
import {
  detectSuspiciousPatterns,
  detectUnauthorizedAccess,
  detectBruteForce,
  detectAbnormalDataAccess
} from './security/threat-detection';
import { scheduleVulnerabilityScans } from './security/vulnerability-scan';

const app = express();
const config = getConfig();

// Initialize Redis for rate limiting if available
initRedisClient().then(redisAvailable => {
  if (redisAvailable) {
    logger.info('Redis client initialized for rate limiting');
  } else {
    logger.warn('Redis not available, using memory store for rate limiting');
  }
});

// Basic middleware
app.use(cors());
app.use(securityHeaders); // Enhanced security headers
app.use(compression());
app.use(express.json({ limit: '1mb' })); // Limit request size
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(httpLogger);
app.use(secureCookies); // Secure cookies middleware

// Security middleware
app.use(standardRateLimiter); // Apply rate limiting to all routes
app.use(ddosProtection); // DDoS protection
app.use(sqlInjectionPrevention); // SQL injection prevention
app.use(xssProtection); // XSS protection
app.use(detectSuspiciousPatterns); // Detect suspicious patterns
app.use(detectUnauthorizedAccess); // Detect unauthorized access attempts
app.use(validateContentType()); // Validate content type

// Apply CSRF protection to non-GET routes if enabled
if (config.security.csrf.enabled) {
  app.use(validateCsrfToken);
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve email verification success page
app.get('/verification-page', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'verification-page.html'));
});

// Serve a blank favicon.ico to avoid 500 errors
app.get('/favicon.ico', (req, res) => res.status(204).end());

// API versioning
const apiV1Router = express.Router();

apiV1Router.use(requestValidator);

apiV1Router.get('/', (req, res) => {
  res.json({ message: 'API v1 root' });
});

app.use('/api/v1', apiV1Router);

// Swagger docs - update this line
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Apply strict rate limiting to auth routes
app.use('/api/auth', strictRateLimiter, detectBruteForce, authRouter);

// Apply standard rate limiting and security to other routes
app.use('/api/users', standardRateLimiter, detectAbnormalDataAccess, usersRouter);
app.use('/api/food', standardRateLimiter, foodRouter);
app.use('/api/meals', standardRateLimiter, mealsRouter);
app.use('/api/exercise', standardRateLimiter, exerciseRouter);
app.use('/api/goals', standardRateLimiter, goalsRouter);
app.use('/api/water', standardRateLimiter, waterRouter);
app.use('/api/sleep', standardRateLimiter, sleepRouter);
app.use('/api/recommendations', standardRateLimiter, recommendationsRouter);
app.use('/api/reports', standardRateLimiter, detectAbnormalDataAccess, reportsRouter);

// Example protected route
app.get('/api/protected', authenticateJWT, (req, res) => {
  res.json({ message: 'You are authenticated!', user: req.user });
});

// Error handling
app.use(errorHandler);

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Schedule vulnerability scans if enabled
if (config.security.vulnerabilityScan.enabled) {
  scheduleVulnerabilityScans();
}

export default app;
