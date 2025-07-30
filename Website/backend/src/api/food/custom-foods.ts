import express from 'express';
import { Request, Response } from 'express';
import Joi from 'joi';
import { UserCustomFood } from '../../database/models/UserCustomFood';
import { registerSchema } from '../../middleware/requestValidator';
import { JwtPayload } from '../../auth/types';
import { AuditLogger } from '../../utils/auditLogger';

const router = express.Router();

// Schema for custom food creation
const customFoodSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).optional(),
    serving_sizes: Joi.array().items(
      Joi.object({
        size: Joi.number().positive().required(),
        unit: Joi.string().required(),
        weight_g: Joi.number().positive().required(),
      })
    ).min(1).required(),
    nutrition_per_100g: Joi.object({
      calories: Joi.number().min(0).required(),
      protein_g: Joi.number().min(0).required(),
      carbs_g: Joi.number().min(0).required(),
      fat_g: Joi.number().min(0).required(),
      fiber_g: Joi.number().min(0).optional(),
      sugar_g: Joi.number().min(0).optional(),
      sodium_mg: Joi.number().min(0).optional(),
    }).required(),
    is_recipe: Joi.boolean().default(false),
    recipe_id: Joi.string().optional(),
  }),
});

// Register schema for POST /api/foods/custom
registerSchema('POST:/api/food/custom', customFoodSchema);

// GET /api/foods/custom - Get user's custom foods
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    const customFoods = await UserCustomFood.find({ user_id: userId })
      .sort({ created_at: -1 });
    
    res.json(customFoods);
  } catch (error) {
    console.error('Get custom foods error:', error);
    res.status(500).json({ error: 'Failed to get custom foods' });
  }
});

// POST /api/foods/custom - Create custom food
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    const customFoodData = {
      ...req.body,
      user_id: userId,
    };
    
    const customFood = await UserCustomFood.create(customFoodData);
    
    // Log the creation of custom food
    AuditLogger.log('custom_food_created', {
      userId: userId,
      foodId: customFood._id,
      foodName: customFood.name,
    });
    
    res.status(201).json(customFood);
  } catch (error) {
    console.error('Create custom food error:', error);
    res.status(500).json({ error: 'Failed to create custom food' });
  }
});

// GET /api/foods/custom/:id - Get custom food details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    const customFood = await UserCustomFood.findOne({ _id: id, user_id: userId });
    if (!customFood) {
      return res.status(404).json({ error: 'Custom food not found' });
    }
    
    res.json(customFood);
  } catch (error) {
    console.error('Get custom food error:', error);
    res.status(500).json({ error: 'Failed to get custom food details' });
  }
});

// PUT /api/foods/custom/:id - Update custom food
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    const customFood = await UserCustomFood.findOne({ _id: id, user_id: userId });
    if (!customFood) {
      return res.status(404).json({ error: 'Custom food not found' });
    }
    
    // Update fields
    const updatedFood = await UserCustomFood.findByIdAndUpdate(
      id,
      { ...req.body, user_id: userId },
      { new: true, runValidators: true }
    );
    
    // Log the update of custom food
    AuditLogger.log('custom_food_updated', {
      userId: userId,
      foodId: id,
      foodName: updatedFood?.name,
    });
    
    res.json(updatedFood);
  } catch (error) {
    console.error('Update custom food error:', error);
    res.status(500).json({ error: 'Failed to update custom food' });
  }
});

// DELETE /api/foods/custom/:id - Delete custom food
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    const customFood = await UserCustomFood.findOne({ _id: id, user_id: userId });
    if (!customFood) {
      return res.status(404).json({ error: 'Custom food not found' });
    }
    
    await UserCustomFood.findByIdAndDelete(id);
    
    // Log the deletion of custom food
    AuditLogger.log('custom_food_deleted', {
      userId: userId,
      foodId: id,
      foodName: customFood.name,
    });
    
    res.json({ message: 'Custom food deleted successfully' });
  } catch (error) {
    console.error('Delete custom food error:', error);
    res.status(500).json({ error: 'Failed to delete custom food' });
  }
});

export default router;