import { BaseNotification, NotificationChannel, NotificationType } from './types';
import { AuditLogger } from '../../utils/auditLogger';
import { createClient } from 'redis';

/**
 * VitaTrack Notification Scheduling Service
 * 
 * This service handles scheduling notifications for future delivery
 * It uses Redis for storing scheduled notifications and a worker process to deliver them
 */
export class SchedulingService {
  private redis: any; // Changed from Redis to any as per edit hint
  private scheduledSetKey: string = 'notifications:scheduled';
  private checkInterval: NodeJS.Timeout | null = null;
  
  constructor(redisClient?: any) { // Changed from Redis to any as per edit hint
    // Use provided Redis client or create a new one
    this.redis = redisClient || createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379', // Updated to use REDIS_URL
      password: process.env.REDIS_PASSWORD,
    });

    this.redis.on('error', (err: any) => {
      console.error('Redis client error:', err);
    });

    this.redis.on('connect', () => {
      console.log('Redis client connected');
    });
  }
  
  /**
   * Schedule a notification for future delivery
   */
  async scheduleNotification(notification: BaseNotification, deliveryTime: Date): Promise<string> {
    try {
      // Generate notification ID if not provided
      const notificationId = notification.id || `notification_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      // Create a copy of the notification with the ID and scheduled time
      const scheduledNotification = {
        ...notification,
        id: notificationId,
        scheduledFor: deliveryTime,
        createdAt: new Date(),
      };
      
      // Store in Redis sorted set with score as timestamp for delivery
      await this.redis.zadd(
        this.scheduledSetKey,
        deliveryTime.getTime(),
        JSON.stringify(scheduledNotification)
      );
      
      console.log(`Scheduled notification ${notificationId} for ${deliveryTime.toISOString()}`);
      
      // Log the scheduling
      AuditLogger.log('notification_scheduled', {
        notificationId,
        userId: notification.userId,
        type: notification.type,
        scheduledFor: deliveryTime.toISOString(),
      });
      
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }
  
  /**
   * Cancel a scheduled notification
   */
  async cancelScheduledNotification(notificationId: string): Promise<boolean> {
    try {
      // Find the notification in the scheduled set
      const scheduledNotifications = await this.redis.zrange(this.scheduledSetKey, 0, -1);
      
      for (const notificationJson of scheduledNotifications) {
        try {
          const notification = JSON.parse(notificationJson);
          
          if (notification.id === notificationId) {
            // Remove from the scheduled set
            await this.redis.zrem(this.scheduledSetKey, notificationJson);
            
            console.log(`Cancelled scheduled notification ${notificationId}`);
            
            // Log the cancellation
            AuditLogger.log('notification_cancelled', {
              notificationId,
              userId: notification.userId,
            });
            
            return true;
          }
        } catch (e) {
          console.error('Error parsing scheduled notification:', e);
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error cancelling scheduled notification:', error);
      return false;
    }
  }
  
  /**
   * Get all scheduled notifications for a user
   */
  async getScheduledNotificationsForUser(userId: string): Promise<BaseNotification[]> {
    try {
      const scheduledNotifications = await this.redis.zrange(this.scheduledSetKey, 0, -1);
      const userNotifications: BaseNotification[] = [];
      
      for (const notificationJson of scheduledNotifications) {
        try {
          const notification = JSON.parse(notificationJson) as BaseNotification;
          
          if (notification.userId === userId) {
            userNotifications.push(notification);
          }
        } catch (e) {
          console.error('Error parsing scheduled notification:', e);
        }
      }
      
      return userNotifications;
    } catch (error) {
      console.error('Error getting scheduled notifications for user:', error);
      return [];
    }
  }
  
  /**
   * Start the scheduler worker
   * This checks for due notifications and processes them
   */
  startScheduler(processCallback: (notification: BaseNotification) => Promise<void>): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    // Check for due notifications every minute
    this.checkInterval = setInterval(async () => {
      try {
        const now = Date.now();
        
        // Get all notifications that are due
        const dueNotifications = await this.redis.zrangebyscore(
          this.scheduledSetKey,
          0,  // Min score (beginning of time)
          now // Max score (current time)
        );
        
        if (dueNotifications.length > 0) {
          console.log(`Processing ${dueNotifications.length} due notifications`);
          
          // Process each due notification
          for (const notificationJson of dueNotifications) {
            try {
              // Parse the notification
              const notification = JSON.parse(notificationJson) as BaseNotification;
              
              // Process the notification using the callback
              await processCallback(notification);
              
              // Remove from the scheduled set
              await this.redis.zrem(this.scheduledSetKey, notificationJson);
              
              console.log(`Processed scheduled notification ${notification.id}`);
            } catch (e) {
              console.error('Error processing scheduled notification:', e);
            }
          }
        }
      } catch (error) {
        console.error('Error in scheduler worker:', error);
      }
    }, 60000); // Check every minute
    
    console.log('Notification scheduler started');
  }
  
  /**
   * Stop the scheduler worker
   */
  stopScheduler(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('Notification scheduler stopped');
    }
  }
}