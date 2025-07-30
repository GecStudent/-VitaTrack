import express from 'express';
import { Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import UserRepository from '../../database/repositories/UserRepository';
import { AuditLogger } from '../../utils/auditLogger';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../../uploads/profile-pictures');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Helper function to validate and sanitize file paths
function validateFilePath(filePath: string, baseDir: string): string | null {
  try {
    // Resolve the absolute path
    const resolvedPath = path.resolve(filePath);
    const resolvedBaseDir = path.resolve(baseDir);
    
    // Check if the resolved path is within the base directory
    if (!resolvedPath.startsWith(resolvedBaseDir)) {
      return null;
    }
    
    // Additional security check: ensure no directory traversal patterns
    if (filePath.includes('..') || filePath.includes('~')) {
      return null;
    }
    
    return resolvedPath;
  } catch (error) {
    return null;
  }
}

// Helper function to safely delete file
async function safeDeleteFile(filePath: string): Promise<boolean> {
  try {
    const validatedPath = validateFilePath(filePath, uploadDir);
    if (!validatedPath) {
      return false;
    }
    
    // Check if file exists before attempting to delete
    await fs.promises.access(validatedPath);
    await fs.promises.unlink(validatedPath);
    return true;
  } catch (error) {
    // File doesn't exist or can't be deleted
    return false;
  }
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const userId = req.user!.sub;
    const fileExt = path.extname(file.originalname);
    const fileName = `${userId}-${uuidv4()}${fileExt}`;
    cb(null, fileName);
  }
});

// File filter to only allow image files
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  // Accept only image files
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
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  }
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Reduced max attempts
  message: { error: 'Too many upload/delete requests, please try again later.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
});

// Upload profile picture
router.post('/profile-picture', uploadLimiter, upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const userId = req.user!.sub;
    const file = req.file;
    
    // Validate the uploaded file path
    const validatedFilePath = validateFilePath(file.path, uploadDir);
    if (!validatedFilePath) {
      // Clean up the uploaded file if path validation fails
      await safeDeleteFile(file.path);
      return res.status(400).json({ error: 'Invalid file path' });
    }
    
    // Process the image with sharp
    const processedImagePath = path.join(uploadDir, `processed-${file.filename}`);
    
    try {
      // Resize and optimize the image
      await sharp(validatedFilePath)
        .resize(300, 300, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ 
          quality: 80,
          chromaSubsampling: '4:4:4'
        })
        .toFile(processedImagePath);

      // Remove the original file after successful processing using safe delete
      await safeDeleteFile(validatedFilePath);
    } catch (processingError) {
      // Clean up original file on processing error using safe delete
      await safeDeleteFile(validatedFilePath);
      throw new Error('Failed to process image');
    }

    const profilePictureUrl = `/uploads/profile-pictures/processed-${file.filename}`;
    
    // Get current user data first
    const currentUser = await UserRepository.findById(userId);
    if (!currentUser) {
      // Clean up processed file if user not found
      await safeDeleteFile(processedImagePath);
      throw new Error('User not found');
    }

    // Delete old profile picture if it exists
    const oldPictureUrl = currentUser.preferences?.profilePicture;
    if (oldPictureUrl) {
      const oldFilePath = path.join(uploadDir, path.basename(oldPictureUrl));
      await safeDeleteFile(oldFilePath);
    }

    // Update user profile with the new picture URL
    const preferences = {
      ...currentUser.preferences,
      profilePicture: profilePictureUrl
    };
    
    await UserRepository.updateUser(userId, { preferences });

    // Log the profile picture update
    AuditLogger.log('profile_picture_updated', {
      userId,
      timestamp: new Date(),
      fileInfo: {
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        storedAs: `processed-${file.filename}`
      }
    });

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: { profilePictureUrl }
    });

  } catch (error) {
    AuditLogger.logError('profile_picture_upload_error', { userId: req.user!.sub, error });
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
});

// Delete profile picture
router.delete('/profile-picture', uploadLimiter, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.sub;
    
    const user = await UserRepository.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profilePictureUrl = user.preferences?.profilePicture;
    if (!profilePictureUrl) {
      return res.status(400).json({ error: 'No profile picture to delete' });
    }

    const filename = path.basename(profilePictureUrl);
    const filePath = path.join(uploadDir, filename);
    
    // Use safe delete function to handle path validation and deletion
    await safeDeleteFile(filePath);

    // Update user preferences to remove profile picture
    const preferences = {
      ...user.preferences,
      profilePicture: null
    };
    
    await UserRepository.updateUser(userId, { preferences });

    AuditLogger.log('profile_picture_deleted', {
      userId,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Profile picture deleted successfully'
    });

  } catch (error) {
    AuditLogger.logError('profile_picture_delete_error', { userId: req.user!.sub, error });
    res.status(500).json({ error: 'Failed to delete profile picture' });
  }
});

export default router;