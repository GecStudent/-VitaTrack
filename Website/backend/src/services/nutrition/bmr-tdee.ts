import { User } from '../../database/models/User';
import { WeightLog } from '../../database/models/WeightLog';
import WeightLogRepository from '../../database/repositories/WeightLogRepository';
import UserDailyTargetRepository from '../../database/repositories/UserDailyTargetRepository';
import { setCache, getCache } from '../../database/cache/redisCache';
import userRepository from '../../database/repositories/UserRepository';

// Activity level multipliers for TDEE calculation
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,          // Little or no exercise
  lightly_active: 1.375,    // Light exercise 1-3 days/week
  moderately_active: 1.55,  // Moderate exercise 3-5 days/week
  very_active: 1.725,       // Hard exercise 6-7 days/week
  extremely_active: 1.9     // Very hard exercise & physical job or 2x training
};

// Formulas available for BMR calculation
export enum BmrFormula {
  MIFFLIN_ST_JEOR = 'mifflin_st_jeor',
  HARRIS_BENEDICT = 'harris_benedict',
  KATCH_MCARDLE = 'katch_mcardle'
}

/**
 * Calculate Basal Metabolic Rate (BMR) using the Mifflin-St Jeor Equation
 * BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + s
 * where s is +5 for males and -161 for females
 */
export function calculateBmrMifflinStJeor(gender: string, weightKg: number, heightCm: number, ageYears: number): number {
  const s = gender.toLowerCase() === 'female' ? -161 : 5;
  return (10 * weightKg) + (6.25 * heightCm) - (5 * ageYears) + s;
}

/**
 * Calculate BMR using the Harris-Benedict Equation (Revised)
 * For men: BMR = 13.397W + 4.799H - 5.677A + 88.362
 * For women: BMR = 9.247W + 3.098H - 4.330A + 447.593
 * where W is weight in kg, H is height in cm, and A is age in years
 */
export function calculateBmrHarrisBenedict(gender: string, weightKg: number, heightCm: number, ageYears: number): number {
  if (gender.toLowerCase() === 'female') {
    return 9.247 * weightKg + 3.098 * heightCm - 4.330 * ageYears + 447.593;
  } else {
    return 13.397 * weightKg + 4.799 * heightCm - 5.677 * ageYears + 88.362;
  }
}

/**
 * Calculate BMR using the Katch-McArdle Formula
 * BMR = 370 + (21.6 * LBM)
 * where LBM is lean body mass in kg
 * 
 * Note: This requires body fat percentage which may not always be available
 */
export function calculateBmrKatchMcArdle(weightKg: number, bodyFatPercentage: number): number {
  const leanBodyMass = weightKg * (1 - bodyFatPercentage / 100);
  return 370 + (21.6 * leanBodyMass);
}

/**
 * Calculate BMR based on the selected formula
 */
export function calculateBmr(
  formula: BmrFormula,
  gender: string,
  weightKg: number,
  heightCm: number,
  ageYears: number,
  bodyFatPercentage?: number
): number {
  switch (formula) {
    case BmrFormula.HARRIS_BENEDICT:
      return calculateBmrHarrisBenedict(gender, weightKg, heightCm, ageYears);
    case BmrFormula.KATCH_MCARDLE:
      if (bodyFatPercentage === undefined) {
        throw new Error('Body fat percentage is required for Katch-McArdle formula');
      }
      return calculateBmrKatchMcArdle(weightKg, bodyFatPercentage);
    case BmrFormula.MIFFLIN_ST_JEOR:
    default:
      return calculateBmrMifflinStJeor(gender, weightKg, heightCm, ageYears);
  }
}

/**
 * Calculate Total Daily Energy Expenditure (TDEE) based on BMR and activity level
 */
export function calculateTdee(bmr: number, activityLevel: string): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel as keyof typeof ACTIVITY_MULTIPLIERS] || ACTIVITY_MULTIPLIERS.sedentary;
  return Math.round(bmr * multiplier);
}

/**
 * Calculate macronutrient distribution based on TDEE and specified ratios
 */
export function calculateMacros(
  tdee: number,
  proteinRatio: number = 0.3,  // 30% of calories from protein
  carbsRatio: number = 0.4,    // 40% of calories from carbs
  fatRatio: number = 0.3       // 30% of calories from fat
): { protein_g: number; carbs_g: number; fat_g: number } {
  // Ensure ratios sum to 1
  const totalRatio = proteinRatio + carbsRatio + fatRatio;
  if (Math.abs(totalRatio - 1) > 0.01) {
    const normalizer = 1 / totalRatio;
    proteinRatio *= normalizer;
    carbsRatio *= normalizer;
    fatRatio *= normalizer;
  }

  // Calculate calories for each macronutrient
  const proteinCalories = tdee * proteinRatio;
  const carbsCalories = tdee * carbsRatio;
  const fatCalories = tdee * fatRatio;

  // Convert calories to grams (protein: 4 cal/g, carbs: 4 cal/g, fat: 9 cal/g)
  return {
    protein_g: Math.round(proteinCalories / 4),
    carbs_g: Math.round(carbsCalories / 4),
    fat_g: Math.round(fatCalories / 9)
  };
}

export type BmrTdeeResult = {
  bmr: number;
  tdee: number;
  macros: { protein_g: number; carbs_g: number; fat_g: number };
};

/**
 * Calculate BMR and TDEE for a user
 */
export async function calculateUserBmrAndTdee(
  userId: string,
  formula: BmrFormula = BmrFormula.MIFFLIN_ST_JEOR
): Promise<BmrTdeeResult> {
  // Try to get from cache first
  const cacheKey = `user:${userId}:bmr-tdee:${formula}`;
  const cachedResult = await getCache(cacheKey);
  if (cachedResult && typeof cachedResult === 'object' && 'bmr' in cachedResult && 'tdee' in cachedResult && 'macros' in cachedResult) {
    return cachedResult as BmrTdeeResult;
  }
  return { bmr: 0, tdee: 0, macros: { protein_g: 0, carbs_g: 0, fat_g: 0 } };

  // Get user data
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  const u = user!;
  let birthDate: Date | undefined = undefined;
  const birthDateValue = u.birth_date;
  if (typeof birthDateValue === 'string' || typeof birthDateValue === 'number') {
    // @ts-ignore
    birthDate = new Date(birthDateValue);
  } else if (birthDateValue instanceof Date) {
    birthDate = birthDateValue;
  }
  const heightCm = u.height ?? 170;
  const activityLevel = u.activity_level || 'sedentary';
  const gender = u.gender || 'male';
  let ageYears = 30;
  // @ts-ignore
  if (birthDate && !isNaN(birthDate.getTime())) {
    // @ts-ignore
    ageYears = Math.floor((new Date().getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }
  const currentWeightValue = u.current_weight;
  const latestWeight = Number.isFinite(currentWeightValue) ? currentWeightValue as number : 70;
  const bmr = calculateBmr(formula, gender, latestWeight, heightCm, ageYears);

  // Calculate TDEE
  const tdee = calculateTdee(bmr, activityLevel);

  // Calculate macros with default distribution
  const macros = calculateMacros(tdee);

  // Cache the result for 24 hours
  const result = { bmr, tdee, macros };
  await setCache(cacheKey, result, 86400); // 24 hours

  return result;
}

/**
 * Update user's daily nutrition targets based on calculated TDEE and macros
 */
export async function updateUserNutritionTargets(
  userId: string,
  tdee: number,
  macros: { protein_g: number; carbs_g: number; fat_g: number },
  fiberTarget: number = 30 // Default fiber target in grams
): Promise<void> {
  const existingTarget = await UserDailyTargetRepository.findByUserId(userId);

  const targetData = {
    calories: tdee,
    proteinG: macros.protein_g,
    carbsG: macros.carbs_g,
    fatG: macros.fat_g,
    fiberG: fiberTarget
  };

  if (existingTarget) {
    await UserDailyTargetRepository.update(existingTarget.id, targetData);
  } else {
    await UserDailyTargetRepository.create({
      userId,
      ...targetData
    });
  }
}

/**
 * Calculate weight change prediction based on calorie deficit/surplus
 */
export function calculateWeightChangePrediction(
  calorieDeficitPerDay: number,
  durationDays: number
): { weightChangeKg: number; weightChangeLbs: number } {
  // 1 kg of fat is approximately 7700 calories
  const weightChangeKg = calorieDeficitPerDay * durationDays / 7700;
  const weightChangeLbs = weightChangeKg * 2.20462; // Convert kg to lbs

  return {
    weightChangeKg: parseFloat(weightChangeKg.toFixed(2)),
    weightChangeLbs: parseFloat(weightChangeLbs.toFixed(2))
  };
}