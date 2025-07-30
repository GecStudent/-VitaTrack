import express from 'express';
import mealCrudRouter from './meal-crud';
import nutritionCalcRouter from './nutrition-calc';
import mealTemplatesRouter from './meal-templates';
import analyticsRouter from './analytics';
import { authenticateJWT } from '../../auth/middleware';

const router = express.Router();

// All meal routes require authentication
router.use(authenticateJWT);

// Register routes
router.use('/', mealCrudRouter);
router.use('/nutrition', nutritionCalcRouter);
router.use('/templates', mealTemplatesRouter);
router.use('/analytics', analyticsRouter);

export default router;