import express from 'express';
import { Request, Response } from 'express';
import Joi from 'joi';
import { Food } from '../../database/models/Food';
import { Recipe } from '../../database/models/Recipe';
import { UserCustomFood } from '../../database/models/UserCustomFood';
import { RestaurantFood } from '../../database/models/RestaurantFood';
import { registerSchema } from '../../middleware/requestValidator';
import { setCache, getCache } from '../../database/cache/redisCache';

const router = express.Router();

// Schema for nutrition calculation
const nutritionCalcSchema = Joi.object({
  body: Joi.object({
    items: Joi.array().items(
      Joi.object({
        type: Joi.string().valid('food', 'recipe', 'custom', 'restaurant').required(),
        id: Joi.string().required(),
        amount: Joi.number().positive().required(),
        unit: Joi.string().required(),
      })
    ).min(1).required(),
  }),
});

// Register schema for POST /api/foods/nutrition-calc
registerSchema('POST:/api/food/nutrition-calc', nutritionCalcSchema);

// POST /api/foods/nutrition-calc - Calculate nutrition for a list of items
router.post('/', async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    
    // Create cache key based on items
    const cacheKey = `nutrition-calc:${JSON.stringify(items)}`;
    
    // Try to get results from cache
    const cachedResults = await getCache(cacheKey);
    if (cachedResults) {
      return res.json(cachedResults);
    }
    
    // Initialize nutrition totals
    const nutritionTotals = {
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sugar_g: 0,
      sodium_mg: 0,
      // Add other nutrition fields as needed
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
          
          nutritionData = food.nutrition_per_100g;
          servingSize = food.serving_sizes.find(s => s.unit === unit);
          break;
          
        case 'recipe':
          const recipe = await Recipe.findById(id);
          if (!recipe) continue;
          
          nutritionData = recipe.nutrition_per_serving;
          servingSize = { size: 1, unit: 'serving', weight_g: 0 };
          break;
          
        case 'custom':
          const customFood = await UserCustomFood.findById(id);
          if (!customFood) continue;
          
          nutritionData = customFood.nutrition_per_100g;
          servingSize = customFood.serving_sizes.find(s => s.unit === unit);
          break;
          
        case 'restaurant':
          const restaurantFood = await RestaurantFood.findById(id);
          if (!restaurantFood) continue;
          
          nutritionData = restaurantFood.nutrition;
          servingSize = restaurantFood.serving_size;
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
      
      // Add to totals
      nutritionTotals.calories += (nutritionData.calories || 0) * factor;
      nutritionTotals.protein_g += (nutritionData.protein_g || 0) * factor;
      nutritionTotals.carbs_g += (nutritionData.carbs_g || 0) * factor;
      nutritionTotals.fat_g += (nutritionData.fat_g || 0) * factor;
      nutritionTotals.fiber_g += (nutritionData.fiber_g || 0) * factor;
      nutritionTotals.sugar_g += (nutritionData.sugar_g || 0) * factor;
      nutritionTotals.sodium_mg += (nutritionData.sodium_mg || 0) * factor;
      // Add other nutrition fields as needed
    }
    
    // Round values to 1 decimal place
    Object.keys(nutritionTotals).forEach(key => {
      nutritionTotals[key as keyof typeof nutritionTotals] = 
        Math.round(nutritionTotals[key as keyof typeof nutritionTotals] * 10) / 10;
    });
    
    // Cache results for 1 hour
    await setCache(cacheKey, nutritionTotals, 3600);
    
    res.json(nutritionTotals);
  } catch (error) {
    console.error('Nutrition calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate nutrition' });
  }
});

export default router;