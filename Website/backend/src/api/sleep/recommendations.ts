import express from 'express';
import { Request, Response } from 'express';
import { JwtPayload } from '../../auth/types';
import sleepLogRepository from '../../database/repositories/SleepLogRepository';
import waterLogRepository from '../../database/repositories/WaterLogRepository';
import mealLogRepository from '../../database/repositories/MealLogRepository';
import exerciseLogRepository from '../../database/repositories/ExerciseLogRepository';

const router = express.Router();

// GET /api/sleep/recommendations - Get personalized sleep recommendations
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Get recent sleep logs (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    
    const sleepLogs = await sleepLogRepository.findByDateRange(userId, startDate, endDate);
    
    // Generate general recommendations if no sleep data
    if (sleepLogs.length === 0) {
      return res.json({
        generalRecommendations: [
          'Aim for 7-9 hours of sleep per night',
          'Maintain a consistent sleep schedule',
          'Create a relaxing bedtime routine',
          'Ensure your bedroom is dark, quiet, and cool',
          'Avoid caffeine and alcohol before bedtime',
          'Limit screen time before bed',
        ],
        personalizedRecommendations: [],
      });
    }
    
    // Calculate average sleep metrics
    let totalDuration = 0;
    let totalQuality = 0;
    let earliestBedtime = new Date();
    let latestBedtime = new Date(0);
    
    sleepLogs.forEach(log => {
      const duration = (log.sleepEnd.getTime() - log.sleepStart.getTime()) / (1000 * 60); // Convert to minutes
      totalDuration += duration;
      totalQuality += log.quality;
      
      // Track bedtime patterns
      const bedtime = new Date(log.sleepStart);
      bedtime.setFullYear(1970, 0, 1); // Normalize date to compare only time
      
      if (bedtime < earliestBedtime) earliestBedtime = bedtime;
      if (bedtime > latestBedtime) latestBedtime = bedtime;
    });
    
    const avgDuration = totalDuration / sleepLogs.length;
    const avgQuality = totalQuality / sleepLogs.length;
    
    // Generate personalized recommendations based on sleep patterns
    const personalizedRecommendations = [];
    
    // Duration-based recommendations
    if (avgDuration < 420) { // Less than 7 hours
      personalizedRecommendations.push('Your average sleep duration is below recommended levels');
      personalizedRecommendations.push('Try going to bed 30 minutes earlier');
      personalizedRecommendations.push('Avoid using electronic devices at least 1 hour before bedtime');
    } else if (avgDuration > 540) { // More than 9 hours
      personalizedRecommendations.push('You may be sleeping more than necessary');
      personalizedRecommendations.push('Ensure you\'re getting quality sleep rather than just quantity');
      personalizedRecommendations.push('Consider consulting with a healthcare provider if you feel excessively tired');
    } else {
      personalizedRecommendations.push('Your sleep duration is within the recommended range');
      personalizedRecommendations.push('Continue maintaining your healthy sleep duration');
    }
    
    // Quality-based recommendations
    if (avgQuality < 6) {
      personalizedRecommendations.push('Your sleep quality could be improved');
      personalizedRecommendations.push('Ensure your bedroom is dark, quiet, and at a comfortable temperature');
      personalizedRecommendations.push('Consider relaxation techniques like meditation before sleep');
      personalizedRecommendations.push('Limit fluid intake before bedtime to reduce nighttime awakenings');
    } else {
      personalizedRecommendations.push('Your sleep quality is good');
      personalizedRecommendations.push('Continue your good sleep hygiene practices');
    }
    
    // Consistency-based recommendations
    const bedtimeDifference = (latestBedtime.getTime() - earliestBedtime.getTime()) / (1000 * 60); // in minutes
    if (bedtimeDifference > 90) { // More than 1.5 hours variation
      personalizedRecommendations.push('Your bedtime varies significantly');
      personalizedRecommendations.push('Try to maintain a more consistent sleep schedule');
      personalizedRecommendations.push('Go to bed and wake up at the same time every day, even on weekends');
    } else {
      personalizedRecommendations.push('You have a consistent sleep schedule');
      personalizedRecommendations.push('Continue maintaining your regular sleep-wake times');
    }
    
    res.json({
      generalRecommendations: [
        'Aim for 7-9 hours of sleep per night',
        'Maintain a consistent sleep schedule',
        'Create a relaxing bedtime routine',
        'Ensure your bedroom is dark, quiet, and cool',
        'Avoid caffeine and alcohol before bedtime',
        'Limit screen time before bed',
      ],
      personalizedRecommendations,
      sleepMetrics: {
        avgDuration: Math.round(avgDuration),
        avgQuality: Math.round(avgQuality * 10) / 10,
        bedtimeVariation: Math.round(bedtimeDifference),
      },
    });
  } catch (error) {
    console.error('Get sleep recommendations error:', error);
    res.status(500).json({ error: 'Failed to get sleep recommendations' });
  }
});

// GET /api/sleep/recommendations/correlation - Get correlation analysis with other health metrics
router.get('/correlation', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Get data for the past 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    
    // Get sleep logs
    const sleepLogs = await sleepLogRepository.findByDateRange(userId, startDate, endDate);
    
    // If not enough sleep data, return limited analysis
    if (sleepLogs.length < 7) {
      return res.json({
        message: 'Not enough sleep data for correlation analysis',
        minimumRequired: 7,
        daysLogged: sleepLogs.length,
      });
    }
    
    // Group sleep data by day
    const sleepByDay: Record<string, { duration: number, quality: number }> = {};
    
    sleepLogs.forEach(log => {
      const dateString = log.logDate.toISOString().split('T')[0];
      if (!sleepByDay[dateString]) {
        sleepByDay[dateString] = { duration: 0, quality: 0 };
      }
      
      const duration = (log.sleepEnd.getTime() - log.sleepStart.getTime()) / (1000 * 60); // Convert to minutes
      sleepByDay[dateString].duration += duration;
      sleepByDay[dateString].quality = Math.max(sleepByDay[dateString].quality, log.quality); // Use highest quality if multiple logs
    });
    
    // Get water logs
    const waterLogs = await waterLogRepository.findByDateRange(userId, startDate, endDate);
    
    // Group water data by day
    const waterByDay: Record<string, number> = {};
    
    waterLogs.forEach(log => {
      const dateString = log.logTime.toISOString().split('T')[0];
      if (!waterByDay[dateString]) {
        waterByDay[dateString] = 0;
      }
      waterByDay[dateString] += log.amount;
    });
    
    // Get exercise logs
    const exerciseLogs = await exerciseLogRepository.findByDateRange(userId, startDate, endDate);
    
    // Group exercise data by day
    const exerciseByDay: Record<string, number> = {};
    
    exerciseLogs.forEach(log => {
      const dateString = log.logDate.toISOString().split('T')[0];
      if (!exerciseByDay[dateString]) {
        exerciseByDay[dateString] = 0;
      }
      exerciseByDay[dateString] += log.duration;
    });
    
    // Get meal logs (for evening meals)
    const mealLogs = await mealLogRepository.findByDateRange(userId, startDate, endDate);
    
    // Group evening meal data by day (meals after 6 PM)
    const eveningMealsByDay: Record<string, boolean> = {};
    
    mealLogs.forEach(log => {
      // TODO: The following line is commented out because 'mealTime' does not exist on 'MealLog'.
      // const mealTime = new Date(log.mealTime);
      const dateString = log.logDate.toISOString().split('T')[0];
      
      // Check if meal was after 6 PM
      // if (log.mealTime.getHours() >= 18) { // Assuming log.mealTime is the correct property
      //   eveningMealsByDay[dateString] = true;
      // }
    });
    
    // Analyze correlations
    const correlations = [];
    
    // Check water intake correlation
    const waterCorrelationDays = Object.keys(sleepByDay).filter(date => waterByDay[date] !== undefined);
    if (waterCorrelationDays.length >= 5) {
      const highWaterDays = waterCorrelationDays.filter(date => waterByDay[date] >= 2000); // 2L or more
      const lowWaterDays = waterCorrelationDays.filter(date => waterByDay[date] < 2000);
      
      if (highWaterDays.length > 0 && lowWaterDays.length > 0) {
        const highWaterSleepQuality = highWaterDays.reduce((sum, date) => sum + sleepByDay[date].quality, 0) / highWaterDays.length;
        const lowWaterSleepQuality = lowWaterDays.reduce((sum, date) => sum + sleepByDay[date].quality, 0) / lowWaterDays.length;
        
        const qualityDifference = highWaterSleepQuality - lowWaterSleepQuality;
        
        if (Math.abs(qualityDifference) >= 0.5) {
          correlations.push({
            factor: 'water_intake',
            impact: qualityDifference > 0 ? 'positive' : 'negative',
            strength: Math.abs(qualityDifference) > 1 ? 'strong' : 'moderate',
            description: qualityDifference > 0 
              ? 'Higher water intake appears to improve your sleep quality' 
              : 'Higher water intake appears to negatively affect your sleep quality',
            recommendation: qualityDifference > 0 
              ? 'Continue staying well-hydrated throughout the day' 
              : 'Try to consume most of your water earlier in the day to reduce nighttime awakenings',
          });
        }
      }
    }
    
    // Check exercise correlation
    const exerciseCorrelationDays = Object.keys(sleepByDay).filter(date => exerciseByDay[date] !== undefined);
    if (exerciseCorrelationDays.length >= 5) {
      const exerciseDays = exerciseCorrelationDays.filter(date => exerciseByDay[date] > 0);
      const nonExerciseDays = exerciseCorrelationDays.filter(date => exerciseByDay[date] === 0);
      
      if (exerciseDays.length > 0 && nonExerciseDays.length > 0) {
        const exerciseSleepQuality = exerciseDays.reduce((sum, date) => sum + sleepByDay[date].quality, 0) / exerciseDays.length;
        const nonExerciseSleepQuality = nonExerciseDays.reduce((sum, date) => sum + sleepByDay[date].quality, 0) / nonExerciseDays.length;
        
        const qualityDifference = exerciseSleepQuality - nonExerciseSleepQuality;
        
        if (Math.abs(qualityDifference) >= 0.5) {
          correlations.push({
            factor: 'exercise',
            impact: qualityDifference > 0 ? 'positive' : 'negative',
            strength: Math.abs(qualityDifference) > 1 ? 'strong' : 'moderate',
            description: qualityDifference > 0 
              ? 'Exercise appears to improve your sleep quality' 
              : 'Exercise appears to negatively affect your sleep quality',
            recommendation: qualityDifference > 0 
              ? 'Continue your regular exercise routine for better sleep' 
              : 'Try exercising earlier in the day rather than close to bedtime',
          });
        }
      }
    }
    
    // Check evening meal correlation
    const mealCorrelationDays = Object.keys(sleepByDay).filter(date => eveningMealsByDay[date] !== undefined);
    if (mealCorrelationDays.length >= 5) {
      const lateMealDays = mealCorrelationDays.filter(date => eveningMealsByDay[date]);
      const noLateMealDays = mealCorrelationDays.filter(date => !eveningMealsByDay[date]);
      
      if (lateMealDays.length > 0 && noLateMealDays.length > 0) {
        const lateMealSleepQuality = lateMealDays.reduce((sum, date) => sum + sleepByDay[date].quality, 0) / lateMealDays.length;
        const noLateMealSleepQuality = noLateMealDays.reduce((sum, date) => sum + sleepByDay[date].quality, 0) / noLateMealDays.length;
        
        const qualityDifference = noLateMealSleepQuality - lateMealSleepQuality;
        
        if (Math.abs(qualityDifference) >= 0.5) {
          correlations.push({
            factor: 'late_meals',
            impact: qualityDifference > 0 ? 'negative' : 'positive',
            strength: Math.abs(qualityDifference) > 1 ? 'strong' : 'moderate',
            description: qualityDifference > 0 
              ? 'Late evening meals appear to negatively affect your sleep quality' 
              : 'Late evening meals don\'t seem to negatively affect your sleep quality',
            recommendation: qualityDifference > 0 
              ? 'Try to eat your last meal at least 3 hours before bedtime' 
              : 'Your current meal timing seems to work well for your sleep',
          });
        }
      }
    }
    
    res.json({
      correlations,
      dataPoints: {
        sleep: Object.keys(sleepByDay).length,
        water: Object.keys(waterByDay).length,
        exercise: Object.keys(exerciseByDay).length,
        meals: Object.keys(eveningMealsByDay).length,
      },
      generalRecommendations: [
        'Continue tracking your sleep along with other health metrics',
        'Experiment with different routines to find what works best for you',
        'Consistency in your daily habits often leads to better sleep',
      ],
    });
  } catch (error) {
    console.error('Get correlation analysis error:', error);
    res.status(500).json({ error: 'Failed to get correlation analysis' });
  }
});

export default router;