/**
 * VitaTrack Notification Service Types
 * 
 * This file defines the types, interfaces, and enums used by the notification service
 */

// Notification channels
export enum NotificationChannel {
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
  IN_APP = 'in_app'
}

// Notification types
export enum NotificationType {
  // System notifications
  SYSTEM = 'system',
  ACCOUNT = 'account',
  SECURITY = 'security',
  
  // Health-related notifications
  WATER_REMINDER = 'water_reminder',
  MEAL_REMINDER = 'meal_reminder',
  EXERCISE_REMINDER = 'exercise_reminder',
  SLEEP_REMINDER = 'sleep_reminder',
  GOAL_REMINDER = 'goal_reminder',
  
  // Progress notifications
  GOAL_ACHIEVED = 'goal_achieved',
  MILESTONE_REACHED = 'milestone_reached',
  STREAK_MILESTONE = 'streak_milestone',
  
  // Health alerts
  HEALTH_ALERT = 'health_alert',
  EMERGENCY_ALERT = 'emergency_alert',
  
  // Motivational notifications
  MOTIVATION = 'motivation',
  TIP = 'tip',
  INSIGHT = 'insight'
}

// Notification priorities
export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Notification template types
export enum NotificationTemplate {
  // Email templates
  EMAIL_WATER_REMINDER = 'email_water_reminder',
  EMAIL_MEAL_REMINDER = 'email_meal_reminder',
  EMAIL_EXERCISE_REMINDER = 'email_exercise_reminder',
  EMAIL_GOAL_ACHIEVED = 'email_goal_achieved',
  EMAIL_WEEKLY_SUMMARY = 'email_weekly_summary',
  
  // Push notification templates
  PUSH_WATER_REMINDER = 'push_water_reminder',
  PUSH_MEAL_REMINDER = 'push_meal_reminder',
  PUSH_EXERCISE_REMINDER = 'push_exercise_reminder',
  PUSH_GOAL_ACHIEVED = 'push_goal_achieved',
  
  // SMS templates
  SMS_WATER_REMINDER = 'sms_water_reminder',
  SMS_MEAL_REMINDER = 'sms_meal_reminder',
  SMS_EXERCISE_REMINDER = 'sms_exercise_reminder',
  SMS_GOAL_ACHIEVED = 'sms_goal_achieved',
  
  // In-app notification templates
  IN_APP_WATER_REMINDER = 'in_app_water_reminder',
  IN_APP_MEAL_REMINDER = 'in_app_meal_reminder',
  IN_APP_EXERCISE_REMINDER = 'in_app_exercise_reminder',
  IN_APP_GOAL_ACHIEVED = 'in_app_goal_achieved',
  IN_APP_MOTIVATION = 'in_app_motivation'
}

// Notification delivery status
export enum NotificationDeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}

// Notification preferences interface
export interface NotificationPreferences {
  userId: string;
  channels: {
    [NotificationChannel.EMAIL]: boolean;
    [NotificationChannel.PUSH]: boolean;
    [NotificationChannel.SMS]: boolean;
    [NotificationChannel.IN_APP]: boolean;
  };
  types: {
    [key in NotificationType]?: {
      enabled: boolean;
      channels?: NotificationChannel[];
    };
  };
  schedules: {
    quiet_hours_start?: string; // HH:MM format
    quiet_hours_end?: string; // HH:MM format
    weekdays_only?: boolean;
    timezone?: string; // IANA timezone
  };
  contactInfo: {
    email?: string;
    phone?: string;
    deviceTokens?: string[];
  };
}

// Base notification interface
export interface BaseNotification {
  id?: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  data?: Record<string, any>;
  createdAt?: Date;
  scheduledFor?: Date;
  expiresAt?: Date;
  templateId?: NotificationTemplate;
  templateData?: Record<string, any>;
  abTestGroup?: string;
}

// Channel-specific notification interfaces
export interface EmailNotification extends BaseNotification {
  channel: NotificationChannel.EMAIL;
  recipient: string;
  subject: string;
  html?: string;
  attachments?: Array<{filename: string, content: string}>;
}

export interface PushNotification extends BaseNotification {
  channel: NotificationChannel.PUSH;
  deviceTokens: string[];
  icon?: string;
  image?: string;
  action?: string;
  badge?: number;
  sound?: string;
  ttl?: number; // Time to live in seconds
}

export interface SmsNotification extends BaseNotification {
  channel: NotificationChannel.SMS;
  phoneNumber: string;
}

export interface InAppNotification extends BaseNotification {
  channel: NotificationChannel.IN_APP;
  isRead?: boolean;
  readAt?: Date;
  action?: string;
  icon?: string;
  image?: string;
}

// Union type for all notification types
export type Notification = EmailNotification | PushNotification | SmsNotification | InAppNotification;

// Notification delivery record
export interface NotificationDeliveryRecord {
  id?: string;
  notificationId: string;
  userId: string;
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  retryCount?: number;
  metadata?: Record<string, any>;
}

// A/B testing group
export interface ABTestGroup {
  id: string;
  name: string;
  description?: string;
  templateVariants: Record<NotificationTemplate, string>;
  metrics: {
    deliveryRate?: number;
    openRate?: number;
    clickRate?: number;
    conversionRate?: number;
  };
}