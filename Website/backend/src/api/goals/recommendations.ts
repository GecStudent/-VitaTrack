import express from 'express';
import { Request, Response } from 'express';
import { JwtPayload } from '../../auth/types';
import goalRepository from '../../database/repositories/GoalRepository';
import weightLogRepository from '../../database/repositories/WeightLogRepository';

const router = express.Router();

// GET /api/goals/recommendations - Get goal adjustment recommendations
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Get active goals
    const activeGoals = await goalRepository.findActiveGoals(userId);
    
    // Generate recommendations based on goal progress
    const recommendations = [];
    
    for (const goal of activeGoals) {
      if (goal.goal_type === 'weight') {
        // Get weight logs for the past month
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        
        const weightLogs = await weightLogRepository.findByDateRange(userId, startDate, endDate);
        
        // Simple recommendation logic based on weight trend
        if (weightLogs.length >= 2) {
          const oldestWeight = weightLogs[weightLogs.length - 1].weight;
          const newestWeight = weightLogs[0].weight;
          const weightDiff = newestWeight - oldestWeight;
          
          // If weight goal is to lose weight but user is gaining
          if (goal.target_value < oldestWeight && weightDiff > 0) {
            recommendations.push({
              goalId: goal.id,
              goalType: goal.goal_type,
              message: 'You seem to be gaining weight instead of losing. Consider adjusting your calorie intake or increasing exercise.',
              severity: 'high'
            });
          }
          // If weight goal is to gain weight but user is losing
          else if (goal.target_value > oldestWeight && weightDiff < 0) {
            recommendations.push({
              goalId: goal.id,
              goalType: goal.goal_type,
              message: 'You seem to be losing weight instead of gaining. Consider increasing your calorie intake.',
              severity: 'high'
            });
          }
          // If progress is too slow
          else if (Math.abs(weightDiff) < 0.5) { // Less than 0.5kg change in a month
            recommendations.push({
              goalId: goal.id,
              goalType: goal.goal_type,
              message: 'Your progress is slower than recommended. Consider adjusting your goal or changing your approach.',
              severity: 'medium'
            });
          }
        }
      }
      // Add other goal types here as needed
    }
    
    res.json({
      recommendations
    });
  } catch (error) {
    console.error('Get goal recommendations error:', error);
    res.status(500).json({ error: 'Failed to get goal recommendations' });
  }
});

export default router;