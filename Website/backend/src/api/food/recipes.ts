import express from 'express';
import { Request, Response } from 'express';
import Joi from 'joi';
import { Recipe } from '../../database/models/Recipe';
import { Food } from '../../database/models/Food';
import { registerSchema } from '../../middleware/requestValidator';
import { JwtPayload } from '../../auth/types';
import { AuditLogger } from '../../utils/auditLogger';
import { setCache, getCache, deleteCache } from '../../database/cache/redisCache';

const router = express.Router();

// Schema for recipe creation/update
const recipeSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).optional(),
    categories: Joi.array().items(Joi.string()).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    prep_time_minutes: Joi.number().integer().min(0).optional(),
    cook_time_minutes: Joi.number().integer().min(0).optional(),
    servings: Joi.number().integer().min(1).required(),
    ingredients: Joi.array().items(
      Joi.object({
        food_id: Joi.string().optional(),
        name: Joi.string().required(),
        amount: Joi.number().positive().required(),
        unit: Joi.string().required(),
        notes: Joi.string().optional(),
      })
    ).min(1).required(),
    instructions: Joi.array().items(Joi.string()).min(1).required(),
    nutrition_per_serving: Joi.object({
      calories: Joi.number().min(0).optional(),
      protein_g: Joi.number().min(0).optional(),
      carbs_g: Joi.number().min(0).optional(),
      fat_g: Joi.number().min(0).optional(),
      fiber_g: Joi.number().min(0).optional(),
      sugar_g: Joi.number().min(0).optional(),
      sodium_mg: Joi.number().min(0).optional(),
    }).optional(),
    image_url: Joi.string().uri().optional(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
    is_public: Joi.boolean().default(false),
  }),
});

// Register schema for POST /api/foods/recipes
registerSchema('POST:/api/food/recipes', recipeSchema);

// GET /api/foods/recipes - Get user's recipes
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Get query parameters
    const { public: isPublic, limit = '20', page = '1' } = req.query as Record<string, string>;
    const limitNum = parseInt(limit, 10);
    const pageNum = parseInt(page, 10);
    const skip = (pageNum - 1) * limitNum;
    
    // Build query
    const query: Record<string, unknown> = { author_id: userId };
    if (isPublic !== undefined) {
      query.is_public = isPublic === 'true';
    }
    
    // Try to get from cache
    const cacheKey = `recipes:user:${userId}:public:${isPublic}:limit:${limitNum}:page:${pageNum}`;
    const cachedRecipes = await getCache(cacheKey);
    if (cachedRecipes) {
      return res.json(cachedRecipes);
    }
    
    // Get recipes with pagination
    const [recipes, total] = await Promise.all([
      Recipe.find(query)
        .select('name description servings prep_time_minutes cook_time_minutes image_url difficulty is_public rating created_at')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum),
      Recipe.countDocuments(query)
    ]);
    
    const response = {
      recipes,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    };
    
    // Cache for 10 minutes
    await setCache(cacheKey, response, 600);
    
    res.json(response);
  } catch (error) {
    console.error('Get recipes error:', error);
    res.status(500).json({ error: 'Failed to get recipes' });
  }
});

// POST /api/foods/recipes - Create recipe
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Add author information
    const recipeData = {
      ...req.body,
      author_id: userId,
      author: user.email, // Use email as author name for now
    };
    
    // If nutrition is not provided, calculate it from ingredients
    if (!recipeData.nutrition_per_serving) {
      recipeData.nutrition_per_serving = await calculateNutrition(recipeData.ingredients, recipeData.servings);
    }
    
    const recipe = await Recipe.create(recipeData);
    
    // Invalidate user's recipes cache
    await deleteCache(`recipes:user:${userId}:*`);
    
    // Log the creation of recipe
    AuditLogger.log('recipe_created', {
      userId: userId,
      recipeId: recipe._id,
      recipeName: recipe.name,
      isPublic: recipe.is_public,
    });
    
    res.status(201).json(recipe);
  } catch (error) {
    console.error('Create recipe error:', error);
    res.status(500).json({ error: 'Failed to create recipe' });
  }
});

// GET /api/foods/recipes/:id - Get recipe details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Try to get from cache
    const cacheKey = `recipe:${id}`;
    const cachedRecipe = await getCache(cacheKey);
    if (cachedRecipe) {
      // Type guard for cachedRecipe
      if (typeof cachedRecipe === 'object' && cachedRecipe !== null &&
          'author_id' in cachedRecipe && 'is_public' in cachedRecipe) {
        if ((cachedRecipe as Record<string, unknown>).author_id === userId || (cachedRecipe as Record<string, unknown>).is_public) {
          return res.json(cachedRecipe);
        }
      }
    }
    
    // Find recipe by ID
    const recipe = await Recipe.findById(id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    // Check if user has access to this recipe
    if (recipe.author_id !== userId && !recipe.is_public) {
      return res.status(403).json({ error: 'You do not have access to this recipe' });
    }
    
    // Cache recipe for 1 hour
    await setCache(cacheKey, recipe, 3600);
    
    res.json(recipe);
  } catch (error) {
    console.error('Get recipe error:', error);
    res.status(500).json({ error: 'Failed to get recipe details' });
  }
});

// PUT /api/foods/recipes/:id - Update recipe
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Find recipe by ID
    const recipe = await Recipe.findById(id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    // Check if user owns this recipe
    if (recipe.author_id !== userId) {
      return res.status(403).json({ error: 'You do not have permission to update this recipe' });
    }
    
    // Update recipe data
    const recipeData = {
      ...req.body,
      author_id: userId,
      author: user.email,
    };
    
    // If nutrition is not provided, calculate it from ingredients
    if (!recipeData.nutrition_per_serving && recipeData.ingredients) {
      recipeData.nutrition_per_serving = await calculateNutrition(
        recipeData.ingredients,
        recipeData.servings || recipe.servings
      );
    }
    
    const updatedRecipe = await Recipe.findByIdAndUpdate(
      id,
      recipeData,
      { new: true, runValidators: true }
    );
    
    // Invalidate caches
    await deleteCache(`recipe:${id}`);
    await deleteCache(`recipes:user:${userId}:*`);
    
    // Log the update of recipe
    AuditLogger.log('recipe_updated', {
      userId: userId,
      recipeId: id,
      recipeName: updatedRecipe?.name,
      isPublic: updatedRecipe?.is_public,
    });
    
    res.json(updatedRecipe);
  } catch (error) {
    console.error('Update recipe error:', error);
    res.status(500).json({ error: 'Failed to update recipe' });
  }
});

// DELETE /api/foods/recipes/:id - Delete recipe
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Find recipe by ID
    const recipe = await Recipe.findById(id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    // Check if user owns this recipe
    if (recipe.author_id !== userId) {
      return res.status(403).json({ error: 'You do not have permission to delete this recipe' });
    }
    
    await Recipe.findByIdAndDelete(id);
    
    // Invalidate caches
    await deleteCache(`recipe:${id}`);
    await deleteCache(`recipes:user:${userId}:*`);
    
    // Log the deletion of recipe
    AuditLogger.log('recipe_deleted', {
      userId: userId,
      recipeId: id,
      recipeName: recipe.name,
    });
    
    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Delete recipe error:', error);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

// Helper function to calculate nutrition from ingredients
async function calculateNutrition(ingredients: Record<string, unknown>[], servings: number) {
  try {
    const nutrition = {
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sugar_g: 0,
      sodium_mg: 0,
    };
    
    for (const ingredient of ingredients) {
      const amount = typeof ingredient.amount === 'number' ? ingredient.amount : parseFloat(ingredient.amount as string);
      if (ingredient.food_id) {
        // Get food from database
        const food = await Food.findById(ingredient.food_id);
        if (food) {
          // Find the serving size that matches the unit
          const servingSize = food.serving_sizes.find(s => s.unit === ingredient.unit);
          if (servingSize) {
            // Calculate the amount in grams
            const amountInGrams = (amount * servingSize.weight_g) / servingSize.size;
            
            // Calculate nutrition based on amount
            const factor = amountInGrams / 100; // food.nutrition_per_100g is per 100g
            
            nutrition.calories += (food.nutrition_per_100g.calories || 0) * factor;
            nutrition.protein_g += (food.nutrition_per_100g.protein_g || 0) * factor;
            nutrition.carbs_g += (food.nutrition_per_100g.carbs_g || 0) * factor;
            nutrition.fat_g += (food.nutrition_per_100g.fat_g || 0) * factor;
            nutrition.fiber_g += (food.nutrition_per_100g.fiber_g || 0) * factor;
            nutrition.sugar_g += (food.nutrition_per_100g.sugar_g || 0) * factor;
            nutrition.sodium_mg += (food.nutrition_per_100g.sodium_mg || 0) * factor;
          }
        }
      }
    }
    
    // Divide by servings to get nutrition per serving
    Object.keys(nutrition).forEach(key => {
      nutrition[key as keyof typeof nutrition] = Math.round((nutrition[key as keyof typeof nutrition] / servings) * 10) / 10;
    });
    
    return nutrition;
  } catch (error) {
    console.error('Calculate nutrition error:', error);
    return null;
  }
}

export default router;