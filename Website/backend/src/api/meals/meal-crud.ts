import express from 'express';
import { Request, Response } from 'express';
import Joi from 'joi';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { JwtPayload } from '../../auth/types';
import { registerSchema } from '../../middleware/requestValidator';
import MealLogRepository from '../../database/repositories/MealLogRepository';
import MealItemRepository from '../../database/repositories/MealItemRepository';
import { AuditLogger } from '../../utils/auditLogger';
import { withTransaction } from '../../database/connection';

// Simple rate limiting for file uploads
const uploadRateLimit = new Map<string, { count: number; resetTime: number }>();
const UPLOAD_RATE_LIMIT = 5; // 5 uploads per minute
const UPLOAD_RATE_WINDOW = 60 * 1000; // 1 minute in milliseconds

const router = express.Router();

// Ensure upload directory exists for meal photos
const uploadDir = path.join(__dirname, '../../../uploads/meal-photos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage for meal photos
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const userId = req.user!.sub;
    const fileExt = path.extname(file.originalname);
    const fileName = `meal-${userId}-${uuidv4()}${fileExt}`;
    cb(null, fileName);
  }
});

// File filter to only allow image files
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

// Configure multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  }
});

// Schema for meal log creation
const mealLogSchema = Joi.object({
  body: Joi.object({
    mealType: Joi.string().valid('breakfast', 'lunch', 'dinner', 'snack').required(),
    logDate: Joi.date().iso().required(),
    notes: Joi.string().max(500).optional(),
    items: Joi.array().items(
      Joi.object({
        foodId: Joi.string().required(),
        servingSize: Joi.number().positive().required(),
        servingUnit: Joi.string().required(),
      })
    ).min(1).required(),
    isFavorite: Joi.boolean().default(false),
    templateName: Joi.string().max(100).optional(),
  }),
});

// Register schema for POST /api/meals
registerSchema('POST:/api/meals', mealLogSchema);

// GET /api/meals - Get user's meal logs
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Parse query parameters
    const { startDate, endDate, date, mealType } = req.query;
    
    let mealLogs;
    
    if (startDate && endDate) {
      // Get meals within date range
      mealLogs = await MealLogRepository.findByDateRange(
        userId, 
        new Date(startDate as string), 
        new Date(endDate as string)
      );
    } else if (date) {
      // Get meals for a specific date
      mealLogs = await MealLogRepository.findByDate(userId, new Date(date as string));
    } else if (mealType) {
      // Get meals by meal type
      mealLogs = await MealLogRepository.findByMealType(userId, mealType as string);
    } else {
      // Get all meals (default to last 7 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      mealLogs = await MealLogRepository.findByDateRange(userId, startDate, endDate);
    }
    
    res.json(mealLogs);
  } catch (error) {
    console.error('Get meal logs error:', error);
    res.status(500).json({ error: 'Failed to get meal logs' });
  }
});

// POST /api/meals - Log a meal
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const { mealType, logDate, notes, items, isFavorite, templateName } = req.body;
    
    // Use transaction to ensure all operations succeed or fail together
    const result = await withTransaction(async () => {
      // Create meal log
      const mealLog = await MealLogRepository.create({
        userId,
        mealType,
        logDate: new Date(logDate),
        notes
      });
      
          // Create meal items
    const mealItems = [];
    for (const item of items) {
      // Validate item structure
      if (!item.foodId || typeof item.foodId !== 'string' ||
          !item.servingSize || typeof item.servingSize !== 'number' ||
          !item.servingUnit || typeof item.servingUnit !== 'string') {
        throw new Error('Invalid meal item structure');
      }
      
      const mealItem = await MealItemRepository.create({
        mealLogId: mealLog.id,
        foodId: item.foodId,
        servingSize: item.servingSize,
        servingUnit: item.servingUnit
      });
      mealItems.push(mealItem);
    }
      
      // If this is a favorite or template, handle that in meal-templates.ts
      if (isFavorite || templateName) {
        // This will be handled in the meal-templates.ts file
        // We'll just include the flag in the response
      }
      
      return { mealLog, mealItems };
    });
    
    // Log the creation of meal log
    AuditLogger.log('meal_log_created', {
      userId,
      mealLogId: result.mealLog.id,
      mealType,
      itemCount: items.length,
    });
    
    res.status(201).json({
      ...result,
      isFavorite: isFavorite || false,
      isTemplate: !!templateName,
      templateName
    });
  } catch (error) {
    console.error('Create meal log error:', error);
    res.status(500).json({ error: 'Failed to create meal log' });
  }
});

// GET /api/meals/:id - Get meal details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    const mealLog = await MealLogRepository.findOne({
      where: { id, userId },
      relations: ['mealItems']
    });
    
    if (!mealLog) {
      return res.status(404).json({ error: 'Meal log not found' });
    }
    
    res.json(mealLog);
  } catch (error) {
    console.error('Get meal details error:', error);
    res.status(500).json({ error: 'Failed to get meal details' });
  }
});

// PUT /api/meals/:id - Update meal
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const { mealType, logDate, notes, items } = req.body;
    
    // Check if meal log exists and belongs to user
    const mealLog = await MealLogRepository.findOne({
      where: { id, userId }
    });
    
    if (!mealLog) {
      return res.status(404).json({ error: 'Meal log not found' });
    }
    
    // Use transaction to ensure all operations succeed or fail together
    const result = await withTransaction(async () => {
      // Update meal log
      const updatedMealLog = await MealLogRepository.update(id, {
        mealType,
        logDate: new Date(logDate),
        notes
      });
      
      // Delete existing meal items
      await MealItemRepository.deleteByMealLogId(id);
      
      // Create new meal items
      const mealItems = [];
      for (const item of items) {
        // Validate item structure
        if (!item.foodId || typeof item.foodId !== 'string' ||
            !item.servingSize || typeof item.servingSize !== 'number' ||
            !item.servingUnit || typeof item.servingUnit !== 'string') {
          throw new Error('Invalid meal item structure');
        }
        
        const mealItem = await MealItemRepository.create({
          mealLogId: id,
          foodId: item.foodId,
          servingSize: item.servingSize,
          servingUnit: item.servingUnit
        });
        mealItems.push(mealItem);
      }
      
      return { mealLog: updatedMealLog, mealItems };
    });
    
    // Log the update of meal log
    AuditLogger.log('meal_log_updated', {
      userId,
      mealLogId: id,
      mealType,
      itemCount: items.length,
    });
    
    res.json(result);
  } catch (error) {
    console.error('Update meal log error:', error);
    res.status(500).json({ error: 'Failed to update meal log' });
  }
});

// DELETE /api/meals/:id - Delete meal
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    const deleted = await MealLogRepository.deleteMealLog(id, userId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Meal log not found or not authorized to delete' });
    }
    
    // Log the deletion of meal log
    AuditLogger.log('meal_log_deleted', {
      userId,
      mealLogId: id,
    });
    
    res.json({ message: 'Meal log deleted successfully' });
  } catch (error) {
    console.error('Delete meal log error:', error);
    res.status(500).json({ error: 'Failed to delete meal log' });
  }
});

// POST /api/meals/:id/photo - Upload meal photo
router.post('/:id/photo', upload.single('image'), async (req: Request, res: Response) => {
  try {
    // Rate limiting check
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const now = Date.now();
    
    const userRateLimit = uploadRateLimit.get(userId);
    if (userRateLimit && now < userRateLimit.resetTime) {
      if (userRateLimit.count >= UPLOAD_RATE_LIMIT) {
        return res.status(429).json({ 
          error: 'Upload rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((userRateLimit.resetTime - now) / 1000)
        });
      }
      userRateLimit.count++;
    } else {
      uploadRateLimit.set(userId, { count: 1, resetTime: now + UPLOAD_RATE_WINDOW });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const { id } = req.params;
    
    // Check if meal log exists and belongs to user
    const mealLog = await MealLogRepository.findOne({
      where: { id, userId }
    });
    
    if (!mealLog) {
      // Clean up uploaded file - validate path first
      const filePath = path.resolve(req.file.path);
      if (filePath.startsWith(path.resolve(uploadDir))) {
        try {
          await fs.promises.unlink(filePath);
        } catch {
          // Ignore errors when cleaning up
        }
      }
      return res.status(404).json({ error: 'Meal log not found' });
    }
    
    const file = req.file;
    
    // Process the image with sharp
    const processedImagePath = path.join(uploadDir, `processed-${file.filename}`);
    
    try {
      // Resize and optimize the image
      await sharp(file.path)
        .resize(800, 800, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ 
          quality: 80,
          chromaSubsampling: '4:4:4'
        })
        .toFile(processedImagePath);

      // Remove the original file after successful processing
      const originalFilePath = path.resolve(file.path);
      if (originalFilePath.startsWith(path.resolve(uploadDir))) {
        await fs.promises.unlink(originalFilePath);
      }
    } catch {
      // Clean up original file on processing error
      const originalFilePath = path.resolve(file.path);
      if (originalFilePath.startsWith(path.resolve(uploadDir))) {
        try {
          await fs.promises.unlink(originalFilePath);
        } catch {
          // Ignore cleanup errors
        }
      }
      throw new Error('Failed to process image');
    }
    
    const photoUrl = `/uploads/meal-photos/processed-${file.filename}`;
    
    // Update meal log with photo URL
    await MealLogRepository.update(id, {
      photoUrl
    });
    
    // Log the meal photo upload
    AuditLogger.log('meal_photo_uploaded', {
      userId,
      mealLogId: id,
      fileInfo: {
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        storedAs: `processed-${file.filename}`
      }
    });
    
    res.json({
      success: true,
      message: 'Meal photo uploaded successfully',
      data: { photoUrl }
    });
  } catch {
    console.error('Upload meal photo error');
    res.status(500).json({ error: 'Failed to upload meal photo' });
  }
});

// DELETE /api/meals/:id/photo - Delete meal photo
router.delete('/:id/photo', async (req: Request, res: Response) => {
  try {
    // Rate limiting check
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const now = Date.now();
    
    const userRateLimit = uploadRateLimit.get(userId);
    if (userRateLimit && now < userRateLimit.resetTime) {
      if (userRateLimit.count >= UPLOAD_RATE_LIMIT) {
        return res.status(429).json({ 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((userRateLimit.resetTime - now) / 1000)
        });
      }
      userRateLimit.count++;
    } else {
      uploadRateLimit.set(userId, { count: 1, resetTime: now + UPLOAD_RATE_WINDOW });
    }
    
    const { id } = req.params;
    
    // Check if meal log exists and belongs to user
    const mealLog = await MealLogRepository.findOne({
      where: { id, userId }
    });
    
    if (!mealLog) {
      return res.status(404).json({ error: 'Meal log not found' });
    }
    
    if (!mealLog.photoUrl) {
      return res.status(400).json({ error: 'No photo to delete' });
    }
    
    const filename = path.basename(mealLog.photoUrl);
    const filePath = path.join(uploadDir, filename);
    
    // Validate file path
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(path.resolve(uploadDir))) {
      return res.status(400).json({ error: 'Invalid file path' });
    }
    
    try {
      await fs.promises.access(resolvedPath);
      await fs.promises.unlink(resolvedPath);
    } catch {
      // File doesn't exist or can't be accessed, continue with update
    }
    
    // Update meal log to remove photo URL
    await MealLogRepository.update(id, {
      photoUrl: undefined
    });
    
    // Log the meal photo deletion
    AuditLogger.log('meal_photo_deleted', {
      userId,
      mealLogId: id,
    });
    
    res.json({
      success: true,
      message: 'Meal photo deleted successfully'
    });
  } catch (error) {
    console.error('Delete meal photo error:', error);
    res.status(500).json({ error: 'Failed to delete meal photo' });
  }
});

// POST /api/meals/:id/share - Share meal with other users
router.post('/:id/share', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const { shareWith, message } = req.body;
    
    // Check if meal log exists and belongs to user
    const mealLog = await MealLogRepository.findOne({
      where: { id, userId },
      relations: ['mealItems']
    });
    
    if (!mealLog) {
      return res.status(404).json({ error: 'Meal log not found' });
    }
    
    // In a real implementation, you would:
    // 1. Validate that shareWith users exist
    // 2. Create sharing records in the database
    // 3. Send notifications to users
    
    // For now, we'll just log the sharing action
    AuditLogger.log('meal_log_shared', {
      userId,
      mealLogId: id,
      sharedWith: shareWith,
      message
    });
    
    res.json({
      success: true,
      message: 'Meal shared successfully',
      sharedWith: shareWith
    });
  } catch (error) {
    console.error('Share meal error:', error);
    res.status(500).json({ error: 'Failed to share meal' });
  }
});

// POST /api/meals/quick-add - Quick add a meal from favorites or templates
router.post('/quick-add', async (req: Request, res: Response) => {
  try {
    // const user = req.user as JwtPayload;
    // const userId = user.sub;
    // const { sourceId, logDate, adjustments } = req.body;
    
    // In a real implementation, you would:
    // 1. Fetch the source meal (favorite or template)
    // 2. Create a new meal log based on it
    // 3. Apply any adjustments to quantities
    
    // This will be implemented in conjunction with meal-templates.ts
    // For now, return a placeholder response
    
    res.status(501).json({ 
      message: 'Quick add functionality will be implemented with meal templates' 
    });
  } catch {
    console.error('Quick add meal error');
    res.status(500).json({ error: 'Failed to quick add meal' });
  }
});

export default router;