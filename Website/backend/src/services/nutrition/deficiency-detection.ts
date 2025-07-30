import { setCache, getCache } from '../../database/cache/redisCache';
import MealLogRepository from '../../database/repositories/MealLogRepository';
import axios from 'axios';

// Daily recommended intake for various nutrients (simplified)
const DAILY_RECOMMENDED_INTAKE: Record<string, { min: number; optimal: number; max: number }> = {
  calories: { min: 1500, optimal: 2000, max: 2500 },
  protein_g: { min: 50, optimal: 70, max: 100 },
  carbs_g: { min: 225, optimal: 275, max: 325 },
  fat_g: { min: 44, optimal: 67, max: 89 },
  fiber_g: { min: 25, optimal: 30, max: 35 },
  sugar_g: { min: 0, optimal: 25, max: 50 },
  sodium_mg: { min: 1500, optimal: 2300, max: 2300 },
  potassium_mg: { min: 3500, optimal: 4700, max: 5000 },
  vitamin_a_iu: { min: 3000, optimal: 5000, max: 10000 },
  vitamin_c_mg: { min: 75, optimal: 90, max: 2000 },
  calcium_mg: { min: 1000, optimal: 1200, max: 2500 },
  iron_mg: { min: 8, optimal: 18, max: 45 },
  vitamin_d_iu: { min: 600, optimal: 800, max: 4000 },
  vitamin_e_mg: { min: 15, optimal: 15, max: 1000 },
  vitamin_k_mcg: { min: 90, optimal: 120, max: 1000 },
  thiamin_mg: { min: 1.1, optimal: 1.2, max: 100 },
  riboflavin_mg: { min: 1.1, optimal: 1.3, max: 100 },
  niacin_mg: { min: 14, optimal: 16, max: 35 },
  vitamin_b6_mg: { min: 1.3, optimal: 1.7, max: 100 },
  folate_mcg: { min: 400, optimal: 400, max: 1000 },
  vitamin_b12_mcg: { min: 2.4, optimal: 2.4, max: 100 },
  biotin_mcg: { min: 30, optimal: 30, max: 1000 },
  pantothenic_acid_mg: { min: 5, optimal: 5, max: 1000 },
  phosphorus_mg: { min: 700, optimal: 700, max: 4000 },
  iodine_mcg: { min: 150, optimal: 150, max: 1100 },
  magnesium_mg: { min: 320, optimal: 420, max: 750 },
  zinc_mg: { min: 8, optimal: 11, max: 40 },
  selenium_mcg: { min: 55, optimal: 55, max: 400 },
  copper_mg: { min: 0.9, optimal: 0.9, max: 10 },
  manganese_mg: { min: 1.8, optimal: 2.3, max: 11 },
  chromium_mcg: { min: 25, optimal: 35, max: 1000 },
  molybdenum_mcg: { min: 45, optimal: 45, max: 2000 },
  chloride_mg: { min: 2300, optimal: 2300, max: 3600 }
};

// Nutrient deficiency symptoms and recommendations
const NUTRIENT_DEFICIENCY_INFO: Record<string, { symptoms: string[]; recommendations: string[] }> = {
  protein_g: {
    symptoms: ['Muscle weakness', 'Fatigue', 'Slow wound healing', 'Decreased immune function'],
    recommendations: ['Increase intake of lean meats, fish, eggs, dairy, legumes, and nuts']
  },
  fiber_g: {
    symptoms: ['Constipation', 'Irregular bowel movements', 'Increased hunger'],
    recommendations: ['Increase intake of whole grains, fruits, vegetables, and legumes']
  },
  vitamin_a_iu: {
    symptoms: ['Night blindness', 'Dry skin', 'Increased susceptibility to infections'],
    recommendations: ['Increase intake of carrots, sweet potatoes, spinach, and liver']
  },
  vitamin_c_mg: {
    symptoms: ['Weakened immune system', 'Slow wound healing', 'Bleeding gums'],
    recommendations: ['Increase intake of citrus fruits, strawberries, bell peppers, and broccoli']
  },
  calcium_mg: {
    symptoms: ['Muscle cramps', 'Weak bones', 'Numbness in fingers'],
    recommendations: ['Increase intake of dairy products, fortified plant milks, leafy greens, and canned fish with bones']
  },
  iron_mg: {
    symptoms: ['Fatigue', 'Weakness', 'Pale skin', 'Shortness of breath'],
    recommendations: ['Increase intake of red meat, spinach, lentils, and fortified cereals']
  },
  vitamin_d_iu: {
    symptoms: ['Bone pain', 'Muscle weakness', 'Increased risk of fractures'],
    recommendations: ['Increase sun exposure, consume fatty fish, egg yolks, and fortified foods']
  },
  magnesium_mg: {
    symptoms: ['Muscle cramps', 'Fatigue', 'Irregular heartbeat'],
    recommendations: ['Increase intake of nuts, seeds, whole grains, and leafy greens']
  },
  zinc_mg: {
    symptoms: ['Reduced immune function', 'Loss of appetite', 'Impaired taste'],
    recommendations: ['Increase intake of oysters, red meat, poultry, beans, and nuts']
  },
  vitamin_b12_mcg: {
    symptoms: ['Fatigue', 'Weakness', 'Numbness in hands and feet', 'Memory problems'],
    recommendations: ['Increase intake of animal products or consider supplements if vegetarian/vegan']
  }
};

export type DeficiencyDetectionResult = {
  deficiencies: any[];
  adequate_nutrients: string[];
  excessive_nutrients: string[];
};

/**
 * Analyze nutrient intake over a period and detect potential deficiencies
 */
export async function detectNutrientDeficiencies(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<DeficiencyDetectionResult> {
  // Create cache key
  const cacheKey = `nutrient-deficiency:${userId}:${startDate.toISOString()}:${endDate.toISOString()}`;
  
  // Try to get from cache
  const cachedResult = await getCache(cacheKey);
  if (cachedResult && typeof cachedResult === 'object' && 'deficiencies' in cachedResult && 'adequate_nutrients' in cachedResult && 'excessive_nutrients' in cachedResult) {
    return cachedResult as DeficiencyDetectionResult;
  }
  return { deficiencies: [], adequate_nutrients: [], excessive_nutrients: [] };
  
  // Get all meal logs for the date range
  const mealLogs = await MealLogRepository.findByDateRange(userId, startDate, endDate);
  
  if (mealLogs.length === 0) {
    return {
      deficiencies: [],
      adequate_nutrients: [],
      excessive_nutrients: []
    };
  }
  
  // Calculate average daily intake for each nutrient
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  const totalNutrients: Record<string, number> = {};
  
  // Initialize total nutrients
  Object.keys(DAILY_RECOMMENDED_INTAKE).forEach(nutrient => {
    totalNutrients[nutrient] = 0;
  });
  
  // Process each meal log
  for (const mealLog of mealLogs) {
    // Convert meal items to nutrition calculation format
    const nutritionItems = mealLog.mealItems.map(item => ({
      type: 'food', // Assuming food type, adjust as needed
      id: item.foodId,
      amount: item.servingSize,
      unit: item.servingUnit
    }));
    
    // Calculate nutrition for this meal
    try {
      const response = await axios.post('http://localhost:3000/api/food/nutrition-calc', {
        items: nutritionItems
      });
      
      const nutritionData = response.data;
      
      // Add to total nutrients
      Object.keys(nutritionData).forEach(nutrient => {
        if (totalNutrients[nutrient] !== undefined) {
          totalNutrients[nutrient] += nutritionData[nutrient] || 0;
        }
      });
    } catch (error) {
      console.error('Nutrition calculation error:', error);
      // Continue with next meal log
    }
  }
  
  // Calculate average daily intake
  const averageDailyIntake: Record<string, number> = {};
  Object.keys(totalNutrients).forEach(nutrient => {
    averageDailyIntake[nutrient] = totalNutrients[nutrient] / totalDays;
  });
  
  // Detect deficiencies
  const deficiencies = [];
  const adequateNutrients = [];
  const excessiveNutrients = [];
  
  for (const [nutrient, intake] of Object.entries(averageDailyIntake)) {
    if (!DAILY_RECOMMENDED_INTAKE[nutrient]) continue;
    
    const { min, optimal, max } = DAILY_RECOMMENDED_INTAKE[nutrient];
    const percentageOfRecommended = (intake / optimal) * 100;
    
    if (intake < min) {
      // Determine severity
      let severity: 'mild' | 'moderate' | 'severe' = 'mild';
      if (percentageOfRecommended < 50) {
        severity = 'severe';
      } else if (percentageOfRecommended < 75) {
        severity = 'moderate';
      }
      
      // Get symptoms and recommendations if available
      const info = NUTRIENT_DEFICIENCY_INFO[nutrient] || {
        symptoms: [],
        recommendations: [`Increase intake of foods rich in ${nutrient}`]
      };
      
      deficiencies.push({
        nutrient,
        current_intake: parseFloat(intake.toFixed(2)),
        recommended_intake: optimal,
        percentage_of_recommended: parseFloat(percentageOfRecommended.toFixed(1)),
        severity,
        symptoms: info.symptoms,
        recommendations: info.recommendations
      });
    } else if (intake > max) {
      excessiveNutrients.push(nutrient);
    } else {
      adequateNutrients.push(nutrient);
    }
  }
  
  // Sort deficiencies by severity and percentage
  const severityOrder = { severe: 3, moderate: 2, mild: 1 } as const;
  deficiencies.sort((a, b) => {
    if ((severityOrder as any)[a.severity] !== (severityOrder as any)[b.severity]) {
      return (severityOrder as any)[b.severity] - (severityOrder as any)[a.severity];
    }
    return b.percentage_of_recommended - a.percentage_of_recommended;
  });
  
  const result = {
    deficiencies,
    adequate_nutrients: adequateNutrients,
    excessive_nutrients: excessiveNutrients
  };
  
  // Cache result for 12 hours
  await setCache(cacheKey, result, 43200);
  
  return result;
}

/**
 * Generate personalized nutrition recommendations based on deficiencies
 */
export function generateNutritionRecommendations(
  deficiencies: Array<{
    nutrient: string;
    severity: 'mild' | 'moderate' | 'severe';
  }>,
  dietaryPreferences: string[] = []
): string[] {
  const recommendations: string[] = [];
  
  // General recommendations
  recommendations.push('Focus on eating a varied diet with plenty of fruits, vegetables, whole grains, lean proteins, and healthy fats.');
  
  // Specific recommendations based on deficiencies
  const severeDeficiencies = deficiencies.filter(d => d.severity === 'severe');
  const moderateDeficiencies = deficiencies.filter(d => d.severity === 'moderate');
  
  if (severeDeficiencies.length > 0) {
    recommendations.push('Priority nutrients to increase in your diet:');
    severeDeficiencies.forEach(deficiency => {
      const info = NUTRIENT_DEFICIENCY_INFO[deficiency.nutrient];
      if (info && info.recommendations) {
        recommendations.push(`- ${deficiency.nutrient}: ${info.recommendations[0]}`);
      }
    });
  }
  
  if (moderateDeficiencies.length > 0) {
    recommendations.push('Also consider increasing these nutrients:');
    moderateDeficiencies.forEach(deficiency => {
      const info = NUTRIENT_DEFICIENCY_INFO[deficiency.nutrient];
      if (info && info.recommendations) {
        recommendations.push(`- ${deficiency.nutrient}: ${info.recommendations[0]}`);
      }
    });
  }
  
  // Dietary preference specific recommendations
  if (dietaryPreferences.includes('vegetarian') || dietaryPreferences.includes('vegan')) {
    if (deficiencies.some(d => d.nutrient === 'vitamin_b12_mcg')) {
      recommendations.push('As a vegetarian/vegan, consider B12 supplementation or fortified foods like nutritional yeast and plant milks.');
    }
    if (deficiencies.some(d => d.nutrient === 'iron_mg')) {
      recommendations.push('Combine iron-rich plant foods with vitamin C sources to enhance absorption.');
    }
  }
  
  // Add meal planning recommendation
  recommendations.push('Consider using the meal planning feature to create balanced meals that address your specific nutrient needs.');
  
  return recommendations;
}