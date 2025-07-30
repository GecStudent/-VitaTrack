import express from 'express';
import { Request, Response } from 'express';
import Joi from 'joi';
import UserRepository from '../../database/repositories/UserRepository';
import { AuditLogger } from '../../utils/auditLogger';
import { registerSchema, requestValidator } from '../../middleware/requestValidator';
import { validatePersonalInfo, validateHealthMetrics, validateGender, validateActivityLevel } from '../auth/validation';

const router = express.Router();

// Schema for profile update validation
const profileUpdateSchema = Joi.object({
  body: Joi.object({
    first_name: Joi.string().min(1).max(50).optional(),
    last_name: Joi.string().min(1).max(50).optional(),
    birth_date: Joi.date().iso().optional(),
    gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional(),
    height: Joi.number().min(30).max(250).optional(),
    current_weight: Joi.number().min(20).max(500).optional(),
    goal_weight: Joi.number().min(20).max(500).optional(),
    activity_level: Joi.string().valid(
      'sedentary', 
      'lightly_active', 
      'moderately_active', 
      'very_active', 
      'extremely_active'
    ).optional(),
  }).min(1)
});

// Register the schema
registerSchema('PUT:/api/users/profile', profileUpdateSchema);

// Get user profile
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.sub;
    
    // Log data access for GDPR compliance
    const timestamp = new Date();
    AuditLogger.log('profile_viewed', { userId, timestamp });
    
    // Get user from database
    const user = await UserRepository.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove sensitive data
    const { password_hash: _, ...safeUser } = user;
    
    res.json({
      success: true,
      data: safeUser,
      profileCompletion: calculateProfileCompletion(user)
    });
  } catch (error) {
    AuditLogger.logError('profile_view_error', { userId: req.user!.sub, error });
    res.status(500).json({ error: 'Failed to retrieve user profile' });
  }
});

// Update user profile
router.put('/', requestValidator, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.sub;
    const updateData = req.body;
    
    // Get current user data for comparison and audit logging
    const currentUser = await UserRepository.findById(userId);
    
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Validate specific fields with custom validators
    if (updateData.first_name && updateData.last_name && updateData.birth_date) {
      if (!validatePersonalInfo(updateData.first_name, updateData.last_name, updateData.birth_date)) {
        return res.status(400).json({ error: 'Invalid personal information' });
      }
    }
    
    if (updateData.height && updateData.current_weight && updateData.goal_weight) {
      if (!validateHealthMetrics(
        parseFloat(updateData.height), 
        parseFloat(updateData.current_weight), 
        parseFloat(updateData.goal_weight)
      )) {
        return res.status(400).json({ error: 'Invalid health metrics' });
      }
    }
    
    if (updateData.gender && !validateGender(updateData.gender)) {
      return res.status(400).json({ error: 'Invalid gender value' });
    }
    
    if (updateData.activity_level && !validateActivityLevel(updateData.activity_level)) {
      return res.status(400).json({ error: 'Invalid activity level' });
    }
    
    // Track changes for audit logging
    const changes = Object.keys(updateData).reduce((acc: Record<string, unknown>, key) => {
      if (currentUser[key as keyof typeof currentUser] !== updateData[key]) {
        acc[key] = {
          from: currentUser[key as keyof typeof currentUser],
          to: updateData[key]
        };
      }
      return acc;
    }, {});
    
    // Update user in database
    const updatedUser = await UserRepository.updateUser(userId, updateData);
    
    if (!updatedUser) {
      return res.status(500).json({ error: 'Failed to update user profile' });
    }
    
    // Log the profile update for audit purposes
    AuditLogger.log('profile_updated', {
      userId,
      timestamp: new Date(),
      changes
    });
    
    // Remove sensitive data
    const { password_hash: _, ...safeUser } = updatedUser;
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: safeUser,
      profileCompletion: calculateProfileCompletion(updatedUser)
    });
  } catch (error) {
    AuditLogger.logError('profile_update_error', { userId: req.user!.sub, error });
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Get user preferences
router.get('/preferences', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.sub;
    
    // Get user from database
    const user = await UserRepository.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return just the preferences
    res.json({
      success: true,
      data: user.preferences || {}
    });
  } catch (error) {
    AuditLogger.logError('preferences_view_error', { userId: req.user!.sub, error });
    res.status(500).json({ error: 'Failed to retrieve user preferences' });
  }
});

// Update user preferences
router.put('/preferences', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.sub;
    const preferences = req.body;
    
    // Get current user data for comparison and audit logging
    const currentUser = await UserRepository.findById(userId);
    
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update user preferences in database
    const updatedUser = await UserRepository.updateUser(userId, { preferences });
    
    if (!updatedUser) {
      return res.status(500).json({ error: 'Failed to update user preferences' });
    }
    
    // Log the preferences update for audit purposes
    AuditLogger.log('preferences_updated', {
      userId,
      timestamp: new Date(),
      changes: {
        from: currentUser.preferences,
        to: preferences
      }
    });
    
    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: updatedUser.preferences
    });
  } catch (error) {
    AuditLogger.logError('preferences_update_error', { userId: req.user!.sub, error });
    res.status(500).json({ error: 'Failed to update user preferences' });
  }
});

// Helper function to calculate profile completion percentage
function calculateProfileCompletion(user: any): number {
  const requiredFields = [
    'first_name',
    'last_name',
    'email',
    'birth_date',
    'gender',
    'height',
    'current_weight',
    'goal_weight',
    'activity_level',
    'preferences'
  ];
  
  const completedFields = requiredFields.filter(field => {
    const value = user[field];
    return value !== null && value !== undefined && value !== '';
  });
  
  return Math.round((completedFields.length / requiredFields.length) * 100);
}

export default router;