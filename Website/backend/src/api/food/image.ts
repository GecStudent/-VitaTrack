import express from 'express';
import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { imageRecognition } from '../../services/ai/image-recognition';
import { JwtPayload } from '../../auth/types';
import Joi from 'joi';
import { registerSchema } from '../../middleware/requestValidator';

const router = express.Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'meal-photos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniquePrefix = uuidv4();
    cb(null, `${uniquePrefix}-${file.originalname}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

// Validation schema for manual correction
const manualCorrectionSchema = Joi.object({
  corrections: Joi.array().items(
    Joi.object({
      originalFoodName: Joi.string().required(),
      correctedFoodName: Joi.string().required(),
      correctedPortion: Joi.object({
        grams: Joi.number().positive().required(),
        unit: Joi.string().required()
      }).optional()
    })
  ).required()
});

registerSchema('/api/foods/image/correct', manualCorrectionSchema);

// POST /api/foods/image - Identify food from image
router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const imagePath = req.file.path;
    const userId = (req.user as JwtPayload)?.sub;
    
    // Recognize food from image
    const recognitionResult = await imageRecognition.recognizeFoodFromImage(imagePath, userId);
    
    res.json({
      success: true,
      result: recognitionResult,
      message: 'Food recognition completed successfully'
    });
  } catch (error) {
    console.error('Food recognition error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process image',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/foods/image/batch - Process multiple images
router.post('/batch', upload.array('images', 5), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }
    
    const imagePaths = files.map(file => file.path);
    const userId = (req.user as JwtPayload)?.sub;
    
    // Process batch of images
    const batchResults = await imageRecognition.processBatchImages(imagePaths, userId);
    
    res.json({
      success: true,
      results: batchResults,
      message: 'Batch processing completed successfully'
    });
  } catch (error) {
    console.error('Batch processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process images',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/foods/image/correct - Apply manual corrections
router.post('/correct', async (req: Request, res: Response) => {
  try {
    const { originalResult, corrections } = req.body;
    const userId = (req.user as JwtPayload)?.sub;
    
    if (!originalResult || !corrections || !Array.isArray(corrections)) {
      return res.status(400).json({ error: 'Invalid correction data' });
    }
    
    // Apply manual corrections
    const correctedResult = await imageRecognition.applyManualCorrection(
      originalResult,
      corrections,
      userId
    );
    
    res.json({
      success: true,
      result: correctedResult,
      message: 'Corrections applied successfully'
    });
  } catch (error) {
    console.error('Correction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to apply corrections',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;