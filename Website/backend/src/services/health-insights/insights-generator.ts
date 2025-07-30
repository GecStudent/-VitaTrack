import { User } from '../../database/models/User';
import { detectNutrientDeficiencies } from '../nutrition/deficiency-detection';
import { healthAnalyzer } from './health-analyzer';
import { trendPredictor } from './trend-predictor';
import { riskAssessor } from './risk-assessor';

type HealthAnalysis = {
  overallScore: number;
  keyFindings: any[];
  improvementAreas: any[];
  activityTrends: any;
  sleepQuality: any;
  sleepPatterns: any;
  weightTrend: any;
  correlations: any[];
};
type TrendPredictions = {
  trends: any[];
  projections: any[];
};
type RiskAssessment = {
  identifiedRisks: any[];
  preventiveMeasures: any[];
};

/**
 * Generate comprehensive health insights for a user
 * Combines data from multiple sources to provide actionable recommendations
 */
export async function generateHealthInsights(userId: string, timeframe: 'week' | 'month' | 'quarter' = 'month') {
  // Calculate date range based on timeframe
  const endDate = new Date();
  const startDate = new Date();
  
  switch (timeframe) {
    case 'week':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(endDate.getMonth() - 3);
      break;
  }
  
  // Get health analysis data
  const rawHealthAnalysis = await healthAnalyzer.analyzeHealthData(userId, startDate, endDate);
  let healthAnalysis: HealthAnalysis = (rawHealthAnalysis && typeof rawHealthAnalysis === 'object' && 'overallScore' in rawHealthAnalysis)
    ? rawHealthAnalysis as HealthAnalysis
    : {
        overallScore: 0,
        keyFindings: [],
        improvementAreas: [],
        activityTrends: {},
        sleepQuality: {},
        sleepPatterns: {},
        weightTrend: {},
        correlations: []
      };
  
  // Get nutrient deficiency data
  const nutrientData = await detectNutrientDeficiencies(userId, startDate, endDate);
  
  // Get trend predictions
  const rawTrendPredictions = await trendPredictor.predictTrends(userId, startDate, endDate);
  let trendPredictions: TrendPredictions = (rawTrendPredictions && typeof rawTrendPredictions === 'object' && 'trends' in rawTrendPredictions)
    ? rawTrendPredictions as TrendPredictions
    : { trends: [], projections: [] };
  
  // Get risk assessment
  const rawRiskAssessment = await riskAssessor.assessRisks(userId, healthAnalysis);
  const riskAssessment: RiskAssessment = (rawRiskAssessment && typeof rawRiskAssessment === 'object' && 'identifiedRisks' in rawRiskAssessment)
    ? rawRiskAssessment as RiskAssessment
    : { identifiedRisks: [], preventiveMeasures: [] };
  
  // Compile insights
  const insights = {
    summary: {
      overallHealth: healthAnalysis.overallScore,
      keyFindings: healthAnalysis.keyFindings,
      improvementAreas: healthAnalysis.improvementAreas,
    },
    nutrition: {
      deficiencies: nutrientData.deficiencies,
      recommendations: nutrientData.deficiencies.length > 0 
        ? generateNutritionRecommendations(nutrientData.deficiencies) 
        : ['Your nutrition intake appears balanced. Continue your healthy eating habits.'],
    },
    activity: {
      trends: healthAnalysis.activityTrends,
      recommendations: generateActivityRecommendations(healthAnalysis.activityTrends),
    },
    sleep: {
      quality: healthAnalysis.sleepQuality,
      patterns: healthAnalysis.sleepPatterns,
      recommendations: generateSleepRecommendations(healthAnalysis.sleepQuality, healthAnalysis.sleepPatterns),
    },
    weight: {
      trend: healthAnalysis.weightTrend,
      recommendations: generateWeightRecommendations(healthAnalysis.weightTrend),
    },
    predictions: {
      trends: trendPredictions.trends,
      projections: trendPredictions.projections,
    },
    risks: {
      identified: riskAssessment.identifiedRisks,
      preventiveMeasures: riskAssessment.preventiveMeasures,
    },
    correlations: healthAnalysis.correlations,
  };
  
  return insights;
}

/**
 * Generate personalized nutrition recommendations based on deficiencies
 */
function generateNutritionRecommendations(deficiencies: any[]): string[] {
  // This is a simplified version - the actual implementation would use the existing
  // generateNutritionRecommendations function from deficiency-detection.ts
  const recommendations: string[] = [];
  
  // General recommendations
  recommendations.push('Focus on eating a varied diet with plenty of fruits, vegetables, whole grains, lean proteins, and healthy fats.');
  
  // Specific recommendations based on deficiencies
  const severeDeficiencies = deficiencies.filter(d => d.severity === 'severe');
  const moderateDeficiencies = deficiencies.filter(d => d.severity === 'moderate');
  
  if (severeDeficiencies.length > 0) {
    recommendations.push('Priority nutrients to increase in your diet:');
    severeDeficiencies.forEach(deficiency => {
      recommendations.push(`- ${deficiency.nutrient}: ${deficiency.recommendations[0]}`);
    });
  }
  
  if (moderateDeficiencies.length > 0) {
    recommendations.push('Also consider increasing these nutrients:');
    moderateDeficiencies.forEach(deficiency => {
      recommendations.push(`- ${deficiency.nutrient}: ${deficiency.recommendations[0]}`);
    });
  }
  
  return recommendations;
}

/**
 * Generate activity recommendations based on activity trends
 */
function generateActivityRecommendations(activityTrends: any): string[] {
  const recommendations: string[] = [];
  
  if (activityTrends.averageMinutesPerDay < 30) {
    recommendations.push('Try to increase your daily activity to at least 30 minutes per day.');
    recommendations.push('Consider adding short walks throughout your day to increase overall activity.');
  } else if (activityTrends.averageMinutesPerDay >= 30 && activityTrends.averageMinutesPerDay < 60) {
    recommendations.push('You\'re meeting the minimum activity recommendations. Consider increasing to 60 minutes for additional health benefits.');
  } else {
    recommendations.push('You\'re maintaining an excellent activity level. Consider adding variety to your routine to engage different muscle groups.');
  }
  
  if (activityTrends.consistencyScore < 0.5) {
    recommendations.push('Your activity pattern is inconsistent. Try to establish a regular exercise schedule.');
  }
  
  return recommendations;
}

/**
 * Generate sleep recommendations based on sleep quality and patterns
 */
function generateSleepRecommendations(sleepQuality: any, sleepPatterns: any): string[] {
  const recommendations: string[] = [];
  
  if (sleepQuality.average < 6) {
    recommendations.push('Your sleep quality could be improved. Consider creating a relaxing bedtime routine.');
    recommendations.push('Ensure your bedroom is dark, quiet, and at a comfortable temperature.');
  }
  
  if (sleepPatterns.averageDuration < 7 * 60) { // Less than 7 hours in minutes
    recommendations.push('You\'re not getting enough sleep. Aim for 7-9 hours of sleep per night.');
  } else if (sleepPatterns.averageDuration > 9 * 60) { // More than 9 hours in minutes
    recommendations.push('You may be sleeping more than necessary. Ensure you\'re getting quality sleep rather than just quantity.');
  }
  
  if (sleepPatterns.consistencyScore < 0.7) {
    recommendations.push('Your sleep schedule is inconsistent. Try to maintain regular sleep and wake times, even on weekends.');
  }
  
  return recommendations;
}

/**
 * Generate weight management recommendations based on weight trend
 */
function generateWeightRecommendations(weightTrend: any): string[] {
  const recommendations: string[] = [];
  
  if (weightTrend.direction === 'increasing' && weightTrend.goalAlignment === 'negative') {
    recommendations.push('Your weight is increasing contrary to your goals. Consider reviewing your calorie intake and increasing physical activity.');
  } else if (weightTrend.direction === 'decreasing' && weightTrend.goalAlignment === 'negative') {
    recommendations.push('Your weight is decreasing contrary to your goals. Consider increasing your calorie intake with nutrient-dense foods.');
  } else if (weightTrend.direction === 'stable' && weightTrend.goalAlignment === 'negative') {
    recommendations.push('Your weight is stable but not moving toward your goal. Consider adjusting your nutrition and exercise approach.');
  } else if (weightTrend.goalAlignment === 'positive') {
    recommendations.push('You\'re making good progress toward your weight goal. Continue your current approach.');
  }
  
  return recommendations;
}