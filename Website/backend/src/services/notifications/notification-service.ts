import { NotificationChannel, NotificationType, NotificationPriority, NotificationTemplate } from './types';
import { BaseNotification, Notification, NotificationPreferences, NotificationDeliveryRecord, NotificationDeliveryStatus } from './types';
import { EmailService } from './email-service';
import { PushNotificationService } from './push-notifications';
import { SmsService } from './sms-service';
import { UserRepository } from '../../database/repositories/UserRepository';
import { AuditLogger } from '../../utils/auditLogger';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from 'redis';

/**
 * VitaTrack Notification Service
 * 
 * This service handles all notification operations including:
 * - Sending notifications through multiple channels (email, push, SMS, in-app)
 * - Managing notification preferences
 * - Scheduling notifications
 * - Tracking notification delivery
 * - A/B testing for notification effectiveness
 */
export class NotificationService {
  private emailService: EmailService;
  private pushService: PushNotificationService;
  private smsService: SmsService;
  private userRepository: UserRepository;
  private redis: any; // Changed type to any as Redis client type is not directly imported
  private readonly streamKey = 'vitatrack:notifications';
  
  constructor() {
    this.emailService = new EmailService();
    this.pushService = new PushNotificationService();
    this.smsService = new SmsService();
    this.userRepository = new UserRepository();
    
    // Initialize Redis client
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD,
    });
    
    // Initialize notification stream if needed
    this.initNotificationStream();
  }
  
  /**
   * Initialize notification stream in Redis
   */
  private async initNotificationStream(): Promise<void> {
    try {
      // Create stream if not exists
      await this.redis.xadd(
        this.streamKey,
        'MAXLEN', '~', 10000,
        '*',
        'type', 'system',
        'message', 'Notification service initialized',
        'timestamp', Date.now().toString()
      );
      
      // Create consumer groups
      const consumerGroups = ['web-app', 'mobile-app', 'admin-panel'];
      
      for (const group of consumerGroups) {
        try {
          await this.redis.xgroup('CREATE', this.streamKey, group, '$', 'MKSTREAM');
        } catch (err: any) {
          // Group may already exist
          if (!err.message.includes('BUSYGROUP')) {
            console.error(`Error creating consumer group ${group}:`, err);
          }
        }
      }
    } catch (err) {
      console.error('Error initializing notification stream:', err);
    }
  }
  
  /**
   * Send a notification through the specified channel
   */
  public async send(notification: Notification): Promise<boolean> {
    try {
      // Generate ID if not provided
      if (!notification.id) {
        notification.id = uuidv4();
      }
      
      // Set created timestamp
      notification.createdAt = notification.createdAt || new Date();
      
      // Check if notification should be scheduled for later
      if (notification.scheduledFor && notification.scheduledFor > new Date()) {
        return this.scheduleNotification(notification);
      }
      
      // Check user preferences before sending
      const shouldSend = await this.checkUserPreferences(notification);
      if (!shouldSend) {
        console.log(`Notification ${notification.id} skipped due to user preferences`);
        return false;
      }
      
      // Send based on channel
      let success = false;
      
      switch (notification.channel) {
        case NotificationChannel.EMAIL:
          success = await this.emailService.send(notification);
          break;
          
        case NotificationChannel.PUSH:
          success = await this.pushService.send(notification);
          break;
          
        case NotificationChannel.SMS:
          success = await this.smsService.send(notification);
          break;
          
        case NotificationChannel.IN_APP:
          success = await this.sendInAppNotification(notification);
          break;
      }
      
      // Record delivery status
      await this.recordDeliveryStatus({
        notificationId: notification.id,
        userId: notification.userId,
        channel: notification.channel,
        status: success ? NotificationDeliveryStatus.SENT : NotificationDeliveryStatus.FAILED,
        sentAt: success ? new Date() : undefined,
        failedAt: !success ? new Date() : undefined,
      });
      
      // Log the notification
      AuditLogger.log('notification_sent', {
        notificationId: notification.id,
        userId: notification.userId,
        type: notification.type,
        channel: notification.channel,
        success,
      });
      
      return success;
    } catch (error) {
      console.error('Error sending notification:', error);
      
      // Record failure
      if (notification.id) {
        await this.recordDeliveryStatus({
          notificationId: notification.id,
          userId: notification.userId,
          channel: notification.channel,
          status: NotificationDeliveryStatus.FAILED,
          failedAt: new Date(),
          failureReason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      
      AuditLogger.logError('notification_error', {
        notificationId: notification.id,
        userId: notification.userId,
        type: notification.type,
        channel: notification.channel,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      return false;
    }
  }
  
  /**
   * Send an in-app notification via Redis stream
   */
  private async sendInAppNotification(notification: Notification): Promise<boolean> {
    try {
      const entry = {
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: JSON.stringify(notification.data || {}),
        timestamp: Date.now().toString(),
      };
      
      await this.redis.xadd(
        this.streamKey,
        'MAXLEN', '~', 10000,
        '*',
        ...Object.entries(entry).flat()
      );
      
      return true;
    } catch (error) {
      console.error('Error sending in-app notification:', error);
      return false;
    }
  }
  
  /**
   * Schedule a notification for later delivery
   */
  private async scheduleNotification(notification: Notification): Promise<boolean> {
    // This functionality was removed from the import, so this method is now a placeholder
    // In a real application, you would use a scheduling service here
    console.warn('Scheduling functionality is currently unavailable.');
    return false;
  }
  
  /**
   * Check if notification should be sent based on user preferences
   */
  private async checkUserPreferences(notification: Notification): Promise<boolean> {
    try {
      // Get user preferences
      const preferences = await this.getUserNotificationPreferences(notification.userId);
      
      if (!preferences) {
        // If no preferences are set, default to sending the notification
        return true;
      }
      
      // Check if the channel is enabled
      if (!preferences.channels[notification.channel]) {
        return false;
      }
      
      // Check if the notification type is enabled
      const typePrefs = preferences.types[notification.type];
      if (typePrefs && !typePrefs.enabled) {
        return false;
      }
      
      // Check if the notification type is restricted to specific channels
      if (typePrefs && typePrefs.channels && !typePrefs.channels.includes(notification.channel)) {
        return false;
      }
      
      // Check quiet hours
      if (preferences.schedules.quiet_hours_start && preferences.schedules.quiet_hours_end) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        
        // Check if current time is within quiet hours
        if (this.isTimeInRange(currentTime, preferences.schedules.quiet_hours_start, preferences.schedules.quiet_hours_end)) {
          // Only send urgent notifications during quiet hours
          return notification.priority === NotificationPriority.URGENT;
        }
      }
      
      // Check weekdays only setting
      if (preferences.schedules.weekdays_only) {
        const now = new Date();
        const dayOfWeek = now.getDay();
        
        // If it's weekend (0 = Sunday, 6 = Saturday) and not urgent, don't send
        if ((dayOfWeek === 0 || dayOfWeek === 6) && notification.priority !== NotificationPriority.URGENT) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error checking user preferences:', error);
      // Default to sending if there's an error checking preferences
      return true;
    }
  }
  
  /**
   * Check if a time is within a range
   */
  private isTimeInRange(time: string, start: string, end: string): boolean {
    // Handle ranges that span midnight
    if (start > end) {
      return time >= start || time < end;
    }
    return time >= start && time < end;
  }
  
  /**
   * Get user notification preferences
   */
  public async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      // Try to get from cache first
      const cachedPrefs = await this.redis.get(`user:${userId}:notification_preferences`);
      if (cachedPrefs) {
        return JSON.parse(cachedPrefs);
      }
      
      // If not in cache, get from database
      const user = await this.userRepository.findById(userId);
      if (!user || !user.preferences) {
        return null;
      }
      
      // Extract notification preferences from user preferences
      const notificationPrefs = user.preferences.notifications as NotificationPreferences;
      
      // Cache the preferences
      if (notificationPrefs) {
        await this.redis.set(
          `user:${userId}:notification_preferences`,
          JSON.stringify(notificationPrefs),
          'EX',
          3600 // Cache for 1 hour
        );
      }
      
      return notificationPrefs || null;
    } catch (error) {
      console.error('Error getting user notification preferences:', error);
      return null;
    }
  }
  
  /**
   * Update user notification preferences
   */
  public async updateUserNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<boolean> {
    try {
      // Get current user
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return false;
      }
      
      // Initialize preferences if they don't exist
      if (!user.preferences) {
        user.preferences = {};
      }
      
      // Initialize notification preferences if they don't exist
      if (!user.preferences.notifications) {
        user.preferences.notifications = {
          userId,
          channels: {
            [NotificationChannel.EMAIL]: true,
            [NotificationChannel.PUSH]: true,
            [NotificationChannel.SMS]: false,
            [NotificationChannel.IN_APP]: true,
          },
          types: {},
          schedules: {},
          contactInfo: {},
        };
      }
      
      // Update preferences
      user.preferences.notifications = {
        ...user.preferences.notifications,
        ...preferences,
      };
      
      // Save user
      await this.userRepository.updateUser(userId, { preferences: user.preferences });
      
      // Update cache
      await this.redis.set(
        `user:${userId}:notification_preferences`,
        JSON.stringify(user.preferences.notifications),
        'EX',
        3600 // Cache for 1 hour
      );
      
      return true;
    } catch (error) {
      console.error('Error updating user notification preferences:', error);
      return false;
    }
  }
  
  /**
   * Record notification delivery status
   */
  private async recordDeliveryStatus(record: NotificationDeliveryRecord): Promise<void> {
    try {
      // In a production environment, this would save to a database
      // For now, we'll just log it and save to Redis for tracking
      
      // Generate ID if not provided
      if (!record.id) {
        record.id = uuidv4();
      }
      
      // Save to Redis
      await this.redis.hset(
        `notification:${record.notificationId}:delivery`,
        record.channel,
        JSON.stringify(record)
      );
      
      // Set expiration (keep for 30 days)
      await this.redis.expire(`notification:${record.notificationId}:delivery`, 60 * 60 * 24 * 30);
      
      // For analytics, also add to a time series
      const now = Date.now();
      await this.redis.zadd(
        `notifications:delivery:${record.status}`,
        now,
        `${record.notificationId}:${record.channel}`
      );
      
      // Keep time series for 90 days
      await this.redis.expire(`notifications:delivery:${record.status}`, 60 * 60 * 24 * 90);
    } catch (error) {
      console.error('Error recording delivery status:', error);
    }
  }
  
  /**
   * Update notification delivery status
   */
  public async updateDeliveryStatus(notificationId: string, channel: NotificationChannel, status: NotificationDeliveryStatus): Promise<boolean> {
    try {
      // Get current record
      const recordJson = await this.redis.hget(`notification:${notificationId}:delivery`, channel);
      if (!recordJson) {
        return false;
      }
      
      const record = JSON.parse(recordJson) as NotificationDeliveryRecord;
      
      // Update status and timestamps
      record.status = status;
      
      switch (status) {
        case NotificationDeliveryStatus.DELIVERED:
          record.deliveredAt = new Date();
          break;
        case NotificationDeliveryStatus.READ:
          record.readAt = new Date();
          break;
        case NotificationDeliveryStatus.FAILED:
          record.failedAt = new Date();
          break;
      }
      
      // Save updated record
      await this.redis.hset(
        `notification:${notificationId}:delivery`,
        channel,
        JSON.stringify(record)
      );
      
      // For analytics, also add to a time series
      const now = Date.now();
      await this.redis.zadd(
        `notifications:delivery:${status}`,
        now,
        `${notificationId}:${channel}`
      );
      
      return true;
    } catch (error) {
      console.error('Error updating delivery status:', error);
      return false;
    }
  }
  
  /**
   * Get pending in-app notifications for a user
   */
  public async getPendingInAppNotifications(userId: string, limit = 50): Promise<any[]> {
    try {
      // Get notifications from Redis stream
      const results = await this.redis.xread(
        'COUNT', limit,
        'STREAMS', this.streamKey, '0'
      );
      
      if (!results || results.length === 0) {
        return [];
      }
      
      const [streamName, entries] = results[0];
      
      // Filter notifications for this user
      const notifications = [];
      
      for (const [id, fields] of entries) {
        const notification: Record<string, any> = { id };
        
        for (let i = 0; i < fields.length; i += 2) {
          const key = fields[i];
          const value = fields[i + 1];
          
          if (key === 'data' && value) {
            try {
              notification[key] = JSON.parse(value);
            } catch (e) {
              notification[key] = value;
            }
          } else {
            notification[key] = value;
          }
        }
        
        // Only include notifications for this user
        if (notification.userId === userId) {
          notifications.push(notification);
        }
      }
      
      return notifications;
    } catch (error) {
      console.error('Error getting pending in-app notifications:', error);
      return [];
    }
  }
  
  /**
   * Mark in-app notification as read
   */
  public async markInAppNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      // Update delivery status
      return this.updateDeliveryStatus(notificationId, NotificationChannel.IN_APP, NotificationDeliveryStatus.READ);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }
  
  /**
   * Create a personalized notification based on user behavior
   */
  public async createPersonalizedNotification(userId: string, type: NotificationType): Promise<Notification | null> {
    // This would be implemented with more sophisticated logic in a real application
    // For now, we'll just create a basic notification
    
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return null;
      }
      
      // Get user preferences to determine best channel
      const preferences = await this.getUserNotificationPreferences(userId);
      let channel = NotificationChannel.IN_APP; // Default
      
      if (preferences) {
        // Choose the highest priority enabled channel
        if (preferences.channels[NotificationChannel.PUSH]) {
          channel = NotificationChannel.PUSH;
        } else if (preferences.channels[NotificationChannel.EMAIL]) {
          channel = NotificationChannel.EMAIL;
        } else if (preferences.channels[NotificationChannel.SMS]) {
          channel = NotificationChannel.SMS;
        }
      }
      
      // Create notification based on type and channel
      let notification: Partial<Notification> = {
        userId,
        type,
        priority: NotificationPriority.MEDIUM,
        title: '',
        message: '',
      };
      
      // Set channel-specific properties
      switch (channel) {
        case NotificationChannel.EMAIL:
          notification = {
            ...notification,
            channel: NotificationChannel.EMAIL,
            recipient: user.email,
            subject: '',
          };
          break;
          
        case NotificationChannel.PUSH:
          notification = {
            ...notification,
            channel: NotificationChannel.PUSH,
            deviceTokens: preferences?.contactInfo?.deviceTokens || [],
          };
          break;
          
        case NotificationChannel.SMS:
          notification = {
            ...notification,
            channel: NotificationChannel.SMS,
            phoneNumber: preferences?.contactInfo?.phone || '',
          };
          break;
          
        case NotificationChannel.IN_APP:
          notification = {
            ...notification,
            channel: NotificationChannel.IN_APP,
            isRead: false,
          };
          break;
      }
      
      // Set content based on notification type
      switch (type) {
        case NotificationType.WATER_REMINDER:
          notification.title = 'Hydration Reminder';
          notification.message = 'Time to drink some water! Stay hydrated for better health.';
          break;
          
        case NotificationType.MEAL_REMINDER:
          notification.title = 'Meal Tracking Reminder';
          notification.message = 'Don\'t forget to log your meal for better nutrition tracking.';
          break;
          
        case NotificationType.EXERCISE_REMINDER:
          notification.title = 'Exercise Reminder';
          notification.message = 'Time for some activity! A little movement goes a long way.';
          break;
          
        case NotificationType.GOAL_ACHIEVED:
          notification.title = 'Goal Achieved!';
          notification.message = 'Congratulations! You\'ve reached one of your health goals.';
          notification.priority = NotificationPriority.HIGH;
          break;
          
        case NotificationType.MOTIVATION:
          notification.title = 'Keep Going!';
          notification.message = 'You\'re making great progress on your health journey!';
          break;
          
        default:
          notification.title = 'VitaTrack Notification';
          notification.message = 'You have a new notification from VitaTrack.';
      }
      
      return notification as Notification;
    } catch (error) {
      console.error('Error creating personalized notification:', error);
      return null;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();