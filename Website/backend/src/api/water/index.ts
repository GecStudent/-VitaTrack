import express from 'express';
import waterLoggingRouter from './water-logging';
import analyticsRouter from './analytics';
import remindersRouter from './reminders';
import smartBottlesRouter from './smart-bottles';
import { authenticateJWT } from '../../auth/middleware';

const router = express.Router();

// All water routes require authentication
router.use(authenticateJWT);

// Register routes
router.use('/', waterLoggingRouter); // Water logging operations
router.use('/analytics', analyticsRouter); // Water analytics
router.use('/reminders', remindersRouter); // Hydration reminders
router.use('/smart-bottles', smartBottlesRouter); // Smart bottle integration

export default router;