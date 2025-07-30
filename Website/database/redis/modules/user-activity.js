/**
 * VitaTrack User Activity Tracking Module
 * 
 * This module uses Redis to track user activities in real-time
 */

const Redis = require('ioredis');

class UserActivityTracker {
  constructor(config) {
    this.redis = new Redis(config.redis);
    this.streamMaxLen = config.streamMaxLen || 1000;
    this.recentActivitiesTTL = config.recentActivitiesTTL || 86400; // 1 day
  }

  /**
   * Record a user activity
   */
  async trackActivity(userId, activity) {
    const timestamp = Date.now();
    const activityData = {
      type: activity.type,
      details: JSON.stringify(activity.details),
      timestamp
    };

    // Add to user's activity stream
    await this.redis.xadd(
      `user:${userId}:activity:stream`,
      'MAXLEN', '~', this.streamMaxLen,
      '*',
      ...Object.entries(activityData).flat()
    );

    // Add to recent activities sorted set
    await this.redis.zadd(
      `user:${userId}:activity:recent`,
      timestamp,
      JSON.stringify({
        type: activity.type,
        details: activity.details,
        timestamp
      })
    );

    // Set expiry on recent activities
    await this.redis.expire(`user:${userId}:activity:recent`, this.recentActivitiesTTL);

    // Add to global activity stream for analytics
    await this.redis.xadd(
      'global:activity:stream',
      'MAXLEN', '~', this.streamMaxLen * 10,
      '*',
      'userId', userId,
      ...Object.entries(activityData).flat()
    );
  }

  /**
   * Get recent user activities
   */
  async getRecentActivities(userId, count = 10) {
    const activities = await this.redis.zrevrange(
      `user:${userId}:activity:recent`,
      0,
      count - 1,
      'WITHSCORES'
    );

    const result = [];
    for (let i = 0; i < activities.length; i += 2) {
      const activity = JSON.parse(activities[i]);
      result.push(activity);
    }

    return result;
  }

  /**
   * Get user activity history from stream
   */
  async getActivityHistory(userId, count = 50, lastId = '0') {
    const stream = await this.redis.xread(
      'COUNT', count,
      'STREAMS', `user:${userId}:activity:stream`,
      lastId
    );

    if (!stream || stream.length === 0) {
      return [];
    }

    const [streamName, entries] = stream[0];
    return entries.map(([id, fields]) => {
      const activity = {};
      for (let i = 0; i < fields.length; i += 2) {
        const key = fields[i];
        const value = fields[i + 1];
        activity[key] = key === 'details' ? JSON.parse(value) : value;
      }
      activity.id = id;
      return activity;
    });
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(userId, activityType, timeRange) {
    const now = Date.now();
    const startTime = now - timeRange;

    // Count activities by type in time range
    const activities = await this.redis.zrangebyscore(
      `user:${userId}:activity:recent`,
      startTime,
      '+inf'
    );

    let count = 0;
    for (const activityJson of activities) {
      const activity = JSON.parse(activityJson);
      if (activity.type === activityType) {
        count++;
      }
    }

    return { count };
  }
}

module.exports = UserActivityTracker;