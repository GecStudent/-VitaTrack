/**
 * VitaTrack Notification Stream
 * 
 * This module implements Redis Streams for real-time notifications
 */

const Redis = require('ioredis');

class NotificationStream {
  constructor(config) {
    this.redis = new Redis(config.redis);
    this.streamKey = 'vitatrack:notifications';
    this.consumerGroups = config.consumerGroups || ['web-app', 'mobile-app', 'admin-panel'];
    this.maxLen = config.maxLen || 10000;
    
    // Initialize stream and consumer groups
    this.init();
  }

  /**
   * Initialize stream and consumer groups
   */
  async init() {
    try {
      // Create stream if not exists
      await this.redis.xadd(
        this.streamKey,
        'MAXLEN', '~', this.maxLen,
        '*',
        'type', 'system',
        'message', 'Stream initialized',
        'timestamp', Date.now()
      );
      
      // Create consumer groups
      for (const group of this.consumerGroups) {
        try {
          await this.redis.xgroup('CREATE', this.streamKey, group, '$', 'MKSTREAM');
        } catch (err) {
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
   * Publish notification to stream
   */
  async publish(notification) {
    const { userId, type, message, data = {} } = notification;
    
    const entry = {
      userId: userId || 'system',
      type,
      message,
      data: JSON.stringify(data),
      timestamp: Date.now().toString()
    };
    
    const id = await this.redis.xadd(
      this.streamKey,
      'MAXLEN', '~', this.maxLen,
      '*',
      ...Object.entries(entry).flat()
    );
    
    return { id, ...entry };
  }

  /**
   * Consume notifications for a specific consumer group
   */
  async consume(group, consumer, count = 10, block = 2000) {
    try {
      const streams = await this.redis.xreadgroup(
        'GROUP', group, consumer,
        'COUNT', count,
        'BLOCK', block,
        'STREAMS', this.streamKey, '>'
      );
      
      if (!streams || streams.length === 0) {
        return [];
      }
      
      const [streamName, entries] = streams[0];
      
      const notifications = entries.map(([id, fields]) => {
        const notification = { id };
        
        for (let i = 0; i < fields.length; i += 2) {
          const key = fields[i];
          const value = fields[i + 1];
          
          if (key === 'data') {
            notification[key] = JSON.parse(value);
          } else {
            notification[key] = value;
          }
        }
        
        return notification;
      });
      
      return notifications;
    } catch (err) {
      console.error(`Error consuming notifications for ${group}/${consumer}:`, err);
      return [];
    }
  }

  /**
   * Acknowledge processed notifications
   */
  async acknowledge(group, ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return 0;
    }
    
    try {
      return await this.redis.xack(this.streamKey, group, ...ids);
    } catch (err) {
      console.error(`Error acknowledging notifications for ${group}:`, err);
      return 0;
    }
  }

  /**
   * Get pending notifications for a consumer group
   */
  async getPending(group, consumer = null, count = 10) {
    try {
      let pendingInfo;
      
      if (consumer) {
        pendingInfo = await this.redis.xpending(
          this.streamKey,
          group,
          '-',
          '+',
          count,
          consumer
        );
      } else {
        pendingInfo = await this.redis.xpending(this.streamKey, group);
      }
      
      return pendingInfo;
    } catch (err) {
      console.error(`Error getting pending notifications for ${group}:`, err);
      return null;
    }
  }

  /**
   * Claim idle messages
   */
  async claimIdle(group, consumer, minIdleTime = 30000, count = 10) {
    try {
      const pending = await this.redis.xpending(
        this.streamKey,
        group,
        '-',
        '+',
        count
      );
      
      if (!pending || pending.length === 0) {
        return [];
      }
      
      const idleIds = pending
        .filter(([id, consumer, idle]) => idle >= minIdleTime)
        .map(([id]) => id);
      
      if (idleIds.length === 0) {
        return [];
      }
      
      const claimed = await this.redis.xclaim(
        this.streamKey,
        group,
        consumer,
        minIdleTime,
        ...idleIds,
        'JUSTID'
      );
      
      return claimed;
    } catch (err) {
      console.error(`Error claiming idle messages for ${group}/${consumer}:`, err);
      return [];
    }
  }
}

module.exports = NotificationStream;