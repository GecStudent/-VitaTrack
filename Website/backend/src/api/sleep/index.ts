import express from 'express';
import sleepLoggingRouter from './sleep-logging';
import sleepAnalysisRouter from './sleep-analysis';
import deviceSyncRouter from './device-sync';
import recommendationsRouter from './recommendations';
import { authenticateJWT } from '../../auth/middleware';

const router = express.Router();

// All sleep routes require authentication
router.use(authenticateJWT);

// Register routes
router.use('/', sleepLoggingRouter); // Sleep logging operations
router.use('/analysis', sleepAnalysisRouter); // Sleep analysis
router.use('/device-sync', deviceSyncRouter); // Device synchronization
router.use('/recommendations', recommendationsRouter); // Sleep recommendations

export default router;