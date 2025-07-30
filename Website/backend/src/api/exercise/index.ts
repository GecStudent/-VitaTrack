import express from 'express';
import workoutCrudRouter from './workout-crud';
import exerciseLibraryRouter from './exercise-library';
import calorieCalcRouter from './calorie-calc';
import deviceIntegrationRouter from './device-integration';
import { authenticateJWT } from '../../auth/middleware';

const router = express.Router();

// All exercise routes require authentication
router.use(authenticateJWT);

// Register routes
router.use('/', exerciseLibraryRouter); // Exercise library routes
router.use('/workouts', workoutCrudRouter); // Workout CRUD operations
router.use('/calories', calorieCalcRouter); // Calorie calculations
router.use('/devices', deviceIntegrationRouter); // Device integration

export default router;