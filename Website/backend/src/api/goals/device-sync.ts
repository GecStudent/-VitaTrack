import express from 'express';
import { Request, Response } from 'express';
import Joi from 'joi';
import { JwtPayload } from '../../auth/types';
import { registerSchema } from '../../middleware/requestValidator';
import weightLogRepository from '../../database/repositories/WeightLogRepository';
import bodyMeasurementRepository from '../../database/repositories/BodyMeasurementRepository';
import { AuditLogger } from '../../utils/auditLogger';
import { WeightLog } from '../../database/models/WeightLog';
import { BodyMeasurement } from '../../database/models/BodyMeasurement';

const router = express.Router();

// Schema for device data import
const deviceDataSchema = Joi.object({
  body: Joi.object({
    deviceType: Joi.string().valid('fitbit', 'garmin', 'apple_health', 'google_fit', 'withings', 'xiaomi').required(),
    data: Joi.object({
      weight: Joi.object({
        value: Joi.number().positive(),
        unit: Joi.string().valid('kg', 'lb').default('kg'),
        logDate: Joi.date().iso(),
        notes: Joi.string().max(500).optional(),
      }).optional(),
      measurements: Joi.object({
        chestCm: Joi.number().positive().optional(),
        waistCm: Joi.number().positive().optional(),
        hipsCm: Joi.number().positive().optional(),
        bicepsCm: Joi.number().positive().optional(),
        thighsCm: Joi.number().positive().optional(),
        logDate: Joi.date().iso(),
      }).optional(),
    }).required(),
  }),
});

// Register schema
registerSchema('POST:/api/goals/progress/devices/sync', deviceDataSchema);

// POST /api/goals/progress/devices/sync - Sync data from wearable devices
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const { deviceType, data } = req.body;
    
    const syncResults: { weight: WeightLog | null, measurements: BodyMeasurement | null } = {
      weight: null,
      measurements: null,
    };
    
    // Process weight data if provided
    if (data.weight) {
      let weightValue = data.weight.value;
      
      // Convert from lb to kg if needed
      if (data.weight.unit === 'lb') {
        weightValue = weightValue * 0.45359237; // Convert lb to kg
      }
      
      // Create weight log
      const weightLog = await weightLogRepository.create({
        userId,
        weight: weightValue,
        logDate: new Date(data.weight.logDate),
        notes: data.weight.notes
      });
      
      syncResults.weight = weightLog;
      
      // Log the creation of weight log
      AuditLogger.log('device_weight_sync', {
        userId,
        deviceType,
        weightLogId: weightLog.id,
      });
    }
    
    // Process measurements data if provided
    if (data.measurements) {
      const { chestCm, waistCm, hipsCm, bicepsCm, thighsCm, logDate } = data.measurements;
      
      // Create body measurements log
      const measurements = await bodyMeasurementRepository.create({
        userId,
        chestCm,
        waistCm,
        hipsCm,
        bicepsCm,
        thighsCm,
        logDate: new Date(logDate),
      });
      
      syncResults.measurements = measurements;
      
      // Log the creation of measurements
      AuditLogger.log('device_measurements_sync', {
        userId,
        deviceType,
        measurementsId: measurements.id,
      });
    }
    
    res.status(201).json({
      success: true,
      deviceType,
      syncResults,
    });
  } catch (error) {
    console.error('Device sync error:', error);
    res.status(500).json({ error: 'Failed to sync device data' });
  }
});

// GET /api/goals/progress/devices/supported - Get list of supported devices
router.get('/supported', (req: Request, res: Response) => {
  const supportedDevices = [
    {
      id: 'fitbit',
      name: 'Fitbit',
      description: 'Fitbit fitness trackers and smartwatches',
      dataTypes: ['weight', 'body_fat', 'sleep'],
    },
    {
      id: 'garmin',
      name: 'Garmin',
      description: 'Garmin fitness watches and devices',
      dataTypes: ['weight', 'body_composition'],
    },
    {
      id: 'apple_health',
      name: 'Apple Health',
      description: 'Health data from Apple devices',
      dataTypes: ['weight', 'body_measurements', 'body_fat'],
    },
    {
      id: 'google_fit',
      name: 'Google Fit',
      description: 'Fitness data from Google Fit',
      dataTypes: ['weight', 'body_fat'],
    },
    {
      id: 'withings',
      name: 'Withings',
      description: 'Withings smart scales and health devices',
      dataTypes: ['weight', 'body_fat', 'body_composition'],
    },
    {
      id: 'xiaomi',
      name: 'Xiaomi',
      description: 'Xiaomi smart scales and fitness bands',
      dataTypes: ['weight', 'body_fat'],
    },
  ];
  
  res.json(supportedDevices);
});

export default router;