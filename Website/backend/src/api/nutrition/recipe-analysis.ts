import express from 'express';
import { Request, Response } from 'express';
import Joi from 'joi';
import { registerSchema } from '../../middleware/requestValidator';
import { 
  calculateRecipeNutrition,
  calculateNutritionDensityScore,
  analyzeRecipeDietaryProfile
} from '../../services/nutrition/recipe-analysis';

const router = express.Router();

// Schema for recipe nutrition calculation
const recipeNutritionSchema = Joi.object({
  body: Joi.object({
    ingredients: Joi.array().items(
      Joi.object({
        food_id: Joi.string().optional(),
        type: Joi.string().valid('food', 'recipe', 'custom', 'restaurant').required(),
        name: Joi.string().required(),
        amount: Joi.number().positive().required(),
        unit: Joi.string().required(),
        notes: Joi.string().optional()
      })
    ).required(),
    servings: Joi.number().positive().default(1)
  })
});

// Register schema
registerSchema('POST:/api/nutrition/recipe-analysis/calculate', recipeNutritionSchema);

// POST /api/nutrition/recipe-analysis/calculate - Calculate nutrition for a recipe
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const { ingredients, servings } = req.body;
    
    // Calculate recipe nutrition
    const nutritionData = await calculateRecipeNutrition(ingredients, servings);
    
    // Calculate nutrition density score
    const densityScore = calculateNutritionDensityScore(nutritionData.nutrition_per_serving);
    
    res.json({
      ...nutritionData,
      nutrition_density_score: densityScore
    });
  } catch (error) {
    console.error('Recipe nutrition calculation error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to calculate recipe nutrition' });
  }
});

// Schema for dietary profile analysis
const dietaryProfileSchema = Joi.object({
  body: Joi.object({
    ingredients: Joi.array().items(
      Joi.object({
        food_id: Joi.string().optional(),
        type: Joi.string().valid('food', 'recipe', 'custom', 'restaurant').required(),
        name: Joi.string().required()
      })
    ).required()
  })
});

// Register schema
registerSchema('POST:/api/nutrition/recipe-analysis/dietary-profile', dietaryProfileSchema);

// POST /api/nutrition/recipe-analysis/dietary-profile - Analyze recipe for allergens and dietary restrictions
router.post('/dietary-profile', async (req: Request, res: Response) => {
  try {
    const { ingredients } = req.body;
    
    // Analyze recipe dietary profile
    const dietaryProfile = await analyzeRecipeDietaryProfile(ingredients);
    
    res.json(dietaryProfile);
  } catch (error) {
    console.error('Dietary profile analysis error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to analyze dietary profile' });
  }
});

export default router;