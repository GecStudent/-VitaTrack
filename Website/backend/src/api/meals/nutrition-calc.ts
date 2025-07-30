import express from 'express';
import { Request, Response } from 'express';
import Joi from 'joi';
import axios from 'axios';
import { JwtPayload } from '../../auth/types';
import { registerSchema } from '../../middleware/requestValidator';
import MealLogRepository from '../../database/repositories/MealLogRepository';
// import MealItemRepository from '../../database/repositories/MealItemRepository';
import { setCache, getCache } from '../../database/cache/redisCache';

const router = express.Router();

// Schema for meal nutrition calculation
const mealNutritionSchema = Joi.object({
  body: Joi.object({
    mealLogId: Joi.string().uuid().optional(),
    items: Joi.array().items(
      Joi.object({
        type: Joi.string().valid('food', 'recipe', 'custom', 'restaurant').required(),
        id: Joi.string().required(),
        amount: Joi.number().positive().required(),
        unit: Joi.string().required(),
      })
    ).when('mealLogId', { is: Joi.exist(), then: Joi.forbidden(), otherwise: Joi.required() }),
  }),
});

// Register schema for POST /api/meals/nutrition
registerSchema('POST:/api/meals/nutrition', mealNutritionSchema);

// POST /api/meals/nutrition - Calculate nutrition for a meal
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const { mealLogId, items } = req.body;
    
    let nutritionItems;
    
    if (mealLogId) {
      // Calculate nutrition for an existing meal log
      const mealLog = await MealLogRepository.findOne({
        where: { id: mealLogId, userId },
        relations: ['mealItems']
      });
      
      if (!mealLog) {
        return res.status(404).json({ error: 'Meal log not found' });
      }
      
      // Convert meal items to nutrition calculation format
      nutritionItems = mealLog.mealItems.map(item => ({
        type: 'food', // Assuming food type, adjust as needed
        id: item.foodId,
        amount: item.servingSize,
        unit: item.servingUnit
      }));
    } else {
      // Calculate nutrition for provided items
      nutritionItems = items;
    }
    
    // Create cache key based on items
    const cacheKey = `meal-nutrition:${JSON.stringify(nutritionItems)}`;
    
    // Try to get results from cache
    const cachedResults = await getCache(cacheKey);
    if (cachedResults) {
      return res.json(cachedResults);
    }
    
    // Call the existing nutrition calculation service
    try {
      const response = await axios.post('http://localhost:3000/api/food/nutrition-calc', {
        items: nutritionItems
      }, {
        headers: {
          'Authorization': req.headers.authorization
        }
      });
      
      const nutritionData = response.data;
      
      // Cache results for 1 hour
      await setCache(cacheKey, nutritionData, 3600);
      
      res.json(nutritionData);
    } catch (error) {
      console.error('Nutrition calculation service error:', error);
      res.status(500).json({ error: 'Failed to calculate nutrition' });
    }
  } catch (error) {
    console.error('Meal nutrition calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate meal nutrition' });
  }
});

// GET /api/meals/nutrition/:id - Get nutrition for a specific meal
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Get meal log
    const mealLog = await MealLogRepository.findOne({
      where: { id, userId },
      relations: ['mealItems']
    });
    
    if (!mealLog) {
      return res.status(404).json({ error: 'Meal log not found' });
    }
    
    // Convert meal items to nutrition calculation format
    const nutritionItems = mealLog.mealItems.map(item => ({
      type: 'food', // Assuming food type, adjust as needed
      id: item.foodId,
      amount: item.servingSize,
      unit: item.servingUnit
    }));
    
    // Create cache key based on items
    const cacheKey = `meal-nutrition:${JSON.stringify(nutritionItems)}`;
    
    // Try to get results from cache
    const cachedResults = await getCache(cacheKey);
    if (cachedResults) {
      return res.json(cachedResults);
    }
    
    // Call the existing nutrition calculation service
    try {
      const response = await axios.post('http://localhost:3000/api/food/nutrition-calc', {
        items: nutritionItems
      }, {
        headers: {
          'Authorization': req.headers.authorization
        }
      });
      
      const nutritionData = response.data;
      
      // Cache results for 1 hour
      await setCache(cacheKey, nutritionData, 3600);
      
      res.json(nutritionData);
    } catch (error) {
      console.error('Nutrition calculation service error:', error);
      res.status(500).json({ error: 'Failed to calculate nutrition' });
    }
  } catch (error) {
    console.error('Get meal nutrition error:', error);
    res.status(500).json({ error: 'Failed to get meal nutrition' });
  }
});

// GET /api/meals/nutrition/daily/:date - Get nutrition totals for a specific day
router.get('/daily/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Parse date
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    
    // Get all meals for the date
    const mealLogs = await MealLogRepository.findByDate(userId, targetDate);
    
    if (mealLogs.length === 0) {
      return res.json({
        date: targetDate.toISOString().split('T')[0],
        meals: [],
        totals: {
          calories: 0,
          protein_g: 0,
          carbs_g: 0,
          fat_g: 0,
          fiber_g: 0,
          sugar_g: 0,
          sodium_mg: 0
        }
      });
    }
    
    // Calculate nutrition for each meal
    const mealNutrition = [];
    const totals = {
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sugar_g: 0,
      sodium_mg: 0
    };
    
    for (const mealLog of mealLogs) {
      // Convert meal items to nutrition calculation format
      const nutritionItems = mealLog.mealItems.map(item => ({
        type: 'food', // Assuming food type, adjust as needed
        id: item.foodId,
        amount: item.servingSize,
        unit: item.servingUnit
      }));
      
      // Create cache key based on items
      const cacheKey = `meal-nutrition:${JSON.stringify(nutritionItems)}`;
      
      // Try to get results from cache or calculate
      let mealNutritionData;
      const cachedResults = await getCache(cacheKey);
      
      if (cachedResults) {
        mealNutritionData = cachedResults;
      } else {
        try {
          const response = await axios.post('http://localhost:3000/api/food/nutrition-calc', {
            items: nutritionItems
          }, {
            headers: {
              'Authorization': req.headers.authorization
            }
          });
          
          mealNutritionData = response.data;
          
          // Cache results for 1 hour
          await setCache(cacheKey, mealNutritionData, 3600);
        } catch (error) {
          console.error('Nutrition calculation service error:', error);
          continue; // Skip this meal if calculation fails
        }
      }
      
      // Add to meal nutrition array
      mealNutrition.push({
        mealId: mealLog.id,
        mealType: mealLog.mealType,
        logDate: mealLog.logDate,
        nutrition: mealNutritionData
      });
      
      // Add to totals
      totals.calories += mealNutritionData.calories || 0;
      totals.protein_g += mealNutritionData.protein_g || 0;
      totals.carbs_g += mealNutritionData.carbs_g || 0;
      totals.fat_g += mealNutritionData.fat_g || 0;
      totals.fiber_g += mealNutritionData.fiber_g || 0;
      totals.sugar_g += mealNutritionData.sugar_g || 0;
      totals.sodium_mg += mealNutritionData.sodium_mg || 0;
    }
    
    // Round totals to 1 decimal place
    Object.keys(totals).forEach(key => {
      totals[key as keyof typeof totals] = 
        Math.round(totals[key as keyof typeof totals] * 10) / 10;
    });
    
    res.json({
      date: targetDate.toISOString().split('T')[0],
      meals: mealNutrition,
      totals
    });
  } catch (error) {
    console.error('Daily nutrition calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate daily nutrition' });
  }
});

export default router;