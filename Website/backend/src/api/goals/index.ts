import express from 'express';
import goalCrudRouter from './goal-crud';
import progressTrackingRouter from './progress-tracking';
import analyticsRouter from './analytics';
import recommendationsRouter from './recommendations';
import deviceSyncRouter from './device-sync';
import { authenticateJWT } from '../../auth/middleware';

const router = express.Router();

// All goals routes require authentication
router.use(authenticateJWT);

// Register routes
router.use('/', goalCrudRouter); // Goal CRUD operations
router.use('/progress', progressTrackingRouter); // Progress tracking (weight, measurements)
router.use('/progress/devices', deviceSyncRouter); // Device integration for progress tracking
router.use('/analytics', analyticsRouter); // Goal analytics
router.use('/recommendations', recommendationsRouter); // AI recommendations

export default router;