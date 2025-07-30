import express from 'express';
import { Request, Response } from 'express';
import Joi from 'joi';
import { JwtPayload } from '../../auth/types';
import { registerSchema } from '../../middleware/requestValidator';
import exerciseLogRepository from '../../database/repositories/ExerciseLogRepository';
import { AuditLogger } from '../../utils/auditLogger';

const router = express.Router();

// Schema for device data import
const deviceDataSchema = Joi.object({
  body: Joi.object({
    deviceType: Joi.string().valid('fitbit', 'garmin', 'apple_health', 'google_fit', 'strava').required(),
    workouts: Joi.array().items(
      Joi.object({
        exerciseId: Joi.string().required(),
        duration: Joi.number().integer().min(1).required(),
        sets: Joi.number().integer().min(1).optional(),
        reps: Joi.number().integer().min(1).optional(),
        weight: Joi.number().positive().optional(),
        logDate: Joi.date().iso().required(),
        caloriesBurned: Joi.number().positive().required(),
        heartRate: Joi.object({
          average: Joi.number().integer().min(30).max(220).required(),
          max: Joi.number().integer().min(30).max(220).required(),
        }).optional(),
        gpsData: Joi.array().items(
          Joi.object({
            latitude: Joi.number().required(),
            longitude: Joi.number().required(),
            timestamp: Joi.date().iso().required(),
            elevation: Joi.number().optional(),
          })
        ).optional(),
      })
    ).min(1).required(),
  }),
});

// Register schema for POST /api/exercise/devices/import
registerSchema('POST:/api/exercise/devices/import', deviceDataSchema);

// POST /api/exercise/devices/import - Import workout data from devices
router.post('/import', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const { deviceType, workouts } = req.body;
    
    const importedWorkouts = [];
    
    // Process each workout from the device data
    for (const workout of workouts) {
      const { exerciseId, duration, sets, reps, weight, logDate, caloriesBurned } = workout;
      
      // Create workout log
      const workoutLog = await exerciseLogRepository.create({
        userId,
        exerciseId,
        duration,
        sets,
        reps,
        weight,
        logDate: new Date(logDate),
        caloriesBurned,
      });
      
      // Store additional data like heart rate and GPS in a separate collection/table
      // This would typically be implemented with MongoDB or another storage solution
      // For now, we'll just include it in the response
      
      importedWorkouts.push({
        ...workoutLog,
        heartRate: workout.heartRate,
        gpsData: workout.gpsData,
      });
    }
    
    // Log the import of workout data
    AuditLogger.log('device_workout_imported', {
      userId,
      deviceType,
      workoutCount: workouts.length,
    });
    
    res.status(201).json({
      success: true,
      deviceType,
      importedCount: importedWorkouts.length,
      workouts: importedWorkouts,
    });
  } catch (error) {
    console.error('Import device data error:', error);
    res.status(500).json({ error: 'Failed to import device data' });
  }
});

// GET /api/exercise/devices/supported - Get list of supported devices
router.get('/supported', (req: Request, res: Response) => {
  const supportedDevices = [
    {
      id: 'fitbit',
      name: 'Fitbit',
      description: 'Fitbit fitness trackers and smartwatches',
      dataTypes: ['steps', 'heart_rate', 'workouts', 'sleep'],
    },
    {
      id: 'garmin',
      name: 'Garmin',
      description: 'Garmin fitness watches and devices',
      dataTypes: ['workouts', 'heart_rate', 'gps', 'sleep'],
    },
    {
      id: 'apple_health',
      name: 'Apple Health',
      description: 'Health data from Apple devices',
      dataTypes: ['workouts', 'steps', 'heart_rate', 'sleep'],
    },
    {
      id: 'google_fit',
      name: 'Google Fit',
      description: 'Fitness data from Google Fit',
      dataTypes: ['workouts', 'steps', 'heart_rate'],
    },
    {
      id: 'strava',
      name: 'Strava',
      description: 'Running and cycling workout data',
      dataTypes: ['workouts', 'gps', 'heart_rate'],
    },
  ];
  
  res.json(supportedDevices);
});

export default router;