import express from 'express';
import { Request, Response } from 'express';
import { JwtPayload } from '../../auth/types';
import sleepLogRepository from '../../database/repositories/SleepLogRepository';

const router = express.Router();

// GET /api/sleep/analysis/trend - Get sleep trend analysis
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
    
    // Get sleep logs within date range
    const sleepLogs = await sleepLogRepository.findByDateRange(userId, startDate, endDate);
    
    // Group sleep logs by day
    const dailySleep: Record<string, { duration: number, quality: number, count: number }> = {};
    const days: string[] = [];
    
    // Initialize all days in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      dailySleep[dateString] = { duration: 0, quality: 0, count: 0 };
      days.push(dateString);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Sum up sleep duration and quality for each day
    sleepLogs.forEach(log => {
      const dateString = log.logDate.toISOString().split('T')[0];
      if (dailySleep[dateString]) {
        const duration = (log.sleepEnd.getTime() - log.sleepStart.getTime()) / (1000 * 60); // Convert to minutes
        dailySleep[dateString].duration += duration;
        dailySleep[dateString].quality += log.quality;
        dailySleep[dateString].count += 1;
      }
    });
    
    // Calculate averages for each day
    Object.keys(dailySleep).forEach(date => {
      if (dailySleep[date].count > 0) {
        dailySleep[date].quality = Math.round(dailySleep[date].quality / dailySleep[date].count);
      }
    });
    
    // Calculate statistics
    const daysWithSleep = Object.values(dailySleep).filter(day => day.duration > 0).length;
    const totalDays = days.length;
    
    // Calculate average sleep duration and quality
    let totalDuration = 0;
    let totalQuality = 0;
    let daysWithQualityData = 0;
    
    Object.values(dailySleep).forEach(day => {
      if (day.duration > 0) {
        totalDuration += day.duration;
        if (day.quality > 0) {
          totalQuality += day.quality;
          daysWithQualityData++;
        }
      }
    });
    
    const avgDuration = daysWithSleep > 0 ? totalDuration / daysWithSleep : 0;
    const avgQuality = daysWithQualityData > 0 ? totalQuality / daysWithQualityData : 0;
    
    // Identify patterns
    const weekdaySleep: Record<string, { durations: number[], qualities: number[] }> = {
      'Monday': { durations: [], qualities: [] },
      'Tuesday': { durations: [], qualities: [] },
      'Wednesday': { durations: [], qualities: [] },
      'Thursday': { durations: [], qualities: [] },
      'Friday': { durations: [], qualities: [] },
      'Saturday': { durations: [], qualities: [] },
      'Sunday': { durations: [], qualities: [] },
    };
    
    days.forEach(dateString => {
      const date = new Date(dateString);
      const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
      if (dailySleep[dateString].duration > 0) {
        weekdaySleep[dayOfWeek].durations.push(dailySleep[dateString].duration);
        if (dailySleep[dateString].quality > 0) {
          weekdaySleep[dayOfWeek].qualities.push(dailySleep[dateString].quality);
        }
      }
    });
    
    const weekdayAverages = Object.entries(weekdaySleep).reduce((acc, [day, data]) => {
      acc[day] = {
        duration: data.durations.length > 0 
          ? data.durations.reduce((sum, val) => sum + val, 0) / data.durations.length 
          : 0,
        quality: data.qualities.length > 0 
          ? data.qualities.reduce((sum, val) => sum + val, 0) / data.qualities.length 
          : 0,
      };
      return acc;
    }, {} as Record<string, { duration: number, quality: number }>);
    
    // Find best and worst days for sleep
    const sortedByDuration = Object.entries(weekdayAverages)
      .filter(([_, data]) => data.duration > 0)
      .sort((a, b) => b[1].duration - a[1].duration);
    
    const sortedByQuality = Object.entries(weekdayAverages)
      .filter(([_, data]) => data.quality > 0)
      .sort((a, b) => b[1].quality - a[1].quality);
    
    const bestDurationDay = sortedByDuration.length > 0 ? sortedByDuration[0][0] : null;
    const worstDurationDay = sortedByDuration.length > 0 ? sortedByDuration[sortedByDuration.length - 1][0] : null;
    
    const bestQualityDay = sortedByQuality.length > 0 ? sortedByQuality[0][0] : null;
    const worstQualityDay = sortedByQuality.length > 0 ? sortedByQuality[sortedByQuality.length - 1][0] : null;
    
    res.json({
      period,
      dailySleep,
      statistics: {
        avgDuration: Math.round(avgDuration),
        avgQuality: Math.round(avgQuality * 10) / 10,
        consistency: Math.round((daysWithSleep / totalDays) * 100),
        daysTracked: totalDays,
        daysWithSleep,
      },
      patterns: {
        weekdayAverages,
        bestDurationDay,
        worstDurationDay,
        bestQualityDay,
        worstQualityDay,
      },
    });
  } catch (error) {
    console.error('Get sleep trend error:', error);
    res.status(500).json({ error: 'Failed to get sleep trend analysis' });
  }
});

// GET /api/sleep/analysis/efficiency - Get sleep efficiency analysis
router.get('/efficiency', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Get recent sleep logs (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    
    const sleepLogs = await sleepLogRepository.findByDateRange(userId, startDate, endDate);
    
    if (sleepLogs.length === 0) {
      return res.json({
        efficiency: 0,
        qualityScore: 0,
        recommendations: [
          'Start tracking your sleep to get personalized efficiency analysis',
          'Aim for 7-9 hours of sleep per night',
          'Maintain a consistent sleep schedule',
        ],
      });
    }
    
    // Calculate average sleep duration
    let totalDuration = 0;
    let totalQuality = 0;
    
    sleepLogs.forEach(log => {
      const duration = (log.sleepEnd.getTime() - log.sleepStart.getTime()) / (1000 * 60); // Convert to minutes
      totalDuration += duration;
      totalQuality += log.quality;
    });
    
    const avgDuration = totalDuration / sleepLogs.length;
    const avgQuality = totalQuality / sleepLogs.length;
    
    // Calculate sleep efficiency (based on recommended 8 hours)
    const recommendedDuration = 480; // 8 hours in minutes
    const efficiency = Math.min(100, Math.round((avgDuration / recommendedDuration) * 100));
    
    // Calculate quality score (0-100)
    const qualityScore = Math.round((avgQuality / 10) * 100);
    
    // Generate recommendations based on efficiency and quality
    const recommendations = [];
    
    if (efficiency < 70) {
      recommendations.push('Your sleep duration is below recommended levels');
      recommendations.push('Aim for 7-9 hours of sleep per night');
      recommendations.push('Create a consistent bedtime routine');
    } else if (efficiency > 110) {
      recommendations.push('You may be sleeping more than necessary');
      recommendations.push('Excessive sleep can sometimes indicate other health issues');
      recommendations.push('Consider consulting with a healthcare provider');
    } else {
      recommendations.push('Your sleep duration is within recommended ranges');
      recommendations.push('Maintain your consistent sleep schedule');
    }
    
    if (qualityScore < 60) {
      recommendations.push('Your sleep quality could be improved');
      recommendations.push('Ensure your bedroom is dark, quiet, and cool');
      recommendations.push('Avoid screens at least 1 hour before bedtime');
      recommendations.push('Consider relaxation techniques before sleep');
    } else {
      recommendations.push('Your sleep quality is good');
      recommendations.push('Continue your good sleep hygiene practices');
    }
    
    res.json({
      efficiency,
      qualityScore,
      avgDuration: Math.round(avgDuration),
      avgQuality: Math.round(avgQuality * 10) / 10,
      recommendations,
    });
  } catch (error) {
    console.error('Get sleep efficiency error:', error);
    res.status(500).json({ error: 'Failed to get sleep efficiency analysis' });
  }
});

// GET /api/sleep/analysis/debt - Calculate sleep debt
router.get('/debt', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Get sleep logs for the past week
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);
    
    const sleepLogs = await sleepLogRepository.findByDateRange(userId, startDate, endDate);
    
    // Group sleep logs by day
    const dailySleep: Record<string, number> = {};
    
    // Initialize all days in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      dailySleep[dateString] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Sum up sleep duration for each day
    sleepLogs.forEach(log => {
      const dateString = log.logDate.toISOString().split('T')[0];
      if (dailySleep[dateString] !== undefined) {
        const duration = (log.sleepEnd.getTime() - log.sleepStart.getTime()) / (1000 * 60); // Convert to minutes
        dailySleep[dateString] += duration;
      }
    });
    
    // Calculate sleep debt (based on recommended 8 hours per day)
    const recommendedDailyDuration = 480; // 8 hours in minutes
    let totalDebt = 0;
    
    Object.values(dailySleep).forEach(duration => {
      if (duration < recommendedDailyDuration) {
        totalDebt += (recommendedDailyDuration - duration);
      }
    });
    
    // Calculate average daily sleep
    const totalSleep = Object.values(dailySleep).reduce((sum, duration) => sum + duration, 0);
    const avgDailySleep = totalSleep / Object.keys(dailySleep).length;
    
    // Generate recommendations based on sleep debt
    const recommendations = [];
    
    if (totalDebt > 600) { // More than 10 hours of sleep debt
      recommendations.push('You have significant sleep debt');
      recommendations.push('Try to add 1-2 hours of sleep for the next few days');
      recommendations.push('Avoid caffeine after noon');
      recommendations.push('Consider a power nap (20-30 minutes) during the day');
    } else if (totalDebt > 300) { // 5-10 hours of sleep debt
      recommendations.push('You have moderate sleep debt');
      recommendations.push('Try to add an extra hour of sleep for the next few days');
      recommendations.push('Maintain a consistent sleep schedule, even on weekends');
    } else if (totalDebt > 0) { // Some sleep debt
      recommendations.push('You have minor sleep debt');
      recommendations.push('Try to get a full night\'s sleep (7-9 hours) for the next few days');
    } else { // No sleep debt
      recommendations.push('You have no sleep debt');
      recommendations.push('Continue your good sleep habits');
    }
    
    res.json({
      totalDebt: Math.round(totalDebt),
      dailySleep,
      avgDailySleep: Math.round(avgDailySleep),
      recommendedDailyDuration,
      recommendations,
    });
  } catch (error) {
    console.error('Get sleep debt error:', error);
    res.status(500).json({ error: 'Failed to calculate sleep debt' });
  }
});

export default router;