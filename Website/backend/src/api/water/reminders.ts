import express from 'express';
import { Request, Response } from 'express';
import Joi from 'joi';
import { JwtPayload } from '../../auth/types';
import { registerSchema } from '../../middleware/requestValidator';
import waterLogRepository from '../../database/repositories/WaterLogRepository';
import userDailyTargetRepository from '../../database/repositories/UserDailyTargetRepository';
import { AuditLogger } from '../../utils/auditLogger';

const router = express.Router();

// Schema for reminder settings
const reminderSettingsSchema = Joi.object({
  body: Joi.object({
    enabled: Joi.boolean().required(),
    startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(), // HH:MM format
    endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(), // HH:MM format
    interval: Joi.number().integer().min(30).max(240).required(), // minutes
    smartReminders: Joi.boolean().default(false),
    weekdaysOnly: Joi.boolean().default(false),
  }),
});

// Register schemas
registerSchema('PUT:/api/water/reminders/settings', reminderSettingsSchema);

// GET /api/water/reminders/settings - Get user's reminder settings
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // In a real implementation, this would fetch from a database
    // For now, we'll return default settings
    // This would typically be stored in user preferences or a dedicated table
    
    res.json({
      enabled: true,
      startTime: '08:00',
      endTime: '22:00',
      interval: 60, // minutes
      smartReminders: false,
      weekdaysOnly: false,
    });
  } catch (error) {
    console.error('Get reminder settings error:', error);
    res.status(500).json({ error: 'Failed to get reminder settings' });
  }
});

// PUT /api/water/reminders/settings - Update user's reminder settings
router.put('/settings', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const settings = req.body;
    
    // In a real implementation, this would update the database
    // For now, we'll just log the update and return the settings
    
    // Log the update of reminder settings
    AuditLogger.log('water_reminder_settings_updated', {
      userId,
      settings,
    });
    
    res.json(settings);
  } catch (error) {
    console.error('Update reminder settings error:', error);
    res.status(500).json({ error: 'Failed to update reminder settings' });
  }
});

// GET /api/water/reminders/next - Get next reminder time
router.get('/next', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Get today's water intake
    const today = new Date();
    const totalIntake = await waterLogRepository.getTotalWaterIntakeByDate(userId, today);
    
    // Get user's daily water target
    const waterTarget = await userDailyTargetRepository.getWaterTarget(userId) || 2000; // Default to 2000ml if not set
    
    // Calculate percentage of target achieved
    const percentComplete = (totalIntake / waterTarget) * 100;
    
    // Get current time
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // In a real implementation, this would use the user's reminder settings
    // For now, we'll use default settings
    const startTime = '08:00';
    const endTime = '22:00';
    const interval = 60; // minutes
    
    // Parse start and end times
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    // Calculate next reminder time
    let nextReminderTime = new Date();
    
    // If current time is before start time, set next reminder to start time
    if (currentHour < startHour || (currentHour === startHour && currentMinute < startMinute)) {
      nextReminderTime.setHours(startHour, startMinute, 0, 0);
    }
    // If current time is after end time, set next reminder to start time tomorrow
    else if (currentHour > endHour || (currentHour === endHour && currentMinute > endMinute)) {
      nextReminderTime.setDate(nextReminderTime.getDate() + 1);
      nextReminderTime.setHours(startHour, startMinute, 0, 0);
    }
    // Otherwise, calculate next interval
    else {
      // Calculate minutes since start time
      const minutesSinceStart = (currentHour - startHour) * 60 + (currentMinute - startMinute);
      // Calculate next interval
      const nextInterval = Math.ceil(minutesSinceStart / interval) * interval;
      // Calculate next reminder time
      nextReminderTime.setHours(startHour, startMinute + nextInterval, 0, 0);
      
      // If next reminder time is after end time, set to tomorrow's start time
      if (nextReminderTime.getHours() > endHour || 
          (nextReminderTime.getHours() === endHour && nextReminderTime.getMinutes() > endMinute)) {
        nextReminderTime.setDate(nextReminderTime.getDate() + 1);
        nextReminderTime.setHours(startHour, startMinute, 0, 0);
      }
    }
    
    // Calculate suggested intake based on remaining target and time left in the day
    const remainingTarget = waterTarget - totalIntake;
    const currentTime = new Date();
    const endTimeToday = new Date();
    endTimeToday.setHours(endHour, endMinute, 0, 0);
    
    let suggestedIntake = 250; // Default to 250ml
    
    if (remainingTarget > 0 && currentTime < endTimeToday) {
      // Calculate hours left in the day
      const hoursLeft = (endTimeToday.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
      // Calculate number of reminders left
      const remindersLeft = Math.max(1, Math.floor(hoursLeft * (60 / interval)));
      // Calculate suggested intake per reminder
      suggestedIntake = Math.ceil(remainingTarget / remindersLeft / 50) * 50; // Round to nearest 50ml
      suggestedIntake = Math.max(150, Math.min(500, suggestedIntake)); // Limit between 150ml and 500ml
    }
    
    res.json({
      nextReminder: nextReminderTime.toISOString(),
      suggestedIntake,
      currentIntake: totalIntake,
      remainingTarget,
      percentComplete: Math.round(percentComplete),
    });
  } catch (error) {
    console.error('Get next reminder error:', error);
    res.status(500).json({ error: 'Failed to get next reminder time' });
  }
});

export default router;