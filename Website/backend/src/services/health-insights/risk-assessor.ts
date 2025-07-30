import userRepository from '../../database/repositories/UserRepository';
import { getCache, setCache } from '../../database/cache/redisCache';

class RiskAssessor {
  /**
   * Assess health risks based on user data and health analysis
   */
  async assessRisks(userId: string, healthAnalysis: any) {
    // Create cache key
    const cacheKey = `risk-assessment:${userId}`;
    
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
    
    const identifiedRisks = [];
    const preventiveMeasures = [];
    
    // Check for sleep-related risks
    if (healthAnalysis.sleepQuality && healthAnalysis.sleepQuality.average < 5) {
      identifiedRisks.push({
        type: 'sleep_quality',
        severity: 'moderate',
        description: 'Poor sleep quality increases risk of fatigue, reduced cognitive function, and weakened immune system',
      });
      
      preventiveMeasures.push(
        'Establish a consistent sleep schedule',
        'Create a relaxing bedtime routine',
        'Ensure your bedroom is dark, quiet, and cool',
        'Limit screen time before bed',
        'Consider consulting a healthcare provider if sleep issues persist'
      );
    }
    
    // Check for activity-related risks
    if (healthAnalysis.activityTrends && healthAnalysis.activityTrends.averageMinutesPerDay < 20) {
      identifiedRisks.push({
        type: 'physical_inactivity',
        severity: 'moderate',
        description: 'Low physical activity increases risk of cardiovascular disease, obesity, and reduced overall health',
      });
      
      preventiveMeasures.push(
        'Aim for at least 150 minutes of moderate activity per week',
        'Incorporate short walks throughout your day',
        'Find physical activities you enjoy to increase adherence',
        'Start with small, achievable goals and gradually increase activity'
      );
    }
    
    // Check for weight-related risks
    if (user.height && healthAnalysis.weightTrend && healthAnalysis.weightTrend.dataPoints > 0) {
      // Calculate BMI using the latest weight
      const heightInMeters = user.height / 100;
      const latestWeight = healthAnalysis.weightTrend.latestWeight || 0;
      const bmi = latestWeight / (heightInMeters * heightInMeters);
      
      if (bmi >= 30) {
        identifiedRisks.push({
          type: 'obesity',
          severity: 'high',
          description: 'Obesity increases risk of heart disease, diabetes, certain cancers, and other health conditions',
        });
        
        preventiveMeasures.push(
          'Focus on a balanced diet with appropriate portion sizes',
          'Gradually increase physical activity',
          'Set realistic weight management goals',
          'Consider consulting a healthcare provider for personalized advice'
        );
      } else if (bmi >= 25) {
        identifiedRisks.push({
          type: 'overweight',
          severity: 'moderate',
          description: 'Being overweight increases risk of developing various health conditions',
        });
        
        preventiveMeasures.push(
          'Maintain a balanced diet rich in fruits, vegetables, and whole grains',
          'Aim for regular physical activity',
          'Monitor portion sizes'
        );
      } else if (bmi < 18.5) {
        identifiedRisks.push({
          type: 'underweight',
          severity: 'moderate',
          description: 'Being underweight may indicate nutritional deficiencies or other health issues',
        });
        
        preventiveMeasures.push(
          'Focus on nutrient-dense foods',
          'Consider smaller, more frequent meals',
          'Consult a healthcare provider to rule out underlying conditions'
        );
      }
    }
    
    // Add general preventive measures
    if (preventiveMeasures.length === 0) {
      preventiveMeasures.push(
        'Continue maintaining a balanced diet and regular physical activity',
        'Stay hydrated throughout the day',
        'Prioritize adequate sleep',
        'Manage stress through relaxation techniques or activities you enjoy',
        'Schedule regular health check-ups'
      );
    }
    
    const result = {
      identifiedRisks,
      preventiveMeasures: [...new Set(preventiveMeasures)] // Remove duplicates
    };
    
    // Cache result for 24 hours
    await setCache(cacheKey, result, 86400);
    
    return result;
  }
}

export const riskAssessor = new RiskAssessor();