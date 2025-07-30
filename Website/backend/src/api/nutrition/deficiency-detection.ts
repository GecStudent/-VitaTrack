import express from 'express';
import { Request, Response } from 'express';
import Joi from 'joi';
import { JwtPayload } from '../../auth/types';
import { registerSchema } from '../../middleware/requestValidator';
import { 
  detectNutrientDeficiencies,
  generateNutritionRecommendations
} from '../../services/nutrition/deficiency-detection';

const router = express.Router();

// Schema for deficiency detection
const deficiencyDetectionSchema = Joi.object({
  body: Joi.object({
    start_date: Joi.date().required(),
    end_date: Joi.date().min(Joi.ref('start_date')).required()
  })
});

// Register schema
registerSchema('POST:/api/nutrition/deficiency-detection/analyze', deficiencyDetectionSchema);

// POST /api/nutrition/deficiency-detection/analyze - Detect nutrient deficiencies
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const { start_date, end_date } = req.body;
    
    // Convert string dates to Date objects if needed
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    // Detect nutrient deficiencies
    const deficiencyAnalysis = await detectNutrientDeficiencies(userId, startDate, endDate);
    
    res.json(deficiencyAnalysis);
  } catch (error) {
    console.error('Nutrient deficiency detection error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to detect nutrient deficiencies' });
  }
});

// Schema for nutrition recommendations
const recommendationsSchema = Joi.object({
  body: Joi.object({
    deficiencies: Joi.array().items(
      Joi.object({
        nutrient: Joi.string().required(),
        severity: Joi.string().valid('mild', 'moderate', 'severe').required()
      })
    ).required(),
    dietary_preferences: Joi.array().items(Joi.string()).optional()
  })
});

// Register schema
registerSchema('POST:/api/nutrition/deficiency-detection/recommendations', recommendationsSchema);

// POST /api/nutrition/deficiency-detection/recommendations - Generate nutrition recommendations
router.post('/recommendations', async (req: Request, res: Response) => {
  try {
    const { deficiencies, dietary_preferences = [] } = req.body;
    
    // Generate nutrition recommendations
    const recommendations = generateNutritionRecommendations(deficiencies, dietary_preferences);
    
    res.json({ recommendations });
  } catch (error) {
    console.error('Nutrition recommendations error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate nutrition recommendations' });
  }
});

export default router;