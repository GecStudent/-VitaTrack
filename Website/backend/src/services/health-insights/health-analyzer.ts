import weightLogRepository from '../../database/repositories/WeightLogRepository';
import sleepLogRepository from '../../database/repositories/SleepLogRepository';
import exerciseLogRepository from '../../database/repositories/ExerciseLogRepository';
import mealLogRepository from '../../database/repositories/MealLogRepository';
import waterLogRepository from '../../database/repositories/WaterLogRepository';
import goalRepository from '../../database/repositories/GoalRepository';
import userRepository from '../../database/repositories/UserRepository';
import { getCache, setCache } from '../../database/cache/redisCache';

class HealthAnalyzer {
  /**
   * Analyze user health data across multiple dimensions
   */
  async analyzeHealthData(userId: string, startDate: Date, endDate: Date) {
    // Create cache key
    const cacheKey = `health-analysis:${userId}:${startDate.toISOString()}:${endDate.toISOString()}`;
    
    // Try to get from cache
    const cachedResult = await getCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    // Get user data
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get weight logs
    const weightLogs = await weightLogRepository.findByDateRange(userId, startDate, endDate);
    
    // Get sleep logs
    const sleepLogs = await sleepLogRepository.findByDateRange(userId, startDate, endDate);
    
    // Get exercise logs
    const exerciseLogs = await exerciseLogRepository.findByDateRange(userId, startDate, endDate);
    
    // Get meal logs
    const mealLogs = await mealLogRepository.findByDateRange(userId, startDate, endDate);
    
    // Get water logs
    const waterLogs = await waterLogRepository.findByDateRange(userId, startDate, endDate);
    
    // Get active goals
    const activeGoals = await goalRepository.findActiveGoals(userId);
    
    // Analyze weight trends
    const weightTrend = this.analyzeWeightTrend(weightLogs, activeGoals);
    
    // Analyze sleep quality and patterns
    const sleepQuality = this.analyzeSleepQuality(sleepLogs);
    const sleepPatterns = this.analyzeSleepPatterns(sleepLogs);
    
    // Analyze activity trends
    const activityTrends = this.analyzeActivityTrends(exerciseLogs);
    
    // Analyze correlations between different health metrics
    const correlations = this.analyzeCorrelations({
      weightLogs,
      sleepLogs,
      exerciseLogs,
      mealLogs,
      waterLogs
    });
    
    // Calculate overall health score
    const overallScore = this.calculateOverallHealthScore({
      weightTrend,
      sleepQuality,
      sleepPatterns,
      activityTrends,
      waterLogs,
      mealLogs
    });
    
    // Identify key findings and improvement areas
    const keyFindings = this.identifyKeyFindings({
      weightTrend,
      sleepQuality,
      sleepPatterns,
      activityTrends,
      correlations
    });
    
    const improvementAreas = this.identifyImprovementAreas({
      weightTrend,
      sleepQuality,
      sleepPatterns,
      activityTrends,
      waterLogs,
      mealLogs
    });
    
    const result = {
      overallScore,
      keyFindings,
      improvementAreas,
      weightTrend,
      sleepQuality,
      sleepPatterns,
      activityTrends,
      correlations
    };
    
    // Cache result for 6 hours
    await setCache(cacheKey, result, 21600);
    
    return result;
  }
  
  /**
   * Analyze weight trend and alignment with goals
   */
  private analyzeWeightTrend(weightLogs: any[], activeGoals: any[]) {
    if (weightLogs.length < 2) {
      return {
        direction: 'stable',
        rate: 0,
        goalAlignment: 'neutral',
        dataPoints: weightLogs.length
      };
    }
    
    // Sort logs by date (newest first)
    const sortedLogs = [...weightLogs].sort((a, b) => b.logDate.getTime() - a.logDate.getTime());
    
    const newestWeight = sortedLogs[0].weight;
    const oldestWeight = sortedLogs[sortedLogs.length - 1].weight;
    const weightDiff = newestWeight - oldestWeight;
    
    // Calculate days between first and last measurement
    const daysDiff = (sortedLogs[0].logDate.getTime() - sortedLogs[sortedLogs.length - 1].logDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Calculate weekly rate of change
    const weeklyRate = (weightDiff / daysDiff) * 7;
    
    // Determine direction
    let direction = 'stable';
    if (weeklyRate > 0.2) direction = 'increasing';
    else if (weeklyRate < -0.2) direction = 'decreasing';
    
    // Check alignment with weight goal if exists
    let goalAlignment = 'neutral';
    const weightGoal = activeGoals.find(goal => goal.goal_type === 'weight');
    
    if (weightGoal) {
      if (weightGoal.target_value < oldestWeight && direction === 'decreasing') {
        goalAlignment = 'positive';
      } else if (weightGoal.target_value < oldestWeight && direction !== 'decreasing') {
        goalAlignment = 'negative';
      } else if (weightGoal.target_value > oldestWeight && direction === 'increasing') {
        goalAlignment = 'positive';
      } else if (weightGoal.target_value > oldestWeight && direction !== 'increasing') {
        goalAlignment = 'negative';
      }
    }
    
    return {
      direction,
      rate: parseFloat(weeklyRate.toFixed(2)),
      goalAlignment,
      dataPoints: weightLogs.length
    };
  }
  
  /**
   * Analyze sleep quality
   */
  private analyzeSleepQuality(sleepLogs: any[]) {
    if (sleepLogs.length === 0) {
      return {
        average: 0,
        trend: 'neutral',
        dataPoints: 0
      };
    }
    
    const totalQuality = sleepLogs.reduce((sum, log) => sum + log.quality, 0);
    const averageQuality = totalQuality / sleepLogs.length;
    
    // Determine trend by comparing first and second half of the period
    let trend = 'neutral';
    if (sleepLogs.length >= 6) {
      const midpoint = Math.floor(sleepLogs.length / 2);
      const recentLogs = sleepLogs.slice(0, midpoint);
      const olderLogs = sleepLogs.slice(midpoint);
      
      const recentAvg = recentLogs.reduce((sum, log) => sum + log.quality, 0) / recentLogs.length;
      const olderAvg = olderLogs.reduce((sum, log) => sum + log.quality, 0) / olderLogs.length;
      
      if (recentAvg > olderAvg + 0.5) trend = 'improving';
      else if (recentAvg < olderAvg - 0.5) trend = 'declining';
    }
    
    return {
      average: parseFloat(averageQuality.toFixed(1)),
      trend,
      dataPoints: sleepLogs.length
    };
  }
  
  /**
   * Analyze sleep patterns
   */
  private analyzeSleepPatterns(sleepLogs: any[]) {
    if (sleepLogs.length === 0) {
      return {
        averageDuration: 0,
        consistencyScore: 0,
        dataPoints: 0
      };
    }
    
    // Calculate average duration in minutes
    let totalDuration = 0;
    sleepLogs.forEach(log => {
      const duration = (log.sleepEnd.getTime() - log.sleepStart.getTime()) / (1000 * 60);
      totalDuration += duration;
    });
    const averageDuration = totalDuration / sleepLogs.length;
    
    // Calculate consistency score based on bedtime variation
    let consistencyScore = 1.0;
    if (sleepLogs.length >= 3) {
      const bedtimes = sleepLogs.map(log => {
        const bedtime = new Date(log.sleepStart);
        return bedtime.getHours() * 60 + bedtime.getMinutes(); // Convert to minutes from midnight
      });
      
      // Calculate standard deviation of bedtimes
      const avgBedtime = bedtimes.reduce((sum, time) => sum + time, 0) / bedtimes.length;
      const squaredDiffs = bedtimes.map(time => Math.pow(time - avgBedtime, 2));
      const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / bedtimes.length;
      const stdDev = Math.sqrt(variance);
      
      // Convert standard deviation to a 0-1 consistency score (lower stdDev = higher consistency)
      consistencyScore = Math.max(0, Math.min(1, 1 - (stdDev / 120))); // 120 minutes (2 hours) variation = 0 consistency
    }
    
    return {
      averageDuration: Math.round(averageDuration),
      consistencyScore: parseFloat(consistencyScore.toFixed(2)),
      dataPoints: sleepLogs.length
    };
  }
  
  /**
   * Analyze activity trends
   */
  private analyzeActivityTrends(exerciseLogs: any[]) {
    if (exerciseLogs.length === 0) {
      return {
        averageMinutesPerDay: 0,
        averageCaloriesPerDay: 0,
        consistencyScore: 0,
        trend: 'neutral',
        dataPoints: 0
      };
    }
    
    // Group logs by date
    const logsByDate: Record<string, { duration: number, calories: number }> = {};
    exerciseLogs.forEach(log => {
      const dateString = log.logDate.toISOString().split('T')[0];
      if (!logsByDate[dateString]) {
        logsByDate[dateString] = { duration: 0, calories: 0 };
      }
      logsByDate[dateString].duration += log.duration;
      logsByDate[dateString].calories += log.caloriesBurned;
    });
    
    const uniqueDays = Object.keys(logsByDate).length;
    const totalDuration = Object.values(logsByDate).reduce((sum, day) => sum + day.duration, 0);
    const totalCalories = Object.values(logsByDate).reduce((sum, day) => sum + day.calories, 0);
    
    // Calculate average minutes and calories per day
    const averageMinutesPerDay = totalDuration / uniqueDays;
    const averageCaloriesPerDay = totalCalories / uniqueDays;
    
    // Calculate consistency score (days with activity / total days in range)
    const startDate = new Date(Math.min(...exerciseLogs.map(log => log.logDate.getTime())));
    const endDate = new Date(Math.max(...exerciseLogs.map(log => log.logDate.getTime())));
    const totalDaysInRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const consistencyScore = uniqueDays / totalDaysInRange;
    
    // Determine trend
    let trend = 'neutral';
    if (exerciseLogs.length >= 6) {
      // Sort logs by date
      const sortedLogs = [...exerciseLogs].sort((a, b) => a.logDate.getTime() - b.logDate.getTime());
      
      // Split into first and second half
      const midpoint = Math.floor(sortedLogs.length / 2);
      const olderLogs = sortedLogs.slice(0, midpoint);
      const recentLogs = sortedLogs.slice(midpoint);
      
      const olderDuration = olderLogs.reduce((sum, log) => sum + log.duration, 0);
      const recentDuration = recentLogs.reduce((sum, log) => sum + log.duration, 0);
      
      if (recentDuration > olderDuration * 1.2) trend = 'increasing';
      else if (recentDuration < olderDuration * 0.8) trend = 'decreasing';
    }
    
    return {
      averageMinutesPerDay: Math.round(averageMinutesPerDay),
      averageCaloriesPerDay: Math.round(averageCaloriesPerDay),
      consistencyScore: parseFloat(consistencyScore.toFixed(2)),
      trend,
      dataPoints: exerciseLogs.length
    };
  }
  
  /**
   * Analyze correlations between different health metrics
   */
  private analyzeCorrelations(logs: {
    weightLogs: any[],
    sleepLogs: any[],
    exerciseLogs: any[],
    mealLogs: any[],
    waterLogs: any[]
  }) {
    const correlations = [];
    
    // Group data by day for correlation analysis
    const dataByDay: Record<string, any> = {};
    
    // Process weight logs
    logs.weightLogs.forEach(log => {
      const dateString = log.logDate.toISOString().split('T')[0];
      if (!dataByDay[dateString]) dataByDay[dateString] = {};
      dataByDay[dateString].weight = log.weight;
    });
    
    // Process sleep logs
    logs.sleepLogs.forEach(log => {
      const dateString = log.logDate.toISOString().split('T')[0];
      if (!dataByDay[dateString]) dataByDay[dateString] = {};
      if (!dataByDay[dateString].sleepQuality) dataByDay[dateString].sleepQuality = log.quality;
      else dataByDay[dateString].sleepQuality = Math.max(dataByDay[dateString].sleepQuality, log.quality);
      
      const duration = (log.sleepEnd.getTime() - log.sleepStart.getTime()) / (1000 * 60);
      if (!dataByDay[dateString].sleepDuration) dataByDay[dateString].sleepDuration = duration;
      else dataByDay[dateString].sleepDuration += duration;
    });
    
    // Process exercise logs
    logs.exerciseLogs.forEach(log => {
      const dateString = log.logDate.toISOString().split('T')[0];
      if (!dataByDay[dateString]) dataByDay[dateString] = {};
      if (!dataByDay[dateString].exerciseDuration) dataByDay[dateString].exerciseDuration = 0;
      if (!dataByDay[dateString].exerciseCalories) dataByDay[dateString].exerciseCalories = 0;
      
      dataByDay[dateString].exerciseDuration += log.duration;
      dataByDay[dateString].exerciseCalories += log.caloriesBurned;
    });
    
    // Process water logs
    logs.waterLogs.forEach(log => {
      const dateString = log.logTime.toISOString().split('T')[0];
      if (!dataByDay[dateString]) dataByDay[dateString] = {};
      if (!dataByDay[dateString].waterIntake) dataByDay[dateString].waterIntake = 0;
      
      dataByDay[dateString].waterIntake += log.amount;
    });
    
    // Check for correlations between sleep and exercise
    const sleepExerciseDays = Object.keys(dataByDay).filter(date => 
      dataByDay[date].sleepQuality !== undefined && dataByDay[date].exerciseDuration !== undefined);
    
    if (sleepExerciseDays.length >= 5) {
      const exerciseDays = sleepExerciseDays.filter(date => dataByDay[date].exerciseDuration > 0);
      const nonExerciseDays = sleepExerciseDays.filter(date => dataByDay[date].exerciseDuration === 0);
      
      if (exerciseDays.length > 0 && nonExerciseDays.length > 0) {
        const exerciseSleepQuality = exerciseDays.reduce((sum, date) => sum + dataByDay[date].sleepQuality, 0) / exerciseDays.length;
        const nonExerciseSleepQuality = nonExerciseDays.reduce((sum, date) => sum + dataByDay[date].sleepQuality, 0) / nonExerciseDays.length;
        
        const qualityDifference = exerciseSleepQuality - nonExerciseSleepQuality;
        
        if (Math.abs(qualityDifference) >= 0.5) {
          correlations.push({
            factor1: 'exercise',
            factor2: 'sleep_quality',
            relationship: qualityDifference > 0 ? 'positive' : 'negative',
            strength: Math.abs(qualityDifference) > 1 ? 'strong' : 'moderate',
            description: qualityDifference > 0 
              ? 'Exercise appears to improve your sleep quality' 
              : 'Exercise appears to negatively affect your sleep quality',
          });
        }
      }
    }
    
    // Check for correlations between water intake and sleep
    const sleepWaterDays = Object.keys(dataByDay).filter(date => 
      dataByDay[date].sleepQuality !== undefined && dataByDay[date].waterIntake !== undefined);
    
    if (sleepWaterDays.length >= 5) {
      const highWaterDays = sleepWaterDays.filter(date => dataByDay[date].waterIntake >= 2000);
      const lowWaterDays = sleepWaterDays.filter(date => dataByDay[date].waterIntake < 2000);
      
      if (highWaterDays.length > 0 && lowWaterDays.length > 0) {
        const highWaterSleepQuality = highWaterDays.reduce((sum, date) => sum + dataByDay[date].sleepQuality, 0) / highWaterDays.length;
        const lowWaterSleepQuality = lowWaterDays.reduce((sum, date) => sum + dataByDay[date].sleepQuality, 0) / lowWaterDays.length;
        
        const qualityDifference = highWaterSleepQuality - lowWaterSleepQuality;
        
        if (Math.abs(qualityDifference) >= 0.5) {
          correlations.push({
            factor1: 'water_intake',
            factor2: 'sleep_quality',
            relationship: qualityDifference > 0 ? 'positive' : 'negative',
            strength: Math.abs(qualityDifference) > 1 ? 'strong' : 'moderate',
            description: qualityDifference > 0 
              ? 'Higher water intake appears to improve your sleep quality' 
              : 'Higher water intake appears to negatively affect your sleep quality',
          });
        }
      }
    }
    
    return correlations;
  }
  
  /**
   * Calculate overall health score based on multiple factors
   */
  private calculateOverallHealthScore(data: any) {
    let score = 0;
    let factorsCount = 0;
    
    // Weight trend score (0-20)
    if (data.weightTrend.dataPoints > 0) {
      let weightScore = 10; // Neutral score
      if (data.weightTrend.goalAlignment === 'positive') weightScore = 20;
      else if (data.weightTrend.goalAlignment === 'negative') weightScore = 5;
      
      score += weightScore;
      factorsCount++;
    }
    
    // Sleep quality score (0-20)
    if (data.sleepQuality.dataPoints > 0) {
      const sleepScore = Math.min(20, data.sleepQuality.average * 2);
      score += sleepScore;
      factorsCount++;
    }
    
    // Sleep consistency score (0-10)
    if (data.sleepPatterns.dataPoints > 0) {
      const consistencyScore = data.sleepPatterns.consistencyScore * 10;
      score += consistencyScore;
      factorsCount++;
    }
    
    // Activity level score (0-20)
    if (data.activityTrends.dataPoints > 0) {
      let activityScore = 0;
      if (data.activityTrends.averageMinutesPerDay >= 30) {
        activityScore = 10 + Math.min(10, (data.activityTrends.averageMinutesPerDay - 30) / 3);
      } else {
        activityScore = Math.min(10, data.activityTrends.averageMinutesPerDay / 3);
      }
      
      score += activityScore;
      factorsCount++;
    }
    
    // Activity consistency score (0-10)
    if (data.activityTrends.dataPoints > 0) {
      const consistencyScore = data.activityTrends.consistencyScore * 10;
      score += consistencyScore;
      factorsCount++;
    }
    
    // Water intake score (0-10)
    if (data.waterLogs.length > 0) {
      // Calculate average daily water intake
      const waterByDay: Record<string, number> = {};
      data.waterLogs.forEach((log: any) => {
        const dateString = log.logTime.toISOString().split('T')[0];
        if (!waterByDay[dateString]) waterByDay[dateString] = 0;
        waterByDay[dateString] += log.amount;
      });
      
      const avgWaterIntake = Object.values(waterByDay).reduce((sum: number, amount: any) => sum + amount, 0) / Object.keys(waterByDay).length;
      const waterScore = Math.min(10, avgWaterIntake / 250); // 2500ml = 10 points
      
      score += waterScore;
      factorsCount++;
    }
    
    // Calculate final score (0-100)
    const finalScore = factorsCount > 0 ? Math.round((score / factorsCount) * 10) : 0;
    return Math.min(100, Math.max(0, finalScore));
  }
  
  /**
   * Identify key findings from health data
   */
  private identifyKeyFindings(data: any) {
    const findings = [];
    
    // Weight findings
    if (data.weightTrend.dataPoints > 0) {
      if (data.weightTrend.goalAlignment === 'positive') {
        findings.push('You\'re making good progress toward your weight goal');
      } else if (data.weightTrend.goalAlignment === 'negative') {
        findings.push('Your weight trend is not aligned with your goal');
      }
    }
    
    // Sleep findings
    if (data.sleepQuality.dataPoints > 0) {
      if (data.sleepQuality.average >= 8) {
        findings.push('Your sleep quality is excellent');
      } else if (data.sleepQuality.average < 6) {
        findings.push('Your sleep quality needs improvement');
      }
      
      if (data.sleepPatterns.consistencyScore >= 0.8) {
        findings.push('You have a very consistent sleep schedule');
      } else if (data.sleepPatterns.consistencyScore < 0.5) {
        findings.push('Your sleep schedule is inconsistent');
      }
    }
    
    // Activity findings
    if (data.activityTrends.dataPoints > 0) {
      if (data.activityTrends.averageMinutesPerDay >= 60) {
        findings.push('You\'re maintaining an excellent activity level');
      } else if (data.activityTrends.averageMinutesPerDay < 30) {
        findings.push('Your activity level is below recommendations');
      }
      
      if (data.activityTrends.trend === 'increasing') {
        findings.push('Your activity level is increasing');
      } else if (data.activityTrends.trend === 'decreasing') {
        findings.push('Your activity level is decreasing');
      }
    }
    
    // Correlation findings
    if (data.correlations.length > 0) {
      data.correlations.forEach((correlation: any) => {
        if (correlation.strength === 'strong') {
          findings.push(correlation.description);
        }
      });
    }
    
    return findings;
  }
  
  /**
   * Identify areas for improvement
   */
  private identifyImprovementAreas(data: any) {
    const areas = [];
    
    // Weight improvement
    if (data.weightTrend.dataPoints > 0 && data.weightTrend.goalAlignment === 'negative') {
      areas.push('Weight management');
    }
    
    // Sleep improvement
    if (data.sleepQuality.dataPoints > 0) {
      if (data.sleepQuality.average < 7) {
        areas.push('Sleep quality');
      }
      
      if (data.sleepPatterns.consistencyScore < 0.6) {
        areas.push('Sleep consistency');
      }
      
      if (data.sleepPatterns.averageDuration < 420 || data.sleepPatterns.averageDuration > 540) {
        areas.push('Sleep duration');
      }
    }
    
    // Activity improvement
    if (data.activityTrends.dataPoints > 0) {
      if (data.activityTrends.averageMinutesPerDay < 30) {
        areas.push('Physical activity');
      }
      
      if (data.activityTrends.consistencyScore < 0.5) {
        areas.push('Exercise consistency');
      }
    }
    
    // Water intake improvement
    if (data.waterLogs.length > 0) {
      // Calculate average daily water intake
      const waterByDay: Record<string, number> = {};
      data.waterLogs.forEach((log: any) => {
        const dateString = log.logTime.toISOString().split('T')[0];
        if (!waterByDay[dateString]) waterByDay[dateString] = 0;
        waterByDay[dateString] += log.amount;
      });
      
      const avgWaterIntake = Object.values(waterByDay).reduce((sum: number, amount: any) => sum + amount, 0) / Object.keys(waterByDay).length;
      
      if (avgWaterIntake < 2000) {
        areas.push('Hydration');
      }
    }
    
    return areas;
  }
}

export const healthAnalyzer = new HealthAnalyzer();