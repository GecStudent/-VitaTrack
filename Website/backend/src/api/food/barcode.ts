import express from 'express';
import { Request, Response } from 'express';
import { Food } from '../../database/models/Food';
import { setCache, getCache } from '../../database/cache/redisCache';

const router = express.Router();

// GET /api/foods/barcode/:code - Get food by barcode
router.get('/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    
    // Try to get from cache
    const cacheKey = `food:barcode:${code}`;
    const cachedFood = await getCache(cacheKey);
    if (cachedFood) {
      return res.json(cachedFood);
    }
    
    // Find food by barcode
    const food = await Food.findOne({ barcode: code });
    if (!food) {
      return res.status(404).json({ error: 'Food not found for this barcode' });
    }
    
    // Cache food for 24 hours
    await setCache(cacheKey, food, 86400);
    
    res.json(food);
  } catch (error) {
    console.error('Barcode lookup error:', error);
    res.status(500).json({ error: 'Failed to lookup food by barcode' });
  }
});

export default router;