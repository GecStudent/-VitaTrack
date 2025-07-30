import { setCache, getCache } from '../../database/cache/redisCache';
import { getMetValue, mapExerciseToMetActivity } from './met-database';
import { calculateCaloriesFromHeartRate, calculateCaloriesFromHeartRateSeries } from './heart-rate-calc';
import { validateCalorieBurn, GpsDataPoint, segmentActivities } from './activity-recognition';
import exerciseRepository from '../../database/repositories/ExerciseRepository';
import weightLogRepository from '../../database/repositories/WeightLogRepository';
import userRepository from '../../database/repositories/UserRepository';

/**
 * Calculate calories burned for an exercise using MET values
 */
export async function calculateCaloriesBurned(
  userId: string,
  exerciseId: string,
  duration: number, // in minutes
  intensity: 'low' | 'medium' | 'high' = 'medium',
  weight?: number // in kg
): Promise<number> {
  // Get user's weight if not provided
  let userWeight = weight;
  if (!userWeight) {
    const latestWeight = await weightLogRepository.getLatestWeight(userId);
    if (latestWeight) {
      userWeight = latestWeight.weight;
    } else {
      // Default weight if no weight log found
      userWeight = 70; // Default to 70kg
    }
  }
  
  // Get exercise details
  const exercise = await exerciseRepository.findById(exerciseId);
  if (!exercise) {
    throw new Error('Exercise not found');
  }
  
  // Try to map exercise to MET activity
  const metActivity = await mapExerciseToMetActivity(exerciseId, exercise.name, exercise.category);
  
  if (metActivity) {
    // Apply intensity adjustment
    let adjustedMet = metActivity.met;
    if (intensity === 'low') {
      adjustedMet *= 0.8;
    } else if (intensity === 'high') {
      adjustedMet *= 1.2;
    }
    
    // Calculate calories using MET formula
    // Calories = MET * weight in kg * duration in hours
    const caloriesBurned = adjustedMet * userWeight * (duration / 60);
    return Math.round(caloriesBurned);
  } else {
    // Fallback to using the exercise's caloriesPerMin value
    let caloriesBurned = exercise.caloriesPerMin * duration;
    
    // Apply intensity multiplier
    const intensityMultipliers = {
      low: 0.8,
      medium: 1.0,
      high: 1.2,
    };
    caloriesBurned *= intensityMultipliers[intensity];
    
    // Adjust for weight (using a simple linear adjustment)
    const referenceWeight = 70; // Reference weight in kg
    caloriesBurned *= (userWeight / referenceWeight);
    
    return Math.round(caloriesBurned);
  }
}

/**
 * Calculate calories burned using heart rate data
 */
export async function calculateCaloriesFromHeartRateData(
  userId: string,
  averageHeartRate: number,
  duration: number, // in minutes
  weight?: number // in kg
): Promise<number> {
  // Get user details
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Calculate age from birth date
  let age = 30; // Default age
  if (user.birth_date) {
    const today = new Date();
    age = today.getFullYear() - user.birth_date.getFullYear();
    
    // Adjust age if birthday hasn't occurred yet this year
    const m = today.getMonth() - user.birth_date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < user.birth_date.getDate())) {
      age--;
    }
  }
  
  // Get user's weight if not provided
  let userWeight = weight;
  if (!userWeight) {
    const latestWeight = await weightLogRepository.getLatestWeight(userId);
    if (latestWeight) {
      userWeight = latestWeight.weight;
    } else {
      // Default weight if no weight log found
      userWeight = 70; // Default to 70kg
    }
  }
  
  // Calculate calories using heart rate formula
  return calculateCaloriesFromHeartRate(
    user.gender || 'neutral',
    age,
    userWeight,
    averageHeartRate,
    duration
  );
}

/**
 * Calculate calories burned for an exercise with both MET and heart rate data
 */
export async function calculateCaloriesBurnedCombined(
  userId: string,
  exerciseId: string,
  duration: number, // in minutes
  intensity: 'low' | 'medium' | 'high' = 'medium',
  heartRate?: number,
  weight?: number // in kg
): Promise<{
  caloriesBurned: number;
  method: string;
  confidence: number;
}> {
  // Get user's weight if not provided
  let userWeight = weight;
  if (!userWeight) {
    const latestWeight = await weightLogRepository.getLatestWeight(userId);
    if (latestWeight) {
      userWeight = latestWeight.weight;
    } else {
      // Default weight if no weight log found
      userWeight = 70; // Default to 70kg
    }
  }
  
  // Calculate calories using MET method
  const metCalories = await calculateCaloriesBurned(
    userId,
    exerciseId,
    duration,
    intensity,
    userWeight
  );
  
  // Calculate calories using heart rate method if available
  let heartRateCalories = null;
  if (heartRate) {
    heartRateCalories = await calculateCaloriesFromHeartRateData(
      userId,
      heartRate,
      duration,
      userWeight
    );
  }
  
  // Validate and combine the results
  const validated = validateCalorieBurn(metCalories, heartRateCalories, userWeight, duration);
  return {
    caloriesBurned: validated.validatedCalories,
    method: validated.method,
    confidence: validated.confidence
  };
}

/**
 * Process GPS data to calculate calories burned during outdoor activities
 */
export async function calculateCaloriesFromGpsData(
  userId: string,
  gpsData: GpsDataPoint[],
  weight?: number // in kg
): Promise<{
  totalCaloriesBurned: number;
  distance: number; // in meters
  duration: number; // in minutes
  segments: any[];
}> {
  // Get user's weight if not provided
  let userWeight = weight;
  if (!userWeight) {
    const latestWeight = await weightLogRepository.getLatestWeight(userId);
    if (latestWeight) {
      userWeight = latestWeight.weight;
    } else {
      // Default weight if no weight log found
      userWeight = 70; // Default to 70kg
    }
  }
  
  // Segment the GPS data into activities
  const segments = segmentActivities(gpsData, userWeight);
  
  // Calculate total calories, distance and duration
  let totalCaloriesBurned = 0;
  let totalDistance = 0;
  let totalDuration = 0;
  
  segments.forEach(segment => {
    if (segment.caloriesBurned) {
      totalCaloriesBurned += segment.caloriesBurned;
    }
    if (segment.distance) {
      totalDistance += segment.distance;
    }
    totalDuration += segment.duration;
  });
  
  return {
    totalCaloriesBurned: Math.round(totalCaloriesBurned),
    distance: Math.round(totalDistance),
    duration: Math.round(totalDuration),
    segments
  };
}

/**
 * Calculate personalized Basal Metabolic Rate (BMR)
 */
export async function calculatePersonalizedBmr(
  userId: string,
  weight?: number // in kg
): Promise<number> {
  // Get user details
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Get user's weight if not provided
  let userWeight = weight;
  if (!userWeight) {
    const latestWeight = await weightLogRepository.getLatestWeight(userId);
    if (latestWeight) {
      userWeight = latestWeight.weight;
    } else {
      // Default weight if no weight log found
      userWeight = 70; // Default to 70kg
    }
  }
  
  // Get user's height
  const userHeight = user.height || 170; // Default to 170cm if not available
  
  // Calculate age from birth date
  let age = 30; // Default age
  if (user.birth_date) {
    const today = new Date();
    age = today.getFullYear() - user.birth_date.getFullYear();
    
    // Adjust age if birthday hasn't occurred yet this year
    const m = today.getMonth() - user.birth_date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < user.birth_date.getDate())) {
      age--;
    }
  }
  
  // Calculate BMR using Mifflin-St Jeor Equation
  let bmr;
  if (user.gender?.toLowerCase() === 'female') {
    bmr = 10 * userWeight + 6.25 * userHeight - 5 * age - 161;
  } else {
    bmr = 10 * userWeight + 6.25 * userHeight - 5 * age + 5;
  }
  
  return Math.round(bmr);
}

/**
 * Calculate daily calorie burn based on BMR and activity level
 */
export async function calculateDailyCalorieBurn(
  userId: string,
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active' = 'moderately_active'
): Promise<{
  bmr: number;
  activityBurn: number;
  totalDailyBurn: number;
}> {
  // Calculate BMR
  const bmr = await calculatePersonalizedBmr(userId);
  
  // Activity multipliers
  const activityMultipliers = {
    sedentary: 1.2, // Little or no exercise
    lightly_active: 1.375, // Light exercise 1-3 days/week
    moderately_active: 1.55, // Moderate exercise 3-5 days/week
    very_active: 1.725, // Hard exercise 6-7 days/week
    extremely_active: 1.9 // Very hard exercise & physical job or 2x training
  };
  
  // Calculate total daily calorie burn
  const multiplier = activityMultipliers[activityLevel];
  const totalDailyBurn = bmr * multiplier;
  const activityBurn = totalDailyBurn - bmr;
  
  return {
    bmr: Math.round(bmr),
    activityBurn: Math.round(activityBurn),
    totalDailyBurn: Math.round(totalDailyBurn)
  };
}