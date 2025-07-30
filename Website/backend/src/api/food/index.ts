import express from 'express';
import searchRouter from './search';
import barcodeRouter from './barcode';
import customFoodsRouter from './custom-foods';
import recipesRouter from './recipes';
import nutritionCalcRouter from './nutrition-calc';
import imageRouter from './image'; // Add this line
import { authenticateJWT } from '../../auth/middleware';

const router = express.Router();

// Public routes (no authentication required)
router.use('/search', searchRouter);
router.use('/barcode', barcodeRouter);

// Protected routes (authentication required)
router.use('/custom', authenticateJWT, customFoodsRouter);
router.use('/recipes', authenticateJWT, recipesRouter);
router.use('/nutrition-calc', authenticateJWT, nutritionCalcRouter);
router.use('/image', authenticateJWT, imageRouter); // Add this line

export default router;