import { setCache, getCache } from '../../database/cache/redisCache';

/**
 * Heart rate zones based on percentage of maximum heart rate
 */
export enum HeartRateZone {
  RESTING = 'resting',
  VERY_LIGHT = 'very_light',  // 50-60% of max HR
  LIGHT = 'light',            // 60-70% of max HR
  MODERATE = 'moderate',      // 70-80% of max HR
  HARD = 'hard',              // 80-90% of max HR
  MAXIMUM = 'maximum'         // 90-100% of max HR
}

/**
 * Calculate maximum heart rate using various formulas
 */
export function calculateMaxHeartRate(age: number, gender: string = 'neutral', formula: string = 'tanaka'): number {
  switch (formula.toLowerCase()) {
    case 'fox':
      // Simple Fox formula: 220 - age
      return 220 - age;
      
    case 'tanaka':
      // Tanaka formula: 208 - (0.7 * age)
      // More accurate for a wider range of ages
      return 208 - (0.7 * age);
      
    case 'gellish':
      // Gellish formula: 207 - (0.7 * age)
      // Similar to Tanaka but derived from different studies
      return 207 - (0.7 * age);
      
    case 'gender_specific':
      // Gender-specific formulas
      if (gender.toLowerCase() === 'female') {
        return 209 - (0.9 * age); // Female-specific formula
      } else {
        return 214 - (0.8 * age); // Male-specific formula
      }
      
    default:
      // Default to Tanaka formula
      return 208 - (0.7 * age);
  }
}

/**
 * Determine heart rate zone based on current heart rate and max heart rate
 */
export function getHeartRateZone(currentHeartRate: number, maxHeartRate: number): HeartRateZone {
  const hrPercentage = (currentHeartRate / maxHeartRate) * 100;
  
  if (hrPercentage < 50) return HeartRateZone.RESTING;
  if (hrPercentage < 60) return HeartRateZone.VERY_LIGHT;
  if (hrPercentage < 70) return HeartRateZone.LIGHT;
  if (hrPercentage < 80) return HeartRateZone.MODERATE;
  if (hrPercentage < 90) return HeartRateZone.HARD;
  return HeartRateZone.MAXIMUM;
}

/**
 * Calculate calories burned based on heart rate using the Keytel formula
 */
export function calculateCaloriesFromHeartRate(
  gender: string,
  age: number,
  weightKg: number,
  heartRateBpm: number,
  durationMinutes: number
): number {
  // Keytel formula for calorie expenditure based on heart rate
  // Different coefficients for males and females
  let calories;
  
  if (gender.toLowerCase() === 'male') {
    calories = ((age * 0.2017) + (weightKg * 0.1988) + (heartRateBpm * 0.6309) - 55.0969) * durationMinutes / 4.184;
  } else {
    calories = ((age * 0.074) + (weightKg * 0.1263) + (heartRateBpm * 0.4472) - 20.4022) * durationMinutes / 4.184;
  }
  
  // Ensure we don't return negative values
  return Math.max(0, calories);
}

/**
 * Calculate calories burned based on heart rate data over time
 * This is more accurate when we have heart rate samples throughout the workout
 */
export function calculateCaloriesFromHeartRateSeries(
  gender: string,
  age: number,
  weightKg: number,
  heartRateSamples: Array<{ heartRate: number; timestamp: Date }>
): number {
  if (heartRateSamples.length < 2) {
    return 0;
  }
  
  let totalCalories = 0;
  
  // Sort samples by timestamp
  const sortedSamples = [...heartRateSamples].sort((a, b) => 
    a.timestamp.getTime() - b.timestamp.getTime()
  );
  
  // Calculate calories for each time segment
  for (let i = 1; i < sortedSamples.length; i++) {
    const prevSample = sortedSamples[i - 1];
    const currentSample = sortedSamples[i];
    
    // Calculate time difference in minutes
    const timeDiffMs = currentSample.timestamp.getTime() - prevSample.timestamp.getTime();
    const timeDiffMinutes = timeDiffMs / (1000 * 60);
    
    // Use average heart rate for this time segment
    const avgHeartRate = (prevSample.heartRate + currentSample.heartRate) / 2;
    
    // Calculate calories for this segment
    const segmentCalories = calculateCaloriesFromHeartRate(
      gender,
      age,
      weightKg,
      avgHeartRate,
      timeDiffMinutes
    );
    
    totalCalories += segmentCalories;
  }
  
  return Math.round(totalCalories);
}

/**
 * Estimate heart rate recovery (HRR) - a measure of cardiovascular fitness
 * HRR is the decrease in heart rate at 1 and 2 minutes after exercise
 */
export function calculateHeartRateRecovery(
  maxHeartRate: number,
  heartRateAfter1Min: number,
  heartRateAfter2Min?: number
): {
  recovery1min: number;
  recovery2min?: number;
  fitnessAssessment: string;
} {
  const recovery1min = maxHeartRate - heartRateAfter1Min;
  const recovery2min = heartRateAfter2Min ? maxHeartRate - heartRateAfter2Min : undefined;
  
  // Fitness assessment based on 1-minute heart rate recovery
  let fitnessAssessment = '';
  
  if (recovery1min >= 50) {
    fitnessAssessment = 'Excellent';
  } else if (recovery1min >= 30) {
    fitnessAssessment = 'Good';
  } else if (recovery1min >= 20) {
    fitnessAssessment = 'Average';
  } else {
    fitnessAssessment = 'Below Average';
  }
  
  return {
    recovery1min,
    recovery2min,
    fitnessAssessment
  };
}