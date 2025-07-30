import express from 'express';
import { Request, Response } from 'express';
import Joi from 'joi';
import { JwtPayload } from '../../auth/types';
import { registerSchema } from '../../middleware/requestValidator';
import exerciseLogRepository from '../../database/repositories/ExerciseLogRepository';
import exerciseRepository from '../../database/repositories/ExerciseRepository';
import { AuditLogger } from '../../utils/auditLogger';
import { withTransaction } from '../../database/connection';

const router = express.Router();

// Schema for workout log creation
const workoutLogSchema = Joi.object({
  body: Joi.object({
    exerciseId: Joi.string().required(),
    duration: Joi.number().integer().min(1).required(),
    sets: Joi.number().integer().min(1).optional(),
    reps: Joi.number().integer().min(1).optional(),
    weight: Joi.number().positive().optional(),
    logDate: Joi.date().iso().required(),
    caloriesBurned: Joi.number().positive().optional(),
  }),
});

// Register schema for POST /api/exercise/workouts
registerSchema('POST:/api/exercise/workouts', workoutLogSchema);

// GET /api/exercise/workouts - Get user workouts
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Parse query parameters
    const { startDate, endDate, date, exerciseId } = req.query;
    
    let workoutLogs;
    
    if (startDate && endDate) {
      // Get workouts within date range
      workoutLogs = await exerciseLogRepository.findByDateRange(
        userId, 
        new Date(startDate as string), 
        new Date(endDate as string)
      );
    } else if (date) {
      // Get workouts for a specific date
      workoutLogs = await exerciseLogRepository.findByDate(userId, new Date(date as string));
    } else if (exerciseId) {
      // Get workouts for a specific exercise
      workoutLogs = await exerciseLogRepository.findByExerciseId(userId, exerciseId as string);
    } else {
      // Get all workouts (default to last 7 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      workoutLogs = await exerciseLogRepository.findByDateRange(userId, startDate, endDate);
    }
    
    res.json(workoutLogs);
  } catch (error) {
    console.error('Get workout logs error:', error);
    res.status(500).json({ error: 'Failed to get workout logs' });
  }
});

// POST /api/exercise/workouts - Log a workout
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const { exerciseId, duration, sets, reps, weight, logDate, caloriesBurned } = req.body;
    
    // Verify that the exercise exists
    const exercise = await exerciseRepository.findById(exerciseId);
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }
    
    // Calculate calories burned if not provided
    let calculatedCaloriesBurned = caloriesBurned;
    if (!calculatedCaloriesBurned) {
      calculatedCaloriesBurned = Math.round(exercise.caloriesPerMin * duration);
    }
    
    // Create workout log
    const workoutLog = await exerciseLogRepository.create({
      userId,
      exerciseId,
      duration,
      sets,
      reps,
      weight,
      logDate: new Date(logDate),
      caloriesBurned: calculatedCaloriesBurned,
    });
    
    // Log the creation of workout log
    AuditLogger.log('workout_log_created', {
      userId,
      workoutLogId: workoutLog.id,
      exerciseId,
      exerciseName: exercise.name,
    });
    
    // Include the exercise details in the response
    const response = {
      ...workoutLog,
      exercise,
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Create workout log error:', error);
    res.status(500).json({ error: 'Failed to create workout log' });
  }
});

// GET /api/exercise/workouts/:id - Get workout details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    const workoutLog = await exerciseLogRepository.findOne({
      where: { id, userId },
      relations: ['exercise'],
    });
    
    if (!workoutLog) {
      return res.status(404).json({ error: 'Workout log not found' });
    }
    
    res.json(workoutLog);
  } catch (error) {
    console.error('Get workout details error:', error);
    res.status(500).json({ error: 'Failed to get workout details' });
  }
});

// PUT /api/exercise/workouts/:id - Update workout
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const { duration, sets, reps, weight, logDate, caloriesBurned } = req.body;
    
    // Check if the workout log exists and belongs to the user
    const existingLog = await exerciseLogRepository.findOne({
      where: { id, userId },
    });
    
    if (!existingLog) {
      return res.status(404).json({ error: 'Workout log not found' });
    }
    
    // Update the workout log
    const updatedLog = await exerciseLogRepository.update(id, {
      duration,
      sets,
      reps,
      weight,
      logDate: logDate ? new Date(logDate) : undefined,
      caloriesBurned,
    });
    
    // Log the update of workout log
    AuditLogger.log('workout_log_updated', {
      userId,
      workoutLogId: id,
    });
    
    res.json(updatedLog);
  } catch (error) {
    console.error('Update workout log error:', error);
    res.status(500).json({ error: 'Failed to update workout log' });
  }
});

// DELETE /api/exercise/workouts/:id - Delete workout
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Check if the workout log exists and belongs to the user
    const existingLog = await exerciseLogRepository.findOne({
      where: { id, userId },
    });
    
    if (!existingLog) {
      return res.status(404).json({ error: 'Workout log not found' });
    }
    
    // Delete the workout log
    const result = await exerciseLogRepository.delete(id);
    
    if (!result) {
      return res.status(500).json({ error: 'Failed to delete workout log' });
    }
    
    // Log the deletion of workout log
    AuditLogger.log('workout_log_deleted', {
      userId,
      workoutLogId: id,
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete workout log error:', error);
    res.status(500).json({ error: 'Failed to delete workout log' });
  }
});

export default router;