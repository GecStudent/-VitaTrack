import express from 'express';
import { Request, Response } from 'express';
import Joi from 'joi';
import { JwtPayload } from '../../auth/types';
import { registerSchema } from '../../middleware/requestValidator';
import sleepLogRepository from '../../database/repositories/SleepLogRepository';
import { AuditLogger } from '../../utils/auditLogger';

const router = express.Router();

// Schema for device sleep data
const deviceSleepSchema = Joi.object({
  body: Joi.object({
    deviceId: Joi.string().required(),
    deviceType: Joi.string().required(),
    sleepData: Joi.array().items(
      Joi.object({
        sleepStart: Joi.date().iso().required(),
        sleepEnd: Joi.date().iso().required(),
        sleepStages: Joi.object({
          deep: Joi.number().min(0).required(),
          light: Joi.number().min(0).required(),
          rem: Joi.number().min(0).required(),
          awake: Joi.number().min(0).required(),
        }).required(),
      })
    ).required(),
  }),
});

// Register schemas
registerSchema('POST:/api/sleep/device-sync', deviceSleepSchema);

// POST /api/sleep/device-sync - Sync sleep data from wearable device
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const { deviceId, deviceType, sleepData } = req.body;
    
    // Process each sleep record
    const createdLogs = [];
    
    for (const record of sleepData) {
      const { sleepStart, sleepEnd, sleepStages } = record;
      
      const sleepStartDate = new Date(sleepStart);
      const sleepEndDate = new Date(sleepEnd);
      
      // Calculate duration in minutes
      const durationMinutes = Math.round((sleepEndDate.getTime() - sleepStartDate.getTime()) / (1000 * 60));
      
      // Validate sleep duration
      if (durationMinutes <= 0) {
        continue; // Skip invalid records
      }
      
      // Calculate sleep quality based on sleep stages
      // Formula: (deep*4 + rem*2 + light) / total_sleep_time * 10
      const totalSleepTime = sleepStages.deep + sleepStages.light + sleepStages.rem + sleepStages.awake;
      let quality = 0;
      
      if (totalSleepTime > 0) {
        quality = Math.round(((sleepStages.deep * 4 + sleepStages.rem * 2 + sleepStages.light) / totalSleepTime) * 10);
        // Ensure quality is between 1-10
        quality = Math.max(1, Math.min(10, quality));
      } else {
        quality = 5; // Default quality if no stage data
      }
      
      // Use the date of sleep start for log_date
      const logDate = new Date(sleepStartDate);
      logDate.setHours(0, 0, 0, 0);
      
      // Create sleep log
      const sleepLog = await sleepLogRepository.create({
        userId,
        sleepStart: sleepStartDate,
        sleepEnd: sleepEndDate,
        quality,
        logDate,
        notes: `Synced from ${deviceType} (${deviceId})`,
        sleepStages: JSON.stringify(sleepStages),
      } as any);
      
      createdLogs.push(sleepLog);
    }
    
    // Log the sync event
    AuditLogger.log('sleep_device_sync', {
      userId,
      deviceId,
      deviceType,
      recordsProcessed: sleepData.length,
      recordsCreated: createdLogs.length,
    });
    
    res.status(201).json({
      success: true,
      recordsProcessed: sleepData.length,
      recordsCreated: createdLogs.length,
      logs: createdLogs,
    });
  } catch (error) {
    console.error('Device sync error:', error);
    res.status(500).json({ error: 'Failed to sync sleep data from device' });
  }
});

// GET /api/sleep/device-sync/supported - Get list of supported devices
router.get('/supported', async (_req: Request, res: Response) => {
  try {
    // Return list of supported devices and their capabilities
    const supportedDevices = [
      {
        name: 'Fitbit',
        models: ['Sense', 'Versa', 'Charge'],
        capabilities: ['sleep_stages', 'heart_rate', 'movement'],
      },
      {
        name: 'Apple Watch',
        models: ['Series 3+'],
        capabilities: ['sleep_duration', 'heart_rate'],
      },
      {
        name: 'Garmin',
        models: ['Fenix', 'Forerunner', 'Venu'],
        capabilities: ['sleep_stages', 'heart_rate', 'movement', 'respiration'],
      },
      {
        name: 'Samsung',
        models: ['Galaxy Watch'],
        capabilities: ['sleep_stages', 'heart_rate', 'movement'],
      },
      {
        name: 'Oura Ring',
        models: ['All'],
        capabilities: ['sleep_stages', 'heart_rate', 'temperature', 'movement'],
      },
    ];
    
    res.json(supportedDevices);
  } catch (error) {
    console.error('Get supported devices error:', error);
    res.status(500).json({ error: 'Failed to get supported devices' });
  }
});

export default router;