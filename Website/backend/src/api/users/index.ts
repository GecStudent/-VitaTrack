import express from 'express';
import profileRouter from './profile';
import imageUploadRouter from './image-upload';
import privacyRouter from './privacy';
import dataExportRouter from './data-export';
import { authenticateJWT } from '../../auth/middleware';

const router = express.Router();

// All user routes require authentication
router.use(authenticateJWT);

// Mount the sub-routers
router.use('/profile', profileRouter);
router.use('/image', imageUploadRouter);
router.use('/privacy', privacyRouter);
router.use('/data-export', dataExportRouter);

export default router;