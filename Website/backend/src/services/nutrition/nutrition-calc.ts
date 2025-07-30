import express from 'express';
import { Request, Response } from 'express';
import Joi from 'joi';
import { Food } from '../../database/models/Food';
import { Recipe } from '../../database/models/Recipe';
import { UserCustomFood } from '../../database/models/UserCustomFood';
import { RestaurantFood } from '../../database/models/RestaurantFood';
import { registerSchema } from '../../middleware/requestValidator';
import { setCache, getCache } from '../../database/cache/redisCache';
import { calculateBmr, calculateTdee, calculateMacros, BmrFormula } from './bmr-tdee';
import { calculateRecipeNutrition, calculateNutritionDensityScore } from './recipe-analysis';
import { detectNutrientDeficiencies, generateNutritionRecommendations } from './deficiency-detection';

export type Nutrition = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  [key: string]: number;
};

/**
 * Calculate nutrition for a list of food items
 */
export async function calculateNutrition(
  items: Array<{
    type: 'food' | 'recipe' | 'custom' | 'restaurant';
    id: string;
    amount: number;
    unit: string;
  }>
): Promise<Nutrition> {
  // Create cache key based on items
  const cacheKey = `nutrition-calc:${JSON.stringify(items)}`;
  
  // Try to get results from cache
  const cachedResults = await getCache(cacheKey);
  if (cachedResults && typeof cachedResults === 'object' && 'calories' in cachedResults && 'protein_g' in cachedResults && 'carbs_g' in cachedResults && 'fat_g' in cachedResults && 'fiber_g' in cachedResults && 'sugar_g' in cachedResults && 'sodium_mg' in cachedResults) {
    return cachedResults as Nutrition;
  }
  return { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0, sodium_mg: 0 };
  
  // Initialize nutrition totals
  const nutritionTotals: Record<string, number> = {
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: 0,
    // Additional fields will be added dynamically
  };
  
  // Process each item
  for (const item of items) {
    const { type, id, amount, unit } = item;
    
    let nutritionData;
    let servingSize;
    
    // Get nutrition data based on item type
    switch (type) {
      case 'food':
        const food = await Food.findById(id);
        if (!food) continue;
        nutritionData = food!.nutrition_per_100g;
        servingSize = food!.serving_sizes.find(s => s.unit === unit);
        break;
        
      case 'recipe':
        const recipe = await Recipe.findById(id);
        if (!recipe) continue;
        
        nutritionData = recipe!.nutrition_per_serving;
        servingSize = { size: 1, unit: 'serving', weight_g: 0 };
        break;
        
      case 'custom':
        const customFood = await UserCustomFood.findById(id);
        if (!customFood) continue;
        
        nutritionData = customFood!.nutrition_per_100g;
        servingSize = customFood!.serving_sizes.find(s => s.unit === unit);
        break;
        
      case 'restaurant':
        const restaurantFood = await RestaurantFood.findById(id);
        if (!restaurantFood) continue;
        
        nutritionData = restaurantFood!.nutrition;
        servingSize = restaurantFood!.serving_size;
        break;
        
      default:
        continue;
    }
    
    if (!nutritionData || !servingSize) continue;
    
    // Calculate nutrition based on amount and serving size
    let factor;
    
    if (type === 'recipe') {
      // For recipes, amount is in servings
      factor = amount;
    } else {
      // For foods, calculate based on weight in grams
      const amountInGrams = (amount * servingSize.weight_g) / servingSize.size;
      factor = amountInGrams / 100; // nutrition_per_100g is per 100g
    }
    
    // Add to totals for all available nutrition fields
    Object.keys(nutritionData).forEach(key => {
      if (nutritionData[key] !== undefined && nutritionData[key] !== null) {
        if (nutritionTotals[key] === undefined) {
          nutritionTotals[key] = 0;
        }
        nutritionTotals[key] += (nutritionData[key] || 0) * factor;
      }
    });
  }
  
  // Round values to 1 decimal place
  Object.keys(nutritionTotals).forEach(key => {
    nutritionTotals[key] = Math.round(nutritionTotals[key] * 10) / 10;
  });
  
  // Cache results for 1 hour
  await setCache(cacheKey, nutritionTotals, 3600);
  
  return nutritionTotals as Nutrition;
}

/**
 * Convert nutrition values between different units
 */
export function convertNutritionUnits(
  nutritionData: Record<string, number>,
  fromUnit: 'metric' | 'imperial',
  toUnit: 'metric' | 'imperial'
): Record<string, number> {
  if (fromUnit === toUnit) {
    return { ...nutritionData };
  }
  
  const result = { ...nutritionData };
  
  // Convert weight units (g to oz or oz to g)
  const weightFields = [
    'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sugar_g',
    'saturated_fat_g', 'trans_fat_g', 'polyunsaturated_fat_g', 'monounsaturated_fat_g'
  ];
  
  // Convert mg to mcg or vice versa
  const mgFields = [
    'sodium_mg', 'potassium_mg', 'cholesterol_mg', 'calcium_mg', 'iron_mg',
    'vitamin_e_mg', 'thiamin_mg', 'riboflavin_mg', 'niacin_mg', 'vitamin_b6_mg',
    'pantothenic_acid_mg', 'phosphorus_mg', 'magnesium_mg', 'zinc_mg', 'copper_mg', 'manganese_mg'
  ];
  
  if (fromUnit === 'metric' && toUnit === 'imperial') {
    // Convert grams to ounces (1g = 0.035274oz)
    weightFields.forEach(field => {
      if (result[field] !== undefined) {
        const newField = field.replace('_g', '_oz');
        result[newField] = parseFloat((result[field] * 0.035274).toFixed(2));
        delete result[field];
      }
    });
  } else {
    // Convert ounces to grams (1oz = 28.3495g)
    weightFields.forEach(field => {
      const imperialField = field.replace('_g', '_oz');
      if (result[imperialField] !== undefined) {
        result[field] = parseFloat((result[imperialField] * 28.3495).toFixed(2));
        delete result[imperialField];
      }
    });
  }
  
  return result;
}

/**
 * Calculate nutrition ratio scores (protein:carb:fat ratio, etc.)
 */
export function calculateNutritionRatios(nutritionData: {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
}): {
  protein_ratio: number;
  carbs_ratio: number;
  fat_ratio: number;
  protein_per_calorie: number;
  fiber_per_carb?: number;
} {
  const { calories, protein_g, carbs_g, fat_g, fiber_g } = nutritionData;
  
  // Calculate macronutrient calories
  const proteinCalories = protein_g * 4;
  const carbsCalories = carbs_g * 4;
  const fatCalories = fat_g * 9;
  const totalMacroCalories = proteinCalories + carbsCalories + fatCalories;
  
  // Calculate ratios
  const proteinRatio = parseFloat((proteinCalories / totalMacroCalories).toFixed(2));
  const carbsRatio = parseFloat((carbsCalories / totalMacroCalories).toFixed(2));
  const fatRatio = parseFloat((fatCalories / totalMacroCalories).toFixed(2));
  
  // Calculate protein per calorie (protein density)
  const proteinPerCalorie = parseFloat((protein_g / calories).toFixed(3));
  
  const result: {
    protein_ratio: number;
    carbs_ratio: number;
    fat_ratio: number;
    protein_per_calorie: number;
    fiber_per_carb?: number;
  } = {
    protein_ratio: proteinRatio,
    carbs_ratio: carbsRatio,
    fat_ratio: fatRatio,
    protein_per_calorie: proteinPerCalorie
  };
  
  // Calculate fiber per carb ratio if fiber data is available
  if (fiber_g !== undefined && carbs_g > 0) {
    result.fiber_per_carb = parseFloat((fiber_g / carbs_g).toFixed(2));
  }
  
  return result;
}

/**
 * Calculate portion size conversions
 */
export function convertPortionSize(
  amount: number,
  fromUnit: string,
  toUnit: string,
  servingSizes: Array<{ size: number; unit: string; weight_g: number }>
): number | null {
  // Find serving sizes for both units
  const fromServing = servingSizes.find(s => s.unit === fromUnit);
  const toServing = servingSizes.find(s => s.unit === toUnit);
  
  if (!fromServing || !toServing) {
    return null;
  }
  
  // Calculate weight in grams
  const weightInGrams = (amount * fromServing.weight_g) / fromServing.size;
  
  // Convert to target unit
  return parseFloat(((weightInGrams * toServing.size) / toServing.weight_g).toFixed(2));
}

// Export all functions from the nutrition calculation service
export {
  calculateBmr,
  calculateTdee,
  calculateMacros,
  BmrFormula,
  calculateRecipeNutrition,
  calculateNutritionDensityScore,
  detectNutrientDeficiencies,
  generateNutritionRecommendations
};