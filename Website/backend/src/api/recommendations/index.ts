import express from 'express';
import { authenticateJWT } from '../../auth/middleware';
import insightsRouter from './insights';

const router = express.Router();

// All recommendation routes require authentication
router.use(authenticateJWT);

// Register sub-routers
router.use('/insights', insightsRouter);

export default router;