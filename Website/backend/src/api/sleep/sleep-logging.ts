import express from 'express';
import { Request, Response } from 'express';
import Joi from 'joi';
import { JwtPayload } from '../../auth/types';
import { registerSchema } from '../../middleware/requestValidator';
import sleepLogRepository from '../../database/repositories/SleepLogRepository';
import userDailyTargetRepository from '../../database/repositories/UserDailyTargetRepository';
import { AuditLogger } from '../../utils/auditLogger';

const router = express.Router();

// Schema for sleep log creation
const sleepLogSchema = Joi.object({
  body: Joi.object({
    sleepStart: Joi.date().iso().required(),
    sleepEnd: Joi.date().iso().required(),
    quality: Joi.number().integer().min(1).max(10).required(),
    notes: Joi.string().allow('', null),
  }),
});

// Register schemas
registerSchema('POST:/api/sleep', sleepLogSchema);

// GET /api/sleep - Get sleep logs
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Parse query parameters
    const { startDate, endDate, date } = req.query;
    
    let sleepLogs;
    
    if (date) {
      // Get sleep logs for a specific date
      sleepLogs = await sleepLogRepository.findByDate(userId, new Date(date as string));
    } else if (startDate && endDate) {
      // Get sleep logs within date range
      sleepLogs = await sleepLogRepository.findByDateRange(
        userId, 
        new Date(startDate as string), 
        new Date(endDate as string)
      );
    } else {
      // Get all sleep logs
      sleepLogs = await sleepLogRepository.findByUserId(userId);
    }
    
    res.json(sleepLogs);
  } catch (error) {
    console.error('Get sleep logs error:', error);
    res.status(500).json({ error: 'Failed to get sleep logs' });
  }
});

// POST /api/sleep - Log sleep
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const { sleepStart, sleepEnd, quality, notes } = req.body;
    
    const sleepStartDate = new Date(sleepStart);
    const sleepEndDate = new Date(sleepEnd);
    
    // Calculate duration in minutes
    const durationMinutes = Math.round((sleepEndDate.getTime() - sleepStartDate.getTime()) / (1000 * 60));
    
    // Validate sleep duration
    if (durationMinutes <= 0) {
      return res.status(400).json({ error: 'Sleep end time must be after sleep start time' });
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
      notes,
    } as any);
    
    // Log the creation of sleep log
    AuditLogger.log('sleep_log_created', {
      userId,
      sleepLogId: sleepLog.id,
    });
    
    res.status(201).json(sleepLog);
  } catch (error) {
    console.error('Create sleep log error:', error);
    res.status(500).json({ error: 'Failed to create sleep log' });
  }
});

// GET /api/sleep/summary - Get sleep summary
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const { date } = req.query;
    
    const targetDate = date ? new Date(date as string) : new Date();
    
    // Get sleep logs for the day
    const sleepLogs = await sleepLogRepository.findByDate(userId, targetDate);
    
    // Calculate total sleep duration
    const totalDuration = sleepLogs.reduce((total, log) => {
      const duration = (log.sleepEnd.getTime() - log.sleepStart.getTime()) / (1000 * 60); // Convert to minutes
      return total + duration;
    }, 0);
    
    // Calculate average sleep quality
    const avgQuality = sleepLogs.length > 0 
      ? sleepLogs.reduce((sum, log) => sum + log.quality, 0) / sleepLogs.length 
      : 0;
    
    // Get recommended sleep duration (default to 8 hours = 480 minutes)
    const recommendedDuration = 480;
    
    res.json({
      date: targetDate.toISOString().split('T')[0],
      totalDuration,
      avgQuality,
      recommendedDuration,
      sleepDeficit: Math.max(0, recommendedDuration - totalDuration),
      sleepLogs,
    });
  } catch (error) {
    console.error('Get sleep summary error:', error);
    res.status(500).json({ error: 'Failed to get sleep summary' });
  }
});

// PUT /api/sleep/:id - Update sleep log
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const { sleepStart, sleepEnd, quality, notes } = req.body;
    
    // Check if the sleep log exists and belongs to the user
    const existingLog = await sleepLogRepository.findOne({
      where: { id, userId } as any,
    });
    
    if (!existingLog) {
      return res.status(404).json({ error: 'Sleep log not found' });
    }
    
    const sleepStartDate = sleepStart ? new Date(sleepStart) : existingLog.sleepStart;
    const sleepEndDate = sleepEnd ? new Date(sleepEnd) : existingLog.sleepEnd;
    
    // Calculate duration in minutes
    const durationMinutes = Math.round((sleepEndDate.getTime() - sleepStartDate.getTime()) / (1000 * 60));
    
    // Validate sleep duration
    if (durationMinutes <= 0) {
      return res.status(400).json({ error: 'Sleep end time must be after sleep start time' });
    }
    
    // Use the date of sleep start for log_date
    const logDate = new Date(sleepStartDate);
    logDate.setHours(0, 0, 0, 0);
    
    // Update the sleep log
    const updatedLog = await sleepLogRepository.update(id, {
      sleepStart: sleepStartDate,
      sleepEnd: sleepEndDate,
      quality: quality !== undefined ? quality : existingLog.quality,
      logDate,
      // TODO: The following line is commented out because 'notes' does not exist on 'SleepLog'.
      // notes: notes !== undefined ? notes : existingLog.notes,
    } as any);
    
    // Log the update of sleep log
    AuditLogger.log('sleep_log_updated', {
      userId,
      sleepLogId: id,
    });
    
    res.json(updatedLog);
  } catch (error) {
    console.error('Update sleep log error:', error);
    res.status(500).json({ error: 'Failed to update sleep log' });
  }
});

// DELETE /api/sleep/:id - Delete sleep log
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Check if the sleep log exists and belongs to the user
    const existingLog = await sleepLogRepository.findOne({
      where: { id, userId } as any,
    });
    
    if (!existingLog) {
      return res.status(404).json({ error: 'Sleep log not found' });
    }
    
    // Delete the sleep log
    await sleepLogRepository.delete(id);
    
    // Log the deletion of sleep log
    AuditLogger.log('sleep_log_deleted', {
      userId,
      sleepLogId: id,
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete sleep log error:', error);
    res.status(500).json({ error: 'Failed to delete sleep log' });
  }
});

export default router;