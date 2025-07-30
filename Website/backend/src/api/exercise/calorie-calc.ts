import express from 'express';
import { Request, Response } from 'express';
import Joi from 'joi';
import { JwtPayload } from '../../auth/types';
import { registerSchema } from '../../middleware/requestValidator';
import exerciseRepository from '../../database/repositories/ExerciseRepository';
import exerciseLogRepository from '../../database/repositories/ExerciseLogRepository';

const router = express.Router();

// Schema for calorie calculation
const calorieCalcSchema = Joi.object({
  body: Joi.object({
    exerciseId: Joi.string().required(),
    duration: Joi.number().integer().min(1).required(),
    weight: Joi.number().positive().optional(),
    intensity: Joi.string().valid('low', 'medium', 'high').optional(),
  }),
});

// Register schema for POST /api/exercise/calories/calculate
registerSchema('POST:/api/exercise/calories/calculate', calorieCalcSchema);

// POST /api/exercise/calories/calculate - Calculate calories burned
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const { exerciseId, duration, weight, intensity } = req.body;
    
    // Get the exercise details
    const exercise = await exerciseRepository.findById(exerciseId);
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }
    
    // Base calculation using exercise's calories per minute
    let caloriesBurned = exercise.caloriesPerMin * duration;
    
    // Apply intensity multiplier if provided
    if (intensity) {
      const intensityMultipliers = {
        low: 0.8,
        medium: 1.0,
        high: 1.2,
      };
      caloriesBurned *= intensityMultipliers[intensity as keyof typeof intensityMultipliers];
    }
    
    // Adjust for weight if provided (using a simple linear adjustment)
    if (weight) {
      // Assuming a reference weight of 70kg
      const referenceWeight = 70;
      caloriesBurned *= (weight / referenceWeight);
    }
    
    // Round to nearest integer
    caloriesBurned = Math.round(caloriesBurned);
    
    res.json({
      exerciseId,
      exerciseName: exercise.name,
      duration,
      caloriesBurned,
    });
  } catch (error) {
    console.error('Calculate calories error:', error);
    res.status(500).json({ error: 'Failed to calculate calories' });
  }
});

// GET /api/exercise/calories/summary - Get calorie burn summary
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const { period } = req.query;
    
    const endDate = new Date();
    let startDate = new Date();
    
    // Determine the date range based on the period
    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        // Default to last 7 days
        startDate.setDate(startDate.getDate() - 7);
    }
    
    // Get total calories burned in the date range
    const totalCaloriesBurned = await exerciseLogRepository.getCaloriesBurnedByDateRange(
      userId,
      startDate,
      endDate
    );
    
    // Get workout logs for the period
    const workoutLogs = await exerciseLogRepository.findByDateRange(
      userId,
      startDate,
      endDate
    );
    
    // Calculate total workout duration
    const totalDuration = workoutLogs.reduce((total, log) => total + log.duration, 0);
    
    // Count total workouts
    const totalWorkouts = workoutLogs.length;
    
    res.json({
      period: period || 'week',
      startDate,
      endDate,
      totalCaloriesBurned,
      totalDuration,
      totalWorkouts,
    });
  } catch (error) {
    console.error('Get calorie summary error:', error);
    res.status(500).json({ error: 'Failed to get calorie summary' });
  }
});

export default router;