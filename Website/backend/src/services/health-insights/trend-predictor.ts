import weightLogRepository from '../../database/repositories/WeightLogRepository';
import exerciseLogRepository from '../../database/repositories/ExerciseLogRepository';
import goalRepository from '../../database/repositories/GoalRepository';
import { getCache, setCache } from '../../database/cache/redisCache';

class TrendPredictor {
  /**
   * Predict health trends based on historical data
   */
  async predictTrends(userId: string, startDate: Date, endDate: Date) {
    // Create cache key
    const cacheKey = `trend-predictions:${userId}:${startDate.toISOString()}:${endDate.toISOString()}`;
    
    // Try to get from cache
    const cachedResult = await getCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    // Get weight logs
    const weightLogs = await weightLogRepository.findByDateRange(userId, startDate, endDate);
    
    // Get exercise logs
    const exerciseLogs = await exerciseLogRepository.findByDateRange(userId, startDate, endDate);
    
    // Get active goals
    const activeGoals = await goalRepository.findActiveGoals(userId);
    
    // Predict weight trend
    const weightTrend = this.predictWeightTrend(weightLogs, activeGoals);
    
    // Predict activity trend
    const activityTrend = this.predictActivityTrend(exerciseLogs);
    
    const result = {
      trends: {
        weight: weightTrend.trend,
        activity: activityTrend.trend
      },
      projections: {
        weight: weightTrend.projection,
        activity: activityTrend.projection,
        goalAchievement: this.predictGoalAchievement(weightLogs, exerciseLogs, activeGoals)
      }
    };
    
    // Cache result for 12 hours
    await setCache(cacheKey, result, 43200);
    
    return result;
  }
  
  /**
   * Predict weight trend based on historical data
   */
  private predictWeightTrend(weightLogs: any[], activeGoals: any[]) {
    if (weightLogs.length < 3) {
      return {
        trend: {
          direction: 'stable',
          confidence: 'low'
        },
        projection: {
          fourWeeks: null,
          eightWeeks: null,
          twelveWeeks: null
        }
      };
    }
    
    // Sort logs by date (oldest first)
    const sortedLogs = [...weightLogs].sort((a, b) => a.logDate.getTime() - b.logDate.getTime());
    
    // Calculate linear regression
    const xValues = sortedLogs.map(log => log.logDate.getTime());
    const yValues = sortedLogs.map(log => log.weight);
    
    const n = xValues.length;
    const sumX = xValues.reduce((sum, x) => sum + x, 0);
    const sumY = yValues.reduce((sum, y) => sum + y, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared to determine confidence
    const yMean = sumY / n;
    const ssTotal = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const ssResidual = yValues.reduce((sum, y, i) => sum + Math.pow(y - (slope * xValues[i] + intercept), 2), 0);
    const rSquared = 1 - (ssResidual / ssTotal);
    
    // Determine direction and confidence
    let direction = 'stable';
    if (slope * 604800000 > 0.1) direction = 'increasing'; // More than 0.1kg per week
    else if (slope * 604800000 < -0.1) direction = 'decreasing'; // Less than -0.1kg per week
    
    let confidence = 'low';
    if (rSquared > 0.7) confidence = 'high';
    else if (rSquared > 0.4) confidence = 'medium';
    
    // Project future weights
    const latestDate = Math.max(...xValues);
    const fourWeeksLater = latestDate + (4 * 7 * 24 * 60 * 60 * 1000);
    const eightWeeksLater = latestDate + (8 * 7 * 24 * 60 * 60 * 1000);
    const twelveWeeksLater = latestDate + (12 * 7 * 24 * 60 * 60 * 1000);
    
    const fourWeekProjection = slope * fourWeeksLater + intercept;
    const eightWeekProjection = slope * eightWeeksLater + intercept;
    const twelveWeekProjection = slope * twelveWeeksLater + intercept;
    
    return {
      trend: {
        direction,
        confidence,
        weeklyRate: parseFloat((slope * 604800000).toFixed(2)) // Convert to kg per week
      },
      projection: {
        fourWeeks: parseFloat(fourWeekProjection.toFixed(1)),
        eightWeeks: parseFloat(eightWeekProjection.toFixed(1)),
        twelveWeeks: parseFloat(twelveWeekProjection.toFixed(1))
      }
    };
  }
  
  /**
   * Predict activity trend based on historical data
   */
  private predictActivityTrend(exerciseLogs: any[]) {
    if (exerciseLogs.length < 7) {
      return {
        trend: {
          direction: 'stable',
          confidence: 'low'
        },
        projection: {
          nextWeek: null,
          nextMonth: null
        }
      };
    }
    
    // Group logs by day
    const logsByDay: Record<string, number> = {};
    exerciseLogs.forEach(log => {
      const dateString = log.logDate.toISOString().split('T')[0];
      if (!logsByDay[dateString]) logsByDay[dateString] = 0;
      logsByDay[dateString] += log.duration;
    });
    
    // Convert to arrays for regression
    const dates = Object.keys(logsByDay).sort();
    const xValues = dates.map(date => new Date(date).getTime());
    const yValues = dates.map(date => logsByDay[date]);
    
    // Calculate linear regression
    const n = xValues.length;
    const sumX = xValues.reduce((sum, x) => sum + x, 0);
    const sumY = yValues.reduce((sum, y) => sum + y, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const yMean = sumY / n;
    const ssTotal = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const ssResidual = yValues.reduce((sum, y, i) => sum + Math.pow(y - (slope * xValues[i] + intercept), 2), 0);
    const rSquared = 1 - (ssResidual / ssTotal);
    
    // Determine direction and confidence
    let direction = 'stable';
    if (slope * 86400000 > 1) direction = 'increasing'; // More than 1 minute per day
    else if (slope * 86400000 < -1) direction = 'decreasing'; // Less than -1 minute per day
    
    let confidence = 'low';
    if (rSquared > 0.6) confidence = 'high';
    else if (rSquared > 0.3) confidence = 'medium';
    
    // Project future activity
    const latestDate = Math.max(...xValues);
    const nextWeek = latestDate + (7 * 24 * 60 * 60 * 1000);
    const nextMonth = latestDate + (30 * 24 * 60 * 60 * 1000);
    
    const nextWeekProjection = slope * nextWeek + intercept;
    const nextMonthProjection = slope * nextMonth + intercept;
    
    return {
      trend: {
        direction,
        confidence,
        dailyRate: parseFloat((slope * 86400000).toFixed(1)) // Convert to minutes per day
      },
      projection: {
        nextWeek: Math.max(0, Math.round(nextWeekProjection)),
        nextMonth: Math.max(0, Math.round(nextMonthProjection))
      }
    };
  }
  
  /**
   * Predict goal achievement based on current trends
   */
  private predictGoalAchievement(weightLogs: any[], exerciseLogs: any[], activeGoals: any[]) {
    const predictions = [];
    
    // Weight goal prediction
    const weightGoal = activeGoals.find((goal: any) => goal.goal_type === 'weight');
    if (weightGoal && weightLogs.length >= 3) {
      // Sort logs by date (oldest first)
      const sortedLogs = [...weightLogs].sort((a, b) => a.logDate.getTime() - b.logDate.getTime());
      
      // Calculate linear regression
      const xValues = sortedLogs.map(log => log.logDate.getTime());
      const yValues = sortedLogs.map(log => log.weight);
      
      const n = xValues.length;
      const sumX = xValues.reduce((sum, x) => sum + x, 0);
      const sumY = yValues.reduce((sum, y) => sum + y, 0);
      const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
      const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      
      // Calculate time to reach goal
      const latestWeight = sortedLogs[sortedLogs.length - 1].weight;
      const targetWeight = weightGoal.target_value;
      const weightDiff = targetWeight - latestWeight;
      
      // If slope is too small, goal won't be reached
      if (Math.abs(slope) < 1e-10 || (weightDiff > 0 && slope < 0) || (weightDiff < 0 && slope > 0)) {
        predictions.push({
          goalId: weightGoal.id,
          goalType: 'weight',
          targetValue: targetWeight,
          currentValue: latestWeight,
          estimatedCompletion: null,
          achievable: false,
          message: 'Current trend will not lead to goal achievement'
        });
      } else {
        const timeToGoal = weightDiff / slope;
        const estimatedCompletion = new Date(latestWeight + timeToGoal);
        
        // Check if goal has a target date
        let achievable = true;
        let message = `Estimated to reach goal by ${estimatedCompletion.toISOString().split('T')[0]}`;
        
        if (weightGoal.target_date) {
          const targetDate = new Date(weightGoal.target_date);
          if (estimatedCompletion > targetDate) {
            achievable = false;
            message = `Unlikely to reach goal by target date (${targetDate.toISOString().split('T')[0]})`;
          } else {
            message = `On track to reach goal before target date (${targetDate.toISOString().split('T')[0]})`;
          }
        }
        
        predictions.push({
          goalId: weightGoal.id,
          goalType: 'weight',
          targetValue: targetWeight,
          currentValue: latestWeight,
          estimatedCompletion: estimatedCompletion.toISOString().split('T')[0],
          achievable,
          message
        });
      }
    }
    
    // Add predictions for other goal types as needed
    
    return predictions;
  }
}

export const trendPredictor = new TrendPredictor();