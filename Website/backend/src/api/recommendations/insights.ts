import express from 'express';
import { Request, Response } from 'express';
import Joi from 'joi';
import { JwtPayload } from '../../auth/types';
import { registerSchema } from '../../middleware/requestValidator';
import { generateHealthInsights } from '../../services/health-insights/insights-generator';

const router = express.Router();

// Validation schema for insights request
const insightsRequestSchema = Joi.object({
  timeframe: Joi.string().valid('week', 'month', 'quarter').default('month'),
});

registerSchema('/api/recommendations/insights', insightsRequestSchema);

// GET /api/recommendations/insights - Get health insights
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    const { timeframe } = req.query as { timeframe?: 'week' | 'month' | 'quarter' };
    
    // Generate health insights
    const insights = await generateHealthInsights(userId, timeframe || 'month');
    
    res.json({
      insights,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get health insights error:', error);
    res.status(500).json({ error: 'Failed to generate health insights' });
  }
});

export default router;