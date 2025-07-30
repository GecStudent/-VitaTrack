import express from 'express';
import { Request, Response } from 'express';
import Joi from 'joi';
import { JwtPayload } from '../../auth/types';
import { registerSchema } from '../../middleware/requestValidator';
import waterLogRepository from '../../database/repositories/WaterLogRepository';
import userDailyTargetRepository from '../../database/repositories/UserDailyTargetRepository';
import { AuditLogger } from '../../utils/auditLogger';

const router = express.Router();

// Schema for water log creation
const waterLogSchema = Joi.object({
  body: Joi.object({
    amount: Joi.number().positive().required(),
    logTime: Joi.date().iso().default(() => new Date()),
  }),
});

// Schema for updating daily water target
const waterTargetSchema = Joi.object({
  body: Joi.object({
    waterMl: Joi.number().positive().required(),
  }),
});

// Register schemas
registerSchema('POST:/api/water', waterLogSchema);
registerSchema('PUT:/api/water/target', waterTargetSchema);

// GET /api/water - Get water logs
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Parse query parameters
    const { startDate, endDate, date } = req.query;
    
    let waterLogs;
    
    if (date) {
      // Get water logs for a specific date
      waterLogs = await waterLogRepository.findByDate(userId, new Date(date as string));
    } else if (startDate && endDate) {
      // Get water logs within date range
      waterLogs = await waterLogRepository.findByDateRange(
        userId, 
        new Date(startDate as string), 
        new Date(endDate as string)
      );
    } else {
      // Get all water logs
      waterLogs = await waterLogRepository.findByUserId(userId);
    }
    
    res.json(waterLogs);
  } catch (error) {
    console.error('Get water logs error:', error);
    res.status(500).json({ error: 'Failed to get water logs' });
  }
});

// POST /api/water - Log water intake
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const { amount, logTime } = req.body;
    
    // Create water log
    const waterLog = await waterLogRepository.create({
      userId,
      amount,
      logTime: new Date(logTime),
    });
    
    // Log the creation of water log
    AuditLogger.log('water_log_created', {
      userId,
      waterLogId: waterLog.id,
    });
    
    res.status(201).json(waterLog);
  } catch (error) {
    console.error('Create water log error:', error);
    res.status(500).json({ error: 'Failed to create water log' });
  }
});

// GET /api/water/summary - Get water intake summary
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const { date } = req.query;
    
    const targetDate = date ? new Date(date as string) : new Date();
    
    // Get water intake for the day
    const totalIntake = await waterLogRepository.getTotalWaterIntakeByDate(userId, targetDate);
    
    // Get user's daily water target
    const waterTarget = await userDailyTargetRepository.getWaterTarget(userId) || 2000; // Default to 2000ml if not set
    
    // Calculate percentage of target achieved
    const percentComplete = Math.min(100, Math.round((totalIntake / waterTarget) * 100));
    
    res.json({
      date: targetDate.toISOString().split('T')[0],
      totalIntake,
      waterTarget,
      percentComplete,
      remaining: Math.max(0, waterTarget - totalIntake),
    });
  } catch (error) {
    console.error('Get water summary error:', error);
    res.status(500).json({ error: 'Failed to get water intake summary' });
  }
});

// GET /api/water/target - Get user's daily water target
router.get('/target', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    const target = await userDailyTargetRepository.getWaterTarget(userId);
    
    res.json({
      waterTarget: target || 2000, // Default to 2000ml if not set
    });
  } catch (error) {
    console.error('Get water target error:', error);
    res.status(500).json({ error: 'Failed to get water target' });
  }
});

// PUT /api/water/target - Update user's daily water target
router.put('/target', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const { waterMl } = req.body;
    
    const updatedTarget = await userDailyTargetRepository.updateWaterTarget(userId, waterMl);
    
    // Log the update of water target
    AuditLogger.log('water_target_updated', {
      userId,
      waterTarget: waterMl,
    });
    
    res.json({
      waterTarget: updatedTarget.waterMl,
    });
  } catch (error) {
    console.error('Update water target error:', error);
    res.status(500).json({ error: 'Failed to update water target' });
  }
});

// PUT /api/water/:id - Update water log
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const { amount, logTime } = req.body;
    
    // Check if the water log exists and belongs to the user
    const existingLog = await waterLogRepository.findOne({
      where: { id, userId },
    });
    
    if (!existingLog) {
      return res.status(404).json({ error: 'Water log not found' });
    }
    
    // Update the water log
    const updatedLog = await waterLogRepository.update(id, {
      amount,
      logTime: logTime ? new Date(logTime) : undefined,
    });
    
    // Log the update of water log
    AuditLogger.log('water_log_updated', {
      userId,
      waterLogId: id,
    });
    
    res.json(updatedLog);
  } catch (error) {
    console.error('Update water log error:', error);
    res.status(500).json({ error: 'Failed to update water log' });
  }
});

// DELETE /api/water/:id - Delete water log
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Check if the water log exists and belongs to the user
    const existingLog = await waterLogRepository.findOne({
      where: { id, userId },
    });
    
    if (!existingLog) {
      return res.status(404).json({ error: 'Water log not found' });
    }
    
    // Delete the water log
    await waterLogRepository.delete(id);
    
    // Log the deletion of water log
    AuditLogger.log('water_log_deleted', {
      userId,
      waterLogId: id,
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete water log error:', error);
    res.status(500).json({ error: 'Failed to delete water log' });
  }
});

export default router;