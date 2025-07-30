import express from 'express';
import { Request, Response } from 'express';
import Joi from 'joi';
import { JwtPayload } from '../../auth/types';
import { registerSchema } from '../../middleware/requestValidator';
import goalRepository from '../../database/repositories/GoalRepository';
import { AuditLogger } from '../../utils/auditLogger';

const router = express.Router();

// Schema for goal creation
const goalSchema = Joi.object({
  body: Joi.object({
    goal_type: Joi.string().valid('weight', 'calories', 'protein', 'carbs', 'fat', 'water', 'steps', 'exercise').required(),
    target_value: Joi.number().positive().required(),
    start_date: Joi.date().iso().required(),
    target_date: Joi.date().iso().min(Joi.ref('start_date')).optional(),
  }),
});

// Register schema for POST /api/goals
registerSchema('POST:/api/goals', goalSchema);

// GET /api/goals - Get user's goals
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Parse query parameters
    const { status, type } = req.query;
    
    let goals;
    
    if (status === 'active') {
      goals = await goalRepository.findActiveGoals(userId, type as string | undefined);
    } else {
      goals = await goalRepository.findByUserId(userId);
    }
    
    res.json(goals);
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Failed to get goals' });
  }
});

// POST /api/goals - Create a goal
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const { goal_type, target_value, start_date, target_date } = req.body;
    
    // Create goal
    const goal = await goalRepository.create({
      user_id: userId,
      goal_type,
      target_value,
      start_date: new Date(start_date),
      target_date: target_date ? new Date(target_date) : null,
      status: 'active'
    });
    
    // Log the creation of goal
    AuditLogger.log('goal_created', {
      userId,
      goalId: goal.id,
      goalType: goal_type,
    });
    
    res.status(201).json(goal);
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// GET /api/goals/:id - Get goal details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    const goal = await goalRepository.findOne({
      where: { id, user_id: userId },
    });
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    res.json(goal);
  } catch (error) {
    console.error('Get goal details error:', error);
    res.status(500).json({ error: 'Failed to get goal details' });
  }
});

// PUT /api/goals/:id - Update goal
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const { target_value, target_date, status } = req.body;
    
    // Check if the goal exists and belongs to the user
    const existingGoal = await goalRepository.findOne({
      where: { id, user_id: userId },
    });
    
    if (!existingGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    // Update the goal
    const updatedGoal = await goalRepository.updateGoal(id, {
      target_value,
      target_date: target_date ? new Date(target_date) : undefined,
      status,
    });
    
    // Log the update of goal
    AuditLogger.log('goal_updated', {
      userId,
      goalId: id,
    });
    
    res.json(updatedGoal);
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// DELETE /api/goals/:id - Delete goal
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Check if the goal exists and belongs to the user
    const existingGoal = await goalRepository.findOne({
      where: { id, user_id: userId },
    });
    
    if (!existingGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    // Delete the goal
    await goalRepository.delete(id);
    
    // Log the deletion of goal
    AuditLogger.log('goal_deleted', {
      userId,
      goalId: id,
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

export default router;