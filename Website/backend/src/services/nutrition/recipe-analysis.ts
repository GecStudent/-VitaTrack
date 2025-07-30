import { Food } from '../../database/models/Food';
import { Recipe } from '../../database/models/Recipe';
import { UserCustomFood } from '../../database/models/UserCustomFood';
import { RestaurantFood } from '../../database/models/RestaurantFood';
import { setCache, getCache } from '../../database/cache/redisCache';

export type Nutrition = {
  [key: string]: number;
};

/**
 * Interface for ingredient with nutrition data
 */
interface IngredientWithNutrition {
  food_id?: string;
  name: string;
  amount: number;
  unit: string;
  nutritionData: any;
  servingSize: any;
  type: 'food' | 'recipe' | 'custom' | 'restaurant';
}

/**
 * Calculate nutrition for a recipe based on its ingredients
 */
export async function calculateRecipeNutrition(
  ingredients: Array<{
    food_id?: string;
    type: 'food' | 'recipe' | 'custom' | 'restaurant';
    name: string;
    amount: number;
    unit: string;
    notes?: string;
  }>,
  servings: number
): Promise<{
  nutrition_per_serving: Nutrition;
  nutrition_total: Nutrition;
}> {
  // Create cache key based on ingredients and servings
  const cacheKey = `recipe-nutrition:${JSON.stringify(ingredients)}:${servings}`;
  
  // Try to get results from cache
  const cachedResults = await getCache(cacheKey);
  if (cachedResults && typeof cachedResults === 'object' && 'nutrition_per_serving' in cachedResults && 'nutrition_total' in cachedResults) {
    return {
      nutrition_per_serving: cachedResults.nutrition_per_serving as Nutrition,
      nutrition_total: cachedResults.nutrition_total as Nutrition
    };
  }
  return { nutrition_per_serving: {}, nutrition_total: {} };
  
  // Initialize nutrition totals
  const nutritionTotal: Nutrition = {
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    saturated_fat_g: 0,
    trans_fat_g: 0,
    polyunsaturated_fat_g: 0,
    monounsaturated_fat_g: 0,
    cholesterol_mg: 0,
    sodium_mg: 0,
    potassium_mg: 0,
    fiber_g: 0,
    sugar_g: 0,
    added_sugar_g: 0,
    vitamin_a_iu: 0,
    vitamin_c_mg: 0,
    calcium_mg: 0,
    iron_mg: 0,
    vitamin_d_iu: 0,
    vitamin_e_mg: 0,
    vitamin_k_mcg: 0,
    thiamin_mg: 0,
    riboflavin_mg: 0,
    niacin_mg: 0,
    vitamin_b6_mg: 0,
    folate_mcg: 0,
    vitamin_b12_mcg: 0,
    biotin_mcg: 0,
    pantothenic_acid_mg: 0,
    phosphorus_mg: 0,
    iodine_mcg: 0,
    magnesium_mg: 0,
    zinc_mg: 0,
    selenium_mcg: 0,
    copper_mg: 0,
    manganese_mg: 0,
    chromium_mcg: 0,
    molybdenum_mcg: 0,
    chloride_mg: 0
  };
  
  // Process each ingredient
  const ingredientsWithNutrition: IngredientWithNutrition[] = [];
  
  for (const ingredient of ingredients) {
    const { type, food_id, amount, unit } = ingredient;
    
    if (!food_id) continue;
    
    let nutritionData;
    let servingSize;
    
    // Get nutrition data based on ingredient type
    switch (type) {
      case 'food':
        const food = await Food.findById(food_id);
        if (!food) continue;
        
        nutritionData = food!.nutrition_per_100g;
        servingSize = food!.serving_sizes.find(s => s.unit === unit);
        break;
        
      case 'recipe':
        const recipe = await Recipe.findById(food_id);
        if (!recipe) continue;
        
        nutritionData = recipe!.nutrition_per_serving;
        servingSize = { size: 1, unit: 'serving', weight_g: 0 };
        break;
        
      case 'custom':
        const customFood = await UserCustomFood.findById(food_id);
        if (!customFood) continue;
        
        nutritionData = customFood!.nutrition_per_100g;
        servingSize = customFood!.serving_sizes.find(s => s.unit === unit);
        break;
        
      case 'restaurant':
        const restaurantFood = await RestaurantFood.findById(food_id);
        if (!restaurantFood) continue;
        
        nutritionData = restaurantFood!.nutrition;
        servingSize = restaurantFood!.serving_size;
        break;
        
      default:
        continue;
    }
    
    if (!nutritionData || !servingSize) continue;
    
    ingredientsWithNutrition.push({
      ...ingredient,
      nutritionData,
      servingSize,
      type
    });
  }
  
  // Calculate nutrition for each ingredient and add to totals
  for (const ingredient of ingredientsWithNutrition) {
    const { nutritionData, servingSize, amount, type } = ingredient;
    
    let factor;
    
    if (type === 'recipe') {
      // For recipes, amount is in servings
      factor = amount;
    } else {
      // For foods, calculate based on weight in grams
      const amountInGrams = (amount * servingSize.weight_g) / servingSize.size;
      factor = amountInGrams / 100; // nutrition_per_100g is per 100g
    }
    
    // Add to totals for each nutrition field
    Object.keys(nutritionTotal).forEach(key => {
      if (nutritionData[key]) {
        nutritionTotal[key as keyof typeof nutritionTotal] += nutritionData[key] * factor;
      }
    });
  }
  
  // Calculate nutrition per serving
  const nutritionPerServing: Nutrition = { ...nutritionTotal };
  
  Object.keys(nutritionPerServing).forEach(key => {
    nutritionPerServing[key as keyof typeof nutritionPerServing] = 
      parseFloat((nutritionTotal[key as keyof typeof nutritionTotal] / servings).toFixed(2));
  });
  
  // Round total values to 2 decimal places
  Object.keys(nutritionTotal).forEach(key => {
    nutritionTotal[key as keyof typeof nutritionTotal] = 
      parseFloat(nutritionTotal[key as keyof typeof nutritionTotal].toFixed(2));
  });
  
  const result = {
    nutrition_per_serving: nutritionPerServing,
    nutrition_total: nutritionTotal
  };
  
  // Cache results for 1 hour
  await setCache(cacheKey, result, 3600);
  
  return result;
}

/**
 * Calculate nutrition density score for a recipe (0-100)
 * Higher score means more nutrients per calorie
 */
export function calculateNutritionDensityScore(nutritionData: any): number {
  // Base score on nutrient density relative to calories
  let score = 0;
  
  // Positive contributors (nutrients we want more of)
  if (nutritionData.protein_g) {
    score += (nutritionData.protein_g / nutritionData.calories) * 400; // Protein is highly valued
  }
  
  if (nutritionData.fiber_g) {
    score += (nutritionData.fiber_g / nutritionData.calories) * 500; // Fiber is highly valued
  }
  
  // Micronutrients (simplified scoring)
  const micronutrients = [
    'vitamin_a_iu', 'vitamin_c_mg', 'calcium_mg', 'iron_mg',
    'vitamin_d_iu', 'vitamin_e_mg', 'vitamin_k_mcg', 'thiamin_mg',
    'riboflavin_mg', 'niacin_mg', 'vitamin_b6_mg', 'folate_mcg',
    'vitamin_b12_mcg', 'biotin_mcg', 'pantothenic_acid_mg', 'phosphorus_mg',
    'iodine_mcg', 'magnesium_mg', 'zinc_mg', 'selenium_mcg',
    'copper_mg', 'manganese_mg', 'chromium_mcg', 'molybdenum_mcg',
    'potassium_mg'
  ];
  
  let micronutrientScore = 0;
  let micronutrientCount = 0;
  
  micronutrients.forEach(nutrient => {
    if (nutritionData[nutrient]) {
      micronutrientScore += 1;
      micronutrientCount++;
    }
  });
  
  if (micronutrientCount > 0) {
    score += (micronutrientScore / micronutrientCount) * 20;
  }
  
  // Negative contributors (nutrients we want less of)
  if (nutritionData.saturated_fat_g) {
    score -= (nutritionData.saturated_fat_g / nutritionData.calories) * 200;
  }
  
  if (nutritionData.trans_fat_g) {
    score -= (nutritionData.trans_fat_g / nutritionData.calories) * 400; // Trans fat heavily penalized
  }
  
  if (nutritionData.added_sugar_g) {
    score -= (nutritionData.added_sugar_g / nutritionData.calories) * 200;
  }
  
  if (nutritionData.sodium_mg) {
    score -= (nutritionData.sodium_mg / nutritionData.calories) * 0.05;
  }
  
  // Normalize score to 0-100 range
  score = Math.max(0, Math.min(100, score));
  
  return Math.round(score);
}

/**
 * Analyze a recipe for allergens and dietary restrictions
 */
export async function analyzeRecipeDietaryProfile(
  ingredients: Array<{
    food_id?: string;
    type: 'food' | 'recipe' | 'custom' | 'restaurant';
    name: string;
  }>
): Promise<{
  allergens: string[];
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_dairy_free: boolean;
  is_nut_free: boolean;
}> {
  const allergens = new Set<string>();
  let isVegetarian = true;
  let isVegan = true;
  let isGlutenFree = true;
  let isDairyFree = true;
  let isNutFree = true;
  
  // Common non-vegetarian ingredients
  const nonVegetarianIngredients = ['beef', 'chicken', 'pork', 'lamb', 'turkey', 'duck', 'goose', 'fish', 'shellfish'];
  
  // Common non-vegan ingredients (includes vegetarian but non-vegan)
  const nonVeganIngredients = [...nonVegetarianIngredients, 'milk', 'cheese', 'butter', 'cream', 'yogurt', 'egg', 'honey'];
  
  // Common gluten-containing ingredients
  const glutenIngredients = ['wheat', 'barley', 'rye', 'triticale', 'semolina', 'farina', 'spelt'];
  
  // Common dairy ingredients
  const dairyIngredients = ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'whey'];
  
  // Common nut ingredients
  const nutIngredients = ['almond', 'walnut', 'pecan', 'cashew', 'pistachio', 'hazelnut', 'macadamia', 'brazil nut', 'pine nut'];
  
  for (const ingredient of ingredients) {
    const { type, food_id } = ingredient;
    
    if (!food_id) continue;
    
    let ingredientData: any;
    
    // Get ingredient data based on type
    switch (type) {
      case 'food':
        ingredientData = await Food.findById(food_id);
        break;
        
      case 'recipe':
        ingredientData = await Recipe.findById(food_id);
        break;
        
      case 'custom':
        ingredientData = await UserCustomFood.findById(food_id);
        break;
        
      case 'restaurant':
        ingredientData = await RestaurantFood.findById(food_id);
        break;
        
      default:
        continue;
    }
    
    if (!ingredientData) continue;
    
    // Check for allergens
    if (ingredientData.allergens && Array.isArray(ingredientData.allergens)) {
      ingredientData.allergens.forEach((allergen: string) => allergens.add(allergen));
    }
    
    // Check dietary restrictions based on ingredient name and ingredients list
    const ingredientName = ingredientData.name.toLowerCase();
    const ingredientsList = ingredientData.ingredients ? ingredientData.ingredients.toLowerCase() : '';
    
    // Check vegetarian status
    if (isVegetarian) {
      isVegetarian = !nonVegetarianIngredients.some(item => 
        ingredientName.includes(item) || ingredientsList.includes(item)
      );
    }
    
    // Check vegan status
    if (isVegan) {
      isVegan = !nonVeganIngredients.some(item => 
        ingredientName.includes(item) || ingredientsList.includes(item)
      );
    }
    
    // Check gluten-free status
    if (isGlutenFree) {
      isGlutenFree = !glutenIngredients.some(item => 
        ingredientName.includes(item) || ingredientsList.includes(item)
      );
    }
    
    // Check dairy-free status
    if (isDairyFree) {
      isDairyFree = !dairyIngredients.some(item => 
        ingredientName.includes(item) || ingredientsList.includes(item)
      );
    }
    
    // Check nut-free status
    if (isNutFree) {
      isNutFree = !nutIngredients.some(item => 
        ingredientName.includes(item) || ingredientsList.includes(item)
      );
    }
  }
  
  return {
    allergens: Array.from(allergens),
    is_vegetarian: isVegetarian,
    is_vegan: isVegan,
    is_gluten_free: isGlutenFree,
    is_dairy_free: isDairyFree,
    is_nut_free: isNutFree
  };
}