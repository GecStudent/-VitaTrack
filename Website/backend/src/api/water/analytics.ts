import express from 'express';
import { Request, Response } from 'express';
import { JwtPayload } from '../../auth/types';
import waterLogRepository from '../../database/repositories/WaterLogRepository';
import userDailyTargetRepository from '../../database/repositories/UserDailyTargetRepository';

const router = express.Router();

// GET /api/water/analytics/trend - Get water intake trend analysis
router.get('/trend', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Parse query parameters
    const { period = '7d' } = req.query;
    
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch(period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }
    
    // Get water logs within date range
    const waterLogs = await waterLogRepository.findByDateRange(userId, startDate, endDate);
    
    // Get user's daily water target
    const waterTarget = await userDailyTargetRepository.getWaterTarget(userId) || 2000; // Default to 2000ml if not set
    
    // Group water logs by day
    const dailyIntake: Record<string, number> = {};
    const days: string[] = [];
    
    // Initialize all days in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      dailyIntake[dateString] = 0;
      days.push(dateString);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Sum up water intake for each day
    waterLogs.forEach(log => {
      const dateString = log.logTime.toISOString().split('T')[0];
      if (dailyIntake[dateString] !== undefined) {
        dailyIntake[dateString] += log.amount;
      }
    });
    
    // Calculate statistics
    const dailyValues = Object.values(dailyIntake);
    const totalDays = dailyValues.length;
    const daysWithIntake = dailyValues.filter(v => v > 0).length;
    const daysMetTarget = dailyValues.filter(v => v >= waterTarget).length;
    
    const averageIntake = totalDays > 0 
      ? dailyValues.reduce((sum, val) => sum + val, 0) / totalDays 
      : 0;
    
    const consistency = totalDays > 0 
      ? (daysWithIntake / totalDays) * 100 
      : 0;
    
    const targetAchievement = totalDays > 0 
      ? (daysMetTarget / totalDays) * 100 
      : 0;
    
    // Identify patterns
    const weekdayIntake: Record<string, number[]> = {
      'Monday': [],
      'Tuesday': [],
      'Wednesday': [],
      'Thursday': [],
      'Friday': [],
      'Saturday': [],
      'Sunday': [],
    };
    
    days.forEach(dateString => {
      const date = new Date(dateString);
      const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
      weekdayIntake[dayOfWeek].push(dailyIntake[dateString]);
    });
    
    const weekdayAverages = Object.entries(weekdayIntake).reduce((acc, [day, values]) => {
      acc[day] = values.length > 0 
        ? values.reduce((sum, val) => sum + val, 0) / values.length 
        : 0;
      return acc;
    }, {} as Record<string, number>);
    
    // Find best and worst days
    const sortedDays = Object.entries(weekdayAverages)
      .sort((a, b) => b[1] - a[1]);
    
    const bestDay = sortedDays[0][0];
    const worstDay = sortedDays[sortedDays.length - 1][0];
    
    res.json({
      period,
      waterTarget,
      dailyIntake,
      statistics: {
        averageIntake: Math.round(averageIntake),
        consistency: Math.round(consistency),
        targetAchievement: Math.round(targetAchievement),
        daysTracked: totalDays,
        daysWithIntake,
        daysMetTarget,
      },
      patterns: {
        weekdayAverages,
        bestDay,
        worstDay,
      },
    });
  } catch (error) {
    console.error('Get water trend error:', error);
    res.status(500).json({ error: 'Failed to get water trend analysis' });
  }
});

// GET /api/water/analytics/dehydration-risk - Get dehydration risk assessment
router.get('/dehydration-risk', async (req: Request, res: Response) => {
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
    
    // Determine risk level based on percentage of target achieved
    let riskLevel = 'low';
    let recommendations = [];
    
    if (percentComplete < 30) {
      riskLevel = 'high';
      recommendations = [
        'Drink water immediately',
        'Set hourly reminders to drink water',
        'Keep a water bottle with you at all times',
        'Consider electrolyte supplements if active',
      ];
    } else if (percentComplete < 60) {
      riskLevel = 'medium';
      recommendations = [
        'Increase water intake in the next few hours',
        'Set a reminder to drink water every hour',
        'Keep a water bottle visible on your desk',
      ];
    } else {
      recommendations = [
        'Continue your good hydration habits',
        'Remember to drink water before, during, and after exercise',
        'Maintain consistent water intake throughout the day',
      ];
    }
    
    res.json({
      date: today.toISOString().split('T')[0],
      totalIntake,
      waterTarget,
      percentComplete: Math.round(percentComplete),
      riskLevel,
      recommendations,
    });
  } catch (error) {
    console.error('Get dehydration risk error:', error);
    res.status(500).json({ error: 'Failed to get dehydration risk assessment' });
  }
});

export default router;