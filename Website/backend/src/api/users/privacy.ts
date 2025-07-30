import express from 'express';
import { Request, Response } from 'express';
import Joi from 'joi';
import UserRepository from '../../database/repositories/UserRepository';
import { AuditLogger } from '../../utils/auditLogger';
import { registerSchema, requestValidator } from '../../middleware/requestValidator';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Schema for privacy settings validation
const privacySettingsSchema = Joi.object({
  body: Joi.object({
    dataSharing: Joi.object({
      allowAnonymousDataUsage: Joi.boolean().required(),
      shareProgressWithFriends: Joi.boolean().required(),
      participateInResearch: Joi.boolean().required()
    }).required(),
    visibility: Joi.object({
      profile: Joi.string().valid('public', 'friends', 'private').required(),
      weight: Joi.string().valid('public', 'friends', 'private').required(),
      goals: Joi.string().valid('public', 'friends', 'private').required(),
      activities: Joi.string().valid('public', 'friends', 'private').required(),
      meals: Joi.string().valid('public', 'friends', 'private').required()
    }).required(),
    marketing: Joi.object({
      receiveEmails: Joi.boolean().required(),
      receiveNotifications: Joi.boolean().required(),
      allowPersonalizedAds: Joi.boolean().required()
    }).required()
  }).required()
});

// Register the schema
registerSchema('PUT:/api/users/privacy/settings', privacySettingsSchema);

// Get privacy settings
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.sub;
    
    // Get user from database
    const user = await UserRepository.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get privacy settings from user preferences or return defaults
    const privacySettings = user.preferences?.privacy || {
      dataSharing: {
        allowAnonymousDataUsage: false,
        shareProgressWithFriends: false,
        participateInResearch: false
      },
      visibility: {
        profile: 'private',
        weight: 'private',
        goals: 'private',
        activities: 'private',
        meals: 'private'
      },
      marketing: {
        receiveEmails: false,
        receiveNotifications: false,
        allowPersonalizedAds: false
      }
    };
    
    // Log the privacy settings access
    AuditLogger.log('privacy_settings_viewed', {
      userId,
      timestamp: new Date()
    });
    
    res.json({
      success: true,
      data: privacySettings
    });
  } catch (error) {
    AuditLogger.logError('privacy_settings_view_error', { userId: req.user!.sub, error });
    res.status(500).json({ error: 'Failed to retrieve privacy settings' });
  }
});

// Update privacy settings
router.put('/settings', requestValidator, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.sub;
    const privacySettings = req.body;
    
    // Get current user data for comparison and audit logging
    const currentUser = await UserRepository.findById(userId);
    
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get current preferences or initialize if not exists
    const currentPreferences = currentUser.preferences || {};
    
    // Update privacy settings in preferences
    const updatedPreferences = {
      ...currentPreferences,
      privacy: privacySettings
    };
    
    // Update user preferences in database
    const updatedUser = await UserRepository.updateUser(userId, { preferences: updatedPreferences });
    
    if (!updatedUser) {
      return res.status(500).json({ error: 'Failed to update privacy settings' });
    }
    
    // Log the privacy settings update for audit purposes
    AuditLogger.log('privacy_settings_updated', {
      userId,
      timestamp: new Date(),
      changes: {
        from: currentPreferences.privacy,
        to: privacySettings
      }
    });
    
    res.json({
      success: true,
      message: 'Privacy settings updated successfully',
      data: privacySettings
    });
  } catch (error) {
    AuditLogger.logError('privacy_settings_update_error', { userId: req.user!.sub, error });
    res.status(500).json({ error: 'Failed to update privacy settings' });
  }
});

// Request account deletion (GDPR right to be forgotten)
router.post('/request-deletion', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.sub;
    const { reason } = req.body;
    
    // Log the deletion request
    AuditLogger.logSecurity('account_deletion_requested', {
      userId,
      timestamp: new Date(),
      reason
    });
    
    // In a real implementation, this would initiate a workflow for account deletion
    // For now, we'll just acknowledge the request
    
    res.json({
      success: true,
      message: 'Account deletion request received. You will receive further instructions via email.',
      requestId: uuidv4() // Generate a request ID for tracking
    });
  } catch (error) {
    AuditLogger.logError('account_deletion_request_error', { userId: req.user!.sub, error });
    res.status(500).json({ error: 'Failed to process account deletion request' });
  }
});

export default router;