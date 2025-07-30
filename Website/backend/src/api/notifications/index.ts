import express from 'express';
import { Request, Response } from 'express';
import Joi from 'joi';
import { JwtPayload } from '../../auth/types';
import { registerSchema } from '../../middleware/requestValidator';
import { notificationService } from '../../services/notifications/notification-service';
import { NotificationChannel, NotificationType, NotificationPriority } from '../../services/notifications/types';
import UserRepository from '../../database/repositories/UserRepository';
import { AuditLogger } from '../../utils/auditLogger';

const router = express.Router();

// Schema for sending notification
const sendNotificationSchema = Joi.object({
  body: Joi.object({
    type: Joi.string().valid(...Object.values(NotificationType)).required(),
    title: Joi.string().required(),
    message: Joi.string().required(),
    data: Joi.object().default({}),
    channels: Joi.array().items(Joi.string().valid(...Object.values(NotificationChannel))).default([NotificationChannel.IN_APP]),
    priority: Joi.string().valid(...Object.values(NotificationPriority)).default(NotificationPriority.MEDIUM),
    templateId: Joi.string(),
    templateData: Joi.object(),
    scheduleTime: Joi.date().iso(),
  }),
});

// Schema for updating preferences
const updatePreferencesSchema = Joi.object({
  body: Joi.object({
    optOut: Joi.array().items(Joi.string().valid(...Object.values(NotificationType))),
    channels: Joi.array().items(Joi.string().valid(...Object.values(NotificationChannel))),
    quietHours: Joi.object({
      start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    }),
    frequency: Joi.string().valid('immediate', 'hourly', 'daily'),
    customSettings: Joi.object(),
  }),
});

// Register schemas
registerSchema('POST:/api/notifications/send', sendNotificationSchema);
registerSchema('PUT:/api/notifications/preferences', updatePreferencesSchema);

// GET /api/notifications/preferences - Get user's notification preferences
router.get('/preferences', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // Get user from repository
    const userRepository = UserRepository;
    const userRecord = await userRepository.findById(userId);
    
    if (!userRecord) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get notification preferences
    const preferences = userRecord.preferences?.notifications || {
      optOut: [],
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      quietHours: { start: '22:00', end: '08:00' },
      frequency: 'immediate',
    };
    
    res.json(preferences);
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({ error: 'Failed to get notification preferences' });
  }
});

// PUT /api/notifications/preferences - Update user's notification preferences
// TODO: The following endpoints are commented out because the required methods do not exist on notificationService.
// Uncomment and implement when available.

// router.put('/preferences', async (req: Request, res: Response) => {
//   try {
//     const user = req.user as JwtPayload;
//     const userId = user.sub;
//     const preferences = req.body;
    
//     // Update preferences
//     const success = await notificationService.updateUserPreferences(userId, preferences);
    
//     if (success) {
//       res.json({ success: true, message: 'Notification preferences updated' });
//     } else {
//       res.status(500).json({ error: 'Failed to update notification preferences' });
//     }
//   } catch (error) {
//     console.error('Update notification preferences error:', error);
//     res.status(500).json({ error: 'Failed to update notification preferences' });
//   }
// });

// POST /api/notifications/send - Send a notification
router.post('/send', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const notification = req.body;
    
    // Send notification
    const result = await notificationService.send({
      userId,
      ...notification,
    });
    
    res.json(result);
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// GET /api/notifications/history - Get user's notification history
// TODO: The following endpoints are commented out because the required methods do not exist on notificationService.
// Uncomment and implement when available.

// router.get('/history', async (req: Request, res: Response) => {
//   try {
//     const user = req.user as JwtPayload;
//     const userId = user.sub;
//     const limit = parseInt(req.query.limit as string || '50');
//     const offset = parseInt(req.query.offset as string || '0');
    
//     // Get notification history
//     const history = await notificationService.getUserNotificationHistory(userId, limit, offset);
    
//     res.json(history);
//   } catch (error) {
//     console.error('Get notification history error:', error);
//     res.status(500).json({ error: 'Failed to get notification history' });
//   }
// });

// POST /api/notifications/register-device - Register a device for push notifications
// TODO: The following endpoints are commented out because the required methods do not exist on notificationService.
// Uncomment and implement when available.

// router.post('/register-device', async (req: Request, res: Response) => {
//   try {
//     const user = req.user as JwtPayload;
//     const userId = user.sub;
//     const { token, platform } = req.body;
    
//     if (!token || !platform) {
//       return res.status(400).json({ error: 'Token and platform are required' });
//     }
    
//     // Register device
//     const success = await notificationService.pushService.registerDevice(userId, token, platform);
    
//     if (success) {
//       res.json({ success: true, message: 'Device registered successfully' });
//     } else {
//       res.status(500).json({ error: 'Failed to register device' });
//     }
//   } catch (error) {
//     console.error('Register device error:', error);
//     res.status(500).json({ error: 'Failed to register device' });
//   }
// });

// TODO: The following endpoints are commented out because the required methods do not exist or are private on notificationService.
// Uncomment and implement when available.

// router.post('/unregister-device', async (req, res) => {
//   const { userId, token } = req.body;
//   // pushService is private and unregisterDevice does not exist
//   // const success = await notificationService.pushService.unregisterDevice(userId, token);
//   res.json({ success: false, message: 'Not implemented' });
// });

// router.post('/track-engagement', async (req, res) => {
//   const { notificationId, userId, action } = req.body;
//   // const success = await notificationService.trackNotificationEngagement(notificationId, userId, action);
//   res.json({ success: false, message: 'Not implemented' });
// });

export default router;