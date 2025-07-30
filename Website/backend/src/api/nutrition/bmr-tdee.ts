import express from 'express';
import { Request, Response } from 'express';
import Joi from 'joi';
import { JwtPayload } from '../../auth/types';
import { registerSchema } from '../../middleware/requestValidator';
import { 
  calculateBmr, 
  calculateTdee, 
  calculateMacros, 
  calculateUserBmrAndTdee,
  updateUserNutritionTargets,
  calculateWeightChangePrediction,
  BmrFormula 
} from '../../services/nutrition/bmr-tdee';

const router = express.Router();

// Schema for calculating BMR/TDEE
const bmrTdeeSchema = Joi.object({
  body: Joi.object({
    formula: Joi.string().valid('mifflin_st_jeor', 'harris_benedict', 'katch_mcardle').default('mifflin_st_jeor'),
    gender: Joi.string().valid('male', 'female').optional(),
    weight_kg: Joi.number().positive().optional(),
    height_cm: Joi.number().positive().optional(),
    age_years: Joi.number().positive().integer().optional(),
    body_fat_percentage: Joi.number().min(1).max(60).optional(),
    activity_level: Joi.string().valid(
      'sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'
    ).optional(),
    update_targets: Joi.boolean().default(false)
  })
});

// Register schema
registerSchema('POST:/api/nutrition/bmr-tdee/calculate', bmrTdeeSchema);

// POST /api/nutrition/bmr-tdee/calculate - Calculate BMR and TDEE
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const { formula, update_targets } = req.body;
    
    // Calculate BMR and TDEE using user data
    const result = await calculateUserBmrAndTdee(userId, formula as BmrFormula);
    
    // Update user's nutrition targets if requested
    if (update_targets) {
      await updateUserNutritionTargets(userId, result.tdee, result.macros);
    }
    
    res.json(result);
  } catch (error) {
    console.error('BMR/TDEE calculation error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to calculate BMR/TDEE' });
  }
});

// Schema for manual BMR/TDEE calculation
const manualBmrTdeeSchema = Joi.object({
  body: Joi.object({
    formula: Joi.string().valid('mifflin_st_jeor', 'harris_benedict', 'katch_mcardle').default('mifflin_st_jeor'),
    gender: Joi.string().valid('male', 'female').required(),
    weight_kg: Joi.number().positive().required(),
    height_cm: Joi.number().positive().required(),
    age_years: Joi.number().positive().integer().required(),
    body_fat_percentage: Joi.number().min(1).max(60).when('formula', {
      is: 'katch_mcardle',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    activity_level: Joi.string().valid(
      'sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'
    ).required(),
    protein_ratio: Joi.number().min(0.1).max(0.6).default(0.3),
    carbs_ratio: Joi.number().min(0.1).max(0.7).default(0.4),
    fat_ratio: Joi.number().min(0.1).max(0.6).default(0.3)
  })
});

// Register schema
registerSchema('POST:/api/nutrition/bmr-tdee/manual-calculate', manualBmrTdeeSchema);

// POST /api/nutrition/bmr-tdee/manual-calculate - Calculate BMR and TDEE with manual inputs
router.post('/manual-calculate', async (req: Request, res: Response) => {
  try {
    const {
      formula,
      gender,
      weight_kg,
      height_cm,
      age_years,
      body_fat_percentage,
      activity_level,
      protein_ratio,
      carbs_ratio,
      fat_ratio
    } = req.body;
    
    // Calculate BMR based on formula
    let bmr;
    if (formula === 'katch_mcardle') {
      if (body_fat_percentage === undefined) {
        return res.status(400).json({ error: 'Body fat percentage is required for Katch-McArdle formula' });
      }
      bmr = calculateBmr(BmrFormula.KATCH_MCARDLE, gender, weight_kg, height_cm, age_years, body_fat_percentage);
    } else if (formula === 'harris_benedict') {
      bmr = calculateBmr(BmrFormula.HARRIS_BENEDICT, gender, weight_kg, height_cm, age_years);
    } else {
      bmr = calculateBmr(BmrFormula.MIFFLIN_ST_JEOR, gender, weight_kg, height_cm, age_years);
    }
    
    // Calculate TDEE
    const tdee = calculateTdee(bmr, activity_level);
    
    // Calculate macros
    const macros = calculateMacros(tdee, protein_ratio, carbs_ratio, fat_ratio);
    
    res.json({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      macros
    });
  } catch (error) {
    console.error('Manual BMR/TDEE calculation error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to calculate BMR/TDEE' });
  }
});

// Schema for weight change prediction
const weightChangePredictionSchema = Joi.object({
  body: Joi.object({
    calorie_deficit_per_day: Joi.number().required(),
    duration_days: Joi.number().integer().positive().required()
  })
});

// Register schema
registerSchema('POST:/api/nutrition/bmr-tdee/weight-change-prediction', weightChangePredictionSchema);

// POST /api/nutrition/bmr-tdee/weight-change-prediction - Predict weight change based on calorie deficit/surplus
router.post('/weight-change-prediction', async (req: Request, res: Response) => {
  try {
    const { calorie_deficit_per_day, duration_days } = req.body;
    
    const prediction = calculateWeightChangePrediction(calorie_deficit_per_day, duration_days);
    
    res.json(prediction);
  } catch (error) {
    console.error('Weight change prediction error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to predict weight change' });
  }
});

// Schema for updating nutrition targets
const updateTargetsSchema = Joi.object({
  body: Joi.object({
    calories: Joi.number().positive().required(),
    protein_g: Joi.number().positive().required(),
    carbs_g: Joi.number().positive().required(),
    fat_g: Joi.number().positive().required(),
    fiber_g: Joi.number().positive().optional()
  })
});

// Register schema
registerSchema('POST:/api/nutrition/bmr-tdee/update-targets', updateTargetsSchema);

// POST /api/nutrition/bmr-tdee/update-targets - Manually update nutrition targets
router.post('/update-targets', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const { calories, protein_g, carbs_g, fat_g, fiber_g = 30 } = req.body;
    
    await updateUserNutritionTargets(
      userId, 
      calories, 
      { protein_g, carbs_g, fat_g },
      fiber_g
    );
    
    res.json({ success: true, message: 'Nutrition targets updated successfully' });
  } catch (error) {
    console.error('Update nutrition targets error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update nutrition targets' });
  }
});

export default router;