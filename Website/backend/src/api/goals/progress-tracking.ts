import express from 'express';
import { Request, Response } from 'express';
import Joi from 'joi';
import { JwtPayload } from '../../auth/types';
import { registerSchema } from '../../middleware/requestValidator';
import weightLogRepository from '../../database/repositories/WeightLogRepository';
import bodyMeasurementRepository from '../../database/repositories/BodyMeasurementRepository';
import { AuditLogger } from '../../utils/auditLogger';

const router = express.Router();

// Schema for weight log creation
const weightLogSchema = Joi.object({
  body: Joi.object({
    weight: Joi.number().positive().required(),
    logDate: Joi.date().iso().required(),
    notes: Joi.string().max(500).optional(),
  }),
});

// Schema for body measurements creation
const measurementsSchema = Joi.object({
  body: Joi.object({
    chestCm: Joi.number().positive().optional(),
    waistCm: Joi.number().positive().optional(),
    hipsCm: Joi.number().positive().optional(),
    bicepsCm: Joi.number().positive().optional(),
    thighsCm: Joi.number().positive().optional(),
    logDate: Joi.date().iso().required(),
  }).min(2), // At least one measurement plus the date
});

// Register schemas
registerSchema('POST:/api/goals/progress/weight', weightLogSchema);
registerSchema('POST:/api/goals/progress/measurements', measurementsSchema);

// GET /api/goals/progress/weight - Get weight logs
router.get('/weight', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Parse query parameters
    const { startDate, endDate } = req.query;
    
    let weightLogs;
    
    if (startDate && endDate) {
      // Get weight logs within date range
      weightLogs = await weightLogRepository.findByDateRange(
        userId, 
        new Date(startDate as string), 
        new Date(endDate as string)
      );
    } else {
      // Get all weight logs
      weightLogs = await weightLogRepository.findByUserId(userId);
    }
    
    res.json(weightLogs);
  } catch (error) {
    console.error('Get weight logs error:', error);
    res.status(500).json({ error: 'Failed to get weight logs' });
  }
});

// POST /api/goals/progress/weight - Log weight
router.post('/weight', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const { weight, logDate, notes } = req.body;
    
    // Create weight log
    const weightLog = await weightLogRepository.create({
      userId,
      weight,
      logDate: new Date(logDate),
      notes
    });
    
    // Log the creation of weight log
    AuditLogger.log('weight_log_created', {
      userId,
      weightLogId: weightLog.id,
    });
    
    res.status(201).json(weightLog);
  } catch (error) {
    console.error('Create weight log error:', error);
    res.status(500).json({ error: 'Failed to create weight log' });
  }
});

// GET /api/goals/progress/measurements - Get body measurements
router.get('/measurements', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Parse query parameters
    const { startDate, endDate } = req.query;
    
    let measurements;
    
    if (startDate && endDate) {
      // Get measurements within date range
      measurements = await bodyMeasurementRepository.findByDateRange(
        userId, 
        new Date(startDate as string), 
        new Date(endDate as string)
      );
    } else {
      // Get all measurements
      measurements = await bodyMeasurementRepository.findByUserId(userId);
    }
    
    res.json(measurements);
  } catch (error) {
    console.error('Get measurements error:', error);
    res.status(500).json({ error: 'Failed to get measurements' });
  }
});

// POST /api/goals/progress/measurements - Log measurements
router.post('/measurements', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const { chestCm, waistCm, hipsCm, bicepsCm, thighsCm, logDate } = req.body;
    
    // Create body measurements log
    const measurements = await bodyMeasurementRepository.create({
      userId,
      chestCm,
      waistCm,
      hipsCm,
      bicepsCm,
      thighsCm,
      logDate: new Date(logDate)
    });
    
    // Log the creation of measurements
    AuditLogger.log('measurements_created', {
      userId,
      measurementsId: measurements.id,
    });
    
    res.status(201).json(measurements);
  } catch (error) {
    console.error('Create measurements error:', error);
    res.status(500).json({ error: 'Failed to create measurements' });
  }
});

// PUT /api/goals/progress/weight/:id - Update weight log
router.put('/weight/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const { weight, logDate, notes } = req.body;
    
    // Check if the weight log exists and belongs to the user
    const existingLog = await weightLogRepository.findOne({
      where: { id, userId },
    });
    
    if (!existingLog) {
      return res.status(404).json({ error: 'Weight log not found' });
    }
    
    // Update the weight log
    const updatedLog = await weightLogRepository.update(id, {
      weight,
      logDate: logDate ? new Date(logDate) : undefined,
      notes
    });
    
    // Log the update of weight log
    AuditLogger.log('weight_log_updated', {
      userId,
      weightLogId: id,
    });
    
    res.json(updatedLog);
  } catch (error) {
    console.error('Update weight log error:', error);
    res.status(500).json({ error: 'Failed to update weight log' });
  }
});

// PUT /api/goals/progress/measurements/:id - Update measurements
router.put('/measurements/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const { chestCm, waistCm, hipsCm, bicepsCm, thighsCm, logDate } = req.body;
    
    // Check if the measurements exist and belong to the user
    const existingMeasurements = await bodyMeasurementRepository.findOne({
      where: { id, userId },
    });
    
    if (!existingMeasurements) {
      return res.status(404).json({ error: 'Measurements not found' });
    }
    
    // Update the measurements
    const updatedMeasurements = await bodyMeasurementRepository.update(id, {
      chestCm,
      waistCm,
      hipsCm,
      bicepsCm,
      thighsCm,
      logDate: logDate ? new Date(logDate) : undefined
    });
    
    // Log the update of measurements
    AuditLogger.log('measurements_updated', {
      userId,
      measurementsId: id,
    });
    
    res.json(updatedMeasurements);
  } catch (error) {
    console.error('Update measurements error:', error);
    res.status(500).json({ error: 'Failed to update measurements' });
  }
});

// DELETE /api/goals/progress/weight/:id - Delete weight log
router.delete('/weight/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Check if the weight log exists and belongs to the user
    const existingLog = await weightLogRepository.findOne({
      where: { id, userId },
    });
    
    if (!existingLog) {
      return res.status(404).json({ error: 'Weight log not found' });
    }
    
    // Delete the weight log
    await weightLogRepository.delete(id);
    
    // Log the deletion of weight log
    AuditLogger.log('weight_log_deleted', {
      userId,
      weightLogId: id,
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete weight log error:', error);
    res.status(500).json({ error: 'Failed to delete weight log' });
  }
});

// DELETE /api/goals/progress/measurements/:id - Delete measurements
router.delete('/measurements/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Check if the measurements exist and belong to the user
    const existingMeasurements = await bodyMeasurementRepository.findOne({
      where: { id, userId },
    });
    
    if (!existingMeasurements) {
      return res.status(404).json({ error: 'Measurements not found' });
    }
    
    // Delete the measurements
    await bodyMeasurementRepository.delete(id);
    
    // Log the deletion of measurements
    AuditLogger.log('measurements_deleted', {
      userId,
      measurementsId: id,
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete measurements error:', error);
    res.status(500).json({ error: 'Failed to delete measurements' });
  }
});

export default router;