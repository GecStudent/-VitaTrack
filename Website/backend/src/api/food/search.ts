import express from 'express';
import { Request, Response } from 'express';
import Joi from 'joi';
import { Food } from '../../database/models/Food';
import { Recipe } from '../../database/models/Recipe';
import { RestaurantFood } from '../../database/models/RestaurantFood';
import { registerSchema } from '../../middleware/requestValidator';
import { setCache, getCache } from '../../database/cache/redisCache';

const router = express.Router();

// Schema for food search validation
const foodSearchSchema = Joi.object({
  query: Joi.object({
    q: Joi.string().min(2).required(),
    type: Joi.string().valid('all', 'food', 'recipe', 'restaurant').default('all'),
    category: Joi.string().optional(),
    brand: Joi.string().optional(),
    limit: Joi.number().integer().min(1).max(100).default(20),
    page: Joi.number().integer().min(1).default(1),
    verified: Joi.boolean().optional(),
  }),
});

// Register schema for GET /api/foods/search
registerSchema('GET:/api/food/search', foodSearchSchema);

// GET /api/foods/search - Search food database
router.get('/', async (req: Request, res: Response) => {
  try {
    const { q, type, category, brand, limit, page, verified } = req.query as Record<string, string>;
    
    // Create cache key based on query parameters
    const cacheKey = `food:search:${q}:${type}:${category || ''}:${brand || ''}:${limit}:${page}:${verified || ''}`;
    
    // Try to get results from cache
    const cachedResults = await getCache(cacheKey);
    if (cachedResults) {
      return res.json(cachedResults);
    }
    
    // Base search query
    const baseQuery: Record<string, unknown> = {};
    
    // Add text search if query is provided
    if (q) {
      baseQuery.$text = { $search: q };
    }
    
    // Add category filter if provided
    if (category) {
      baseQuery.categories = category;
    }
    
    // Add verified filter if provided
    if (verified !== undefined) {
      baseQuery.verified = verified === 'true';
    }
    
    // Calculate pagination
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    const skip = (pageNum - 1) * limitNum;
    
    let results: Record<string, unknown[]> = { foods: [], recipes: [], restaurant_foods: [] };
    let total = 0;
    
    // Search based on type
    if (type === 'all' || type === 'food') {
      const foodQuery = { ...baseQuery };
      if (brand) {
        foodQuery.brand = brand;
      }
      
      const [foods, foodCount] = await Promise.all([
        Food.find(foodQuery)
          .select('name brand description categories nutrition_per_100g image_url verified')
          .skip(skip)
          .limit(limitNum)
          .sort({ verified: -1, name: 1 }),
        Food.countDocuments(foodQuery)
      ]);
      
      results.foods = foods;
      total += foodCount;
    }
    
    if (type === 'all' || type === 'recipe') {
      const recipeQuery = { ...baseQuery, is_public: true };
      
      const [recipes, recipeCount] = await Promise.all([
        Recipe.find(recipeQuery)
          .select('name description categories nutrition_per_serving image_url difficulty rating')
          .skip(skip)
          .limit(limitNum)
          .sort({ rating: -1, name: 1 }),
        Recipe.countDocuments(recipeQuery)
      ]);
      
      results.recipes = recipes;
      total += recipeCount;
    }
    
    if (type === 'all' || type === 'restaurant') {
      const restaurantQuery = { ...baseQuery };
      if (brand) {
        restaurantQuery.restaurant_chain = brand;
      }
      
      const [restaurantFoods, restaurantCount] = await Promise.all([
        RestaurantFood.find(restaurantQuery)
          .select('restaurant_name restaurant_chain item_name description nutrition image_url')
          .skip(skip)
          .limit(limitNum)
          .sort({ restaurant_name: 1, item_name: 1 }),
        RestaurantFood.countDocuments(restaurantQuery)
      ]);
      
      results.restaurant_foods = restaurantFoods;
      total += restaurantCount;
    }
    
    // Prepare response
    const response = {
      results,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    };
    
    // Cache results for 1 hour
    await setCache(cacheKey, response, 3600);
    
    res.json(response);
  } catch (error) {
    console.error('Food search error:', error);
    res.status(500).json({ error: 'Failed to search foods' });
  }
});

// GET /api/foods/:id - Get food details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Try to get from cache
    const cacheKey = `food:${id}`;
    const cachedFood = await getCache(cacheKey);
    if (cachedFood) {
      return res.json(cachedFood);
    }
    
    // Find food by ID
    const food = await Food.findById(id);
    if (!food) {
      return res.status(404).json({ error: 'Food not found' });
    }
    
    // Cache food for 24 hours
    await setCache(cacheKey, food, 86400);
    
    res.json(food);
  } catch (error) {
    console.error('Get food error:', error);
    res.status(500).json({ error: 'Failed to get food details' });
  }
});

export default router;