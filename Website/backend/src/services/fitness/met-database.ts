import { setCache, getCache } from '../../database/cache/redisCache';

/**
 * MET (Metabolic Equivalent of Task) values for various activities
 * MET is a measure of exercise intensity based on oxygen consumption
 * 1 MET = 1 kcal/kg/hour = the energy expended at rest
 */
export interface MetValue {
  activity: string;
  category: string;
  met: number;
  intensity: 'light' | 'moderate' | 'vigorous';
  description?: string;
}

// Comprehensive database of MET values for various activities
export const MET_DATABASE: MetValue[] = [
  // Cardio/Aerobic Exercises
  { activity: 'walking_slow', category: 'cardio', met: 2.0, intensity: 'light', description: 'Walking, less than 2.0 mph, level ground, strolling' },
  { activity: 'walking_moderate', category: 'cardio', met: 3.5, intensity: 'moderate', description: 'Walking, 3.0 mph, level, moderate pace' },
  { activity: 'walking_brisk', category: 'cardio', met: 5.0, intensity: 'moderate', description: 'Walking, 4.0 mph, level, very brisk pace' },
  { activity: 'jogging', category: 'cardio', met: 7.0, intensity: 'vigorous', description: 'Jogging, general' },
  { activity: 'running', category: 'cardio', met: 8.3, intensity: 'vigorous', description: 'Running, 5 mph (12 min/mile)' },
  { activity: 'running_fast', category: 'cardio', met: 11.8, intensity: 'vigorous', description: 'Running, 8 mph (7.5 min/mile)' },
  { activity: 'cycling_leisure', category: 'cardio', met: 4.0, intensity: 'moderate', description: 'Bicycling, leisure, 10-11.9 mph' },
  { activity: 'cycling_moderate', category: 'cardio', met: 8.0, intensity: 'vigorous', description: 'Bicycling, 12-13.9 mph, moderate effort' },
  { activity: 'cycling_vigorous', category: 'cardio', met: 10.0, intensity: 'vigorous', description: 'Bicycling, 14-15.9 mph, vigorous effort' },
  { activity: 'swimming_leisure', category: 'cardio', met: 6.0, intensity: 'moderate', description: 'Swimming, leisurely pace' },
  { activity: 'swimming_moderate', category: 'cardio', met: 8.3, intensity: 'vigorous', description: 'Swimming, moderate effort' },
  { activity: 'swimming_vigorous', category: 'cardio', met: 10.0, intensity: 'vigorous', description: 'Swimming, vigorous effort' },
  { activity: 'elliptical', category: 'cardio', met: 5.0, intensity: 'moderate', description: 'Elliptical trainer, moderate effort' },
  { activity: 'stair_climbing', category: 'cardio', met: 4.0, intensity: 'moderate', description: 'Stair climbing, slow pace' },
  { activity: 'rowing_moderate', category: 'cardio', met: 7.0, intensity: 'vigorous', description: 'Rowing, stationary, moderate effort' },
  { activity: 'rowing_vigorous', category: 'cardio', met: 8.5, intensity: 'vigorous', description: 'Rowing, stationary, vigorous effort' },
  { activity: 'jumping_rope', category: 'cardio', met: 10.0, intensity: 'vigorous', description: 'Jumping rope, moderate pace' },
  
  // Strength Training
  { activity: 'weight_lifting_light', category: 'strength', met: 3.5, intensity: 'moderate', description: 'Weight lifting, light or moderate effort' },
  { activity: 'weight_lifting_vigorous', category: 'strength', met: 6.0, intensity: 'vigorous', description: 'Weight lifting, vigorous effort' },
  { activity: 'circuit_training', category: 'strength', met: 8.0, intensity: 'vigorous', description: 'Circuit training with minimal rest' },
  { activity: 'bodyweight_exercises', category: 'strength', met: 3.8, intensity: 'moderate', description: 'Calisthenics, push-ups, sit-ups, moderate effort' },
  { activity: 'bodyweight_vigorous', category: 'strength', met: 8.0, intensity: 'vigorous', description: 'Calisthenics, vigorous effort' },
  
  // Flexibility and Balance
  { activity: 'yoga_hatha', category: 'flexibility', met: 2.5, intensity: 'light', description: 'Yoga, Hatha, gentle effort' },
  { activity: 'yoga_power', category: 'flexibility', met: 4.0, intensity: 'moderate', description: 'Yoga, Power, vigorous effort' },
  { activity: 'stretching', category: 'flexibility', met: 2.3, intensity: 'light', description: 'Stretching, mild' },
  { activity: 'pilates', category: 'flexibility', met: 3.0, intensity: 'moderate', description: 'Pilates, general' },
  { activity: 'tai_chi', category: 'flexibility', met: 3.0, intensity: 'moderate', description: 'Tai Chi, gentle movement' },
  
  // Sports
  { activity: 'basketball', category: 'sports', met: 6.5, intensity: 'vigorous', description: 'Basketball, general play' },
  { activity: 'soccer', category: 'sports', met: 7.0, intensity: 'vigorous', description: 'Soccer, casual, general' },
  { activity: 'tennis', category: 'sports', met: 7.3, intensity: 'vigorous', description: 'Tennis, singles' },
  { activity: 'volleyball', category: 'sports', met: 4.0, intensity: 'moderate', description: 'Volleyball, non-competitive' },
  { activity: 'golf', category: 'sports', met: 4.8, intensity: 'moderate', description: 'Golf, walking and carrying clubs' },
  { activity: 'baseball', category: 'sports', met: 5.0, intensity: 'moderate', description: 'Baseball, general' },
  { activity: 'hiking', category: 'sports', met: 5.3, intensity: 'moderate', description: 'Hiking, general' },
  { activity: 'rock_climbing', category: 'sports', met: 8.0, intensity: 'vigorous', description: 'Rock climbing, ascending' },
  { activity: 'martial_arts', category: 'sports', met: 10.3, intensity: 'vigorous', description: 'Martial arts, different types, moderate pace' },
  { activity: 'dancing', category: 'sports', met: 4.8, intensity: 'moderate', description: 'Dancing, aerobic, general' },
  
  // Daily Activities
  { activity: 'housework', category: 'daily', met: 3.5, intensity: 'moderate', description: 'Housework, general cleaning' },
  { activity: 'gardening', category: 'daily', met: 4.0, intensity: 'moderate', description: 'Gardening, general' },
  { activity: 'mowing_lawn', category: 'daily', met: 5.5, intensity: 'moderate', description: 'Mowing lawn, power mower' },
  { activity: 'shoveling_snow', category: 'daily', met: 6.0, intensity: 'moderate', description: 'Shoveling snow, by hand' },
];

/**
 * Get MET value for a specific activity
 */
export function getMetValue(activityId: string): MetValue | undefined {
  return MET_DATABASE.find(item => item.activity === activityId);
}

/**
 * Get MET values by category
 */
export function getMetValuesByCategory(category: string): MetValue[] {
  return MET_DATABASE.filter(item => item.category === category);
}

/**
 * Get MET values by intensity level
 */
export function getMetValuesByIntensity(intensity: 'light' | 'moderate' | 'vigorous'): MetValue[] {
  return MET_DATABASE.filter(item => item.intensity === intensity);
}

/**
 * Search MET database for activities matching a search term
 */
export function searchMetDatabase(searchTerm: string): MetValue[] {
  const lowerCaseSearch = searchTerm.toLowerCase();
  return MET_DATABASE.filter(item => 
    item.activity.includes(lowerCaseSearch) || 
    item.description?.toLowerCase().includes(lowerCaseSearch) ||
    item.category.includes(lowerCaseSearch)
  );
}

/**
 * Map exercise from database to MET activity
 * This helps bridge the gap between our exercise database and MET values
 */
export async function mapExerciseToMetActivity(exerciseId: string, exerciseName: string, category: string): Promise<MetValue | undefined> {
  // Try to get from cache first
  const cacheKey = `exercise-met-mapping:${exerciseId}`;
  const cachedMapping = await getCache<string>(cacheKey);
  
  if (cachedMapping) {
    return getMetValue(cachedMapping);
  }
  
  // Simple mapping based on exercise name and category
  const exerciseNameLower = exerciseName.toLowerCase();
  
  // Try to find a direct match first
  let metActivity = MET_DATABASE.find(item => 
    exerciseNameLower.includes(item.activity.replace('_', ' ')) ||
    item.description?.toLowerCase().includes(exerciseNameLower)
  );
  
  // If no direct match, try to match by category
  if (!metActivity) {
    const categoryLower = category.toLowerCase();
    const categoryMatches = MET_DATABASE.filter(item => item.category.includes(categoryLower));
    
    if (categoryMatches.length > 0) {
      // Default to a moderate intensity activity in the same category
      metActivity = categoryMatches.find(item => item.intensity === 'moderate') || categoryMatches[0];
    } else {
      // Default to a moderate walking as fallback
      metActivity = getMetValue('walking_moderate');
    }
  }
  
  // Cache the mapping for future use
  if (metActivity) {
    await setCache(cacheKey, metActivity.activity, 86400); // Cache for 24 hours
  }
  
  return metActivity;
}