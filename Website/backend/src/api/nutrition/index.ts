import express from 'express';
import bmrTdeeRouter from './bmr-tdee';
import recipeAnalysisRouter from './recipe-analysis';
import deficiencyDetectionRouter from './deficiency-detection';
import { authenticateJWT } from '../../auth/middleware';

const router = express.Router();

// All nutrition routes require authentication
router.use(authenticateJWT);

// Register sub-routers
router.use('/bmr-tdee', bmrTdeeRouter);
router.use('/recipe-analysis', recipeAnalysisRouter);
router.use('/deficiency-detection', deficiencyDetectionRouter);

export default router;