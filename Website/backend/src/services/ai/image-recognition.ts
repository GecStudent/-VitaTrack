import axios from 'axios';
import { Food } from '../../database/models/Food';
import { getCache, setCache } from '../../database/cache/redisCache';
import { cvIntegration } from './cv-integration';
import { portionEstimation } from './portion-estimation';
import { feedbackLearning } from './feedback-learning';
import path from 'path';
import fs from 'fs';

interface RecognitionResult {
  foodItems: Array<{
    id: string;
    name: string;
    confidence: number;
    portion: {
      estimatedGrams: number;
      estimatedUnit: string;
      confidence: number;
    };
    nutrition: Record<string, number>;
  }>;
  imageAnalysis: {
    processedImageUrl?: string;
    detectedObjects: Array<{
      boundingBox: { x: number; y: number; width: number; height: number };
      label: string;
      confidence: number;
    }>;
  };
  metadata: {
    processingTimeMs: number;
    modelVersion: string;
    serviceProvider: string;
  };
}

class ImageRecognition {
  private readonly CACHE_TTL = 3600; // 1 hour cache
  private readonly CONFIDENCE_THRESHOLD = 0.65;
  private readonly MAX_RESULTS = 5;
  
  /**
   * Recognize food items from an image
   */
  async recognizeFoodFromImage(imagePath: string, userId?: string): Promise<RecognitionResult> {
    // Create cache key based on image hash
    const imageBuffer = fs.readFileSync(imagePath);
    const imageHash = require('crypto').createHash('md5').update(imageBuffer).digest('hex');
    const cacheKey = `food-recognition:${imageHash}`;
    
    // Try to get from cache
    const cachedResult = await getCache(cacheKey);
    if (cachedResult && typeof cachedResult === 'object' && 'foodItems' in cachedResult && 'imageAnalysis' in cachedResult && 'metadata' in cachedResult) {
      return cachedResult as RecognitionResult;
    }
    return {
      foodItems: [],
      imageAnalysis: { processedImageUrl: '', detectedObjects: [] },
      metadata: { processingTimeMs: 0, modelVersion: '', serviceProvider: '' }
    };
    
    const startTime = Date.now();
    
    // Preprocess image
    const preprocessedImagePath = await this.preprocessImage(imagePath);
    
    // Detect food items using computer vision service
    const detectionResults = await cvIntegration.detectFoodItems(preprocessedImagePath);
    
    // Filter results by confidence threshold
    const validDetections = detectionResults.detections.filter(
      detection => detection.confidence >= this.CONFIDENCE_THRESHOLD
    ).slice(0, this.MAX_RESULTS);
    
    // Get food details and estimate portions
    const foodItems = await Promise.all(
      validDetections.map(async detection => {
        // Find food in database
        const food = await Food.findOne({ where: { name: { $regex: detection.label, $options: 'i' } } });
        
        // Estimate portion size
        const portionInfo = await portionEstimation.estimatePortionSize(
          preprocessedImagePath,
          detection.boundingBox,
          detection.label
        );
        
        return {
          id: food?.id || '',
          name: detection.label,
          confidence: detection.confidence,
          portion: {
            estimatedGrams: portionInfo.estimatedGrams,
            estimatedUnit: portionInfo.estimatedUnit,
            confidence: portionInfo.confidence
          },
          nutrition: food?.nutrition_per_100g || {}
        };
      })
    );
    
    const result: RecognitionResult = {
      foodItems,
      imageAnalysis: {
        processedImageUrl: `/uploads/meal-photos/processed/${path.basename(preprocessedImagePath)}`,
        detectedObjects: validDetections.map(d => ({
          boundingBox: d.boundingBox,
          label: d.label,
          confidence: d.confidence
        }))
      },
      metadata: {
        processingTimeMs: Date.now() - startTime,
        modelVersion: cvIntegration.getModelVersion(),
        serviceProvider: cvIntegration.getServiceProvider()
      }
    };
    
    // Cache result
    await setCache(cacheKey, result, this.CACHE_TTL);
    
    // If user ID provided, log this recognition for feedback learning
    if (userId) {
      await feedbackLearning.logRecognitionEvent(String(userId), result);
    }
    
    return result;
  }
  
  /**
   * Preprocess image for better recognition
   */
  private async preprocessImage(imagePath: string): Promise<string> {
    // Create processed directory if it doesn't exist
    const processedDir = path.join(process.cwd(), 'uploads', 'meal-photos', 'processed');
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
    }
    
    // Generate output path
    const filename = path.basename(imagePath);
    const outputPath = path.join(processedDir, `processed_${filename}`);
    
    // Use sharp for image preprocessing
    const sharp = require('sharp');
    await sharp(imagePath)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .normalize() // Enhance contrast
      .sharpen() // Improve details
      .toFile(outputPath);
    
    return outputPath;
  }
  
  /**
   * Process batch of images
   */
  async processBatchImages(imagePaths: string[], userId?: string): Promise<Record<string, RecognitionResult>> {
    const results: Record<string, RecognitionResult> = {};
    
    // Process images in parallel with concurrency limit
    const concurrencyLimit = 3;
    const chunks = [];
    
    for (let i = 0; i < imagePaths.length; i += concurrencyLimit) {
      chunks.push(imagePaths.slice(i, i + concurrencyLimit));
    }
    
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(async imagePath => {
          const result = await this.recognizeFoodFromImage(imagePath, userId);
          return { imagePath, result };
        })
      );
      
      chunkResults.forEach(({ imagePath, result }) => {
        results[imagePath] = result;
      });
    }
    
    return results;
  }
  
  /**
   * Apply manual correction to recognition result
   */
  async applyManualCorrection(
    originalResult: RecognitionResult,
    corrections: Array<{
      originalFoodName: string;
      correctedFoodName: string;
      correctedPortion?: { grams: number; unit: string };
    }>,
    userId: string
  ): Promise<RecognitionResult> {
    // Apply corrections
    const correctedResult = { ...originalResult };
    
    for (const correction of corrections) {
      const foodItemIndex = correctedResult.foodItems.findIndex(
        item => item.name === correction.originalFoodName
      );
      
      if (foodItemIndex >= 0) {
        // Find corrected food in database
        const correctedFood = await Food.findOne({
          where: { name: { $regex: correction.correctedFoodName, $options: 'i' } }
        });
        
        if (correctedFood) {
          correctedResult.foodItems[foodItemIndex] = {
            ...correctedResult.foodItems[foodItemIndex],
            id: correctedFood.id,
            name: correction.correctedFoodName,
            nutrition: correctedFood.nutrition_per_100g as unknown as Record<string, number>
          };
          
          // Update portion if provided
          if (correction.correctedPortion) {
            correctedResult.foodItems[foodItemIndex].portion = {
              estimatedGrams: correction.correctedPortion.grams,
              estimatedUnit: correction.correctedPortion.unit,
              confidence: 1.0 // Manual correction has 100% confidence
            };
          }
        }
      }
    }
    
    // Log corrections for feedback learning
    await feedbackLearning.logCorrectionEvent(userId, originalResult, correctedResult, corrections);
    
    return correctedResult;
  }
}

export const imageRecognition = new ImageRecognition();