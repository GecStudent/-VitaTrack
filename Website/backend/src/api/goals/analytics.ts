import express from 'express';
import { Request, Response } from 'express';
import { JwtPayload } from '../../auth/types';
import goalRepository from '../../database/repositories/GoalRepository';
import weightLogRepository from '../../database/repositories/WeightLogRepository';
import bodyMeasurementRepository from '../../database/repositories/BodyMeasurementRepository';

const router = express.Router();

// GET /api/goals/analytics/summary - Get goal progress summary
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Get active goals
    const activeGoals = await goalRepository.findActiveGoals(userId);
    
    // Calculate progress for each goal
    const goalSummaries = await Promise.all(activeGoals.map(async (goal) => {
      let currentValue = 0;
      let progress = 0;
      
      // Get current value based on goal type
      if (goal.goal_type === 'weight') {
        const latestWeight = await weightLogRepository.getLatestWeight(userId);
        if (latestWeight) {
          currentValue = latestWeight.weight;
          // Calculate progress percentage
          const startValue = goal.starting_value || 0;
          const targetDiff = goal.target_value - startValue;
          const currentDiff = currentValue - startValue;
          progress = targetDiff !== 0 ? Math.min(100, Math.max(0, (currentDiff / targetDiff) * 100)) : 0;
        }
      }
      // Add other goal types here as needed
      
      return {
        id: goal.id,
        type: goal.goal_type,
        target: goal.target_value,
        current: currentValue,
        progress: Math.round(progress),
        startDate: goal.start_date,
        targetDate: goal.target_date,
      };
    }));
    
    res.json({
      activeGoals: goalSummaries.length,
      goals: goalSummaries
    });
  } catch (error) {
    console.error('Get goal analytics error:', error);
    res.status(500).json({ error: 'Failed to get goal analytics' });
  }
});

// GET /api/goals/analytics/weight/trend - Get weight trend analysis
router.get('/weight/trend', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Parse query parameters
    const { period = '30d' } = req.query;
    
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
        startDate.setDate(endDate.getDate() - 30);
    }
    
    // Get weight logs within date range
    const weightLogs = await weightLogRepository.findByDateRange(userId, startDate, endDate);
    
    // Calculate trend statistics
    let trend = 'stable';
    let changeRate = 0;
    let totalChange = 0;
    
    if (weightLogs.length >= 2) {
      const firstWeight = weightLogs[0].weight;
      const lastWeight = weightLogs[weightLogs.length - 1].weight;
      totalChange = lastWeight - firstWeight;
      
      // Calculate days between first and last log
      const daysDiff = Math.max(1, Math.round((weightLogs[weightLogs.length - 1].logDate.getTime() - weightLogs[0].logDate.getTime()) / (1000 * 60 * 60 * 24)));
      
      // Calculate average change per day
      changeRate = totalChange / daysDiff;
      
      // Determine trend
      if (changeRate < -0.05) trend = 'decreasing';
      else if (changeRate > 0.05) trend = 'increasing';
    }
    
    // Calculate moving average to smooth the data
    const movingAverages = [];
    const windowSize = 3; // 3-day moving average
    
    for (let i = 0; i < weightLogs.length; i++) {
      let sum = 0;
      let count = 0;
      
      for (let j = Math.max(0, i - windowSize + 1); j <= i; j++) {
        sum += weightLogs[j].weight;
        count++;
      }
      
      movingAverages.push({
        date: weightLogs[i].logDate,
        value: sum / count,
      });
    }
    
    // Check for plateau (no significant change over time)
    const isPlateau = Math.abs(changeRate) < 0.02 && weightLogs.length >= 7;
    
    res.json({
      period,
      dataPoints: weightLogs.length,
      trend,
      totalChange,
      changePerDay: changeRate,
      isPlateau,
      weightLogs: weightLogs.map(log => ({
        date: log.logDate,
        weight: log.weight,
      })),
      movingAverage: movingAverages,
    });
  } catch (error) {
    console.error('Get weight trend error:', error);
    res.status(500).json({ error: 'Failed to get weight trend analysis' });
  }
});

// GET /api/goals/analytics/measurements/trend - Get body measurements trend analysis
router.get('/measurements/trend', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Parse query parameters
    const { period = '30d', metric = 'waist' } = req.query;
    
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
        startDate.setDate(endDate.getDate() - 30);
    }
    
    // Get measurements within date range
    const measurements = await bodyMeasurementRepository.findByDateRange(userId, startDate, endDate);
    
    // Filter measurements that have the requested metric
    const filteredMeasurements = measurements.filter(m => {
      switch(metric) {
        case 'chest': return m.chestCm !== null && m.chestCm !== undefined;
        case 'waist': return m.waistCm !== null && m.waistCm !== undefined;
        case 'hips': return m.hipsCm !== null && m.hipsCm !== undefined;
        case 'biceps': return m.bicepsCm !== null && m.bicepsCm !== undefined;
        case 'thighs': return m.thighsCm !== null && m.thighsCm !== undefined;
        default: return m.waistCm !== null && m.waistCm !== undefined;
      }
    });
    
    // Extract the specific measurement values
    const metricValues = filteredMeasurements.map(m => {
      switch(metric) {
        case 'chest': return { date: m.logDate, value: m.chestCm };
        case 'waist': return { date: m.logDate, value: m.waistCm };
        case 'hips': return { date: m.logDate, value: m.hipsCm };
        case 'biceps': return { date: m.logDate, value: m.bicepsCm };
        case 'thighs': return { date: m.logDate, value: m.thighsCm };
        default: return { date: m.logDate, value: m.waistCm };
      }
    });
    
    // Calculate trend statistics
    let trend = 'stable';
    let changeRate = 0;
    let totalChange = 0;
    
    if (metricValues.length >= 2) {
      const firstValue = metricValues[0].value;
      const lastValue = metricValues[metricValues.length - 1].value;
      if (typeof firstValue === 'number' && typeof lastValue === 'number') {
        totalChange = lastValue - firstValue;
        // Calculate days between first and last log
        const daysDiff = Math.max(1, Math.round((new Date(metricValues[metricValues.length - 1].date).getTime() - new Date(metricValues[0].date).getTime()) / (1000 * 60 * 60 * 24)));
        // Calculate average change per day
        changeRate = totalChange / daysDiff;
        // Determine trend
        if (changeRate < -0.05) trend = 'decreasing';
        else if (changeRate > 0.05) trend = 'increasing';
      }
    }
    
    // Check for plateau (no significant change over time)
    const isPlateau = Math.abs(changeRate) < 0.02 && metricValues.length >= 7;
    
    res.json({
      period,
      metric,
      dataPoints: metricValues.length,
      trend,
      totalChange,
      changePerDay: changeRate,
      isPlateau,
      measurements: metricValues,
    });
  } catch (error) {
    console.error('Get measurements trend error:', error);
    res.status(500).json({ error: 'Failed to get measurements trend analysis' });
  }
});

export default router;