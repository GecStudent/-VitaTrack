/**
 * VitaTrack Redis Client
 * 
 * Centralized Redis client configuration for VitaTrack
 */

const Redis = require('ioredis');
const NutritionCache = require('./modules/nutrition-cache');
const UserActivityTracker = require('./modules/user-activity');
const SessionStore = require('./modules/session-store');

class RedisClient {
  constructor(config) {
    this.config = config;
    this.clients = {};
    
    // Initialize modules
    this.nutritionCache = new NutritionCache({ redis: this.getRedisConfig('cache') });
    this.userActivity = new UserActivityTracker({ redis: this.getRedisConfig('activity') });
    this.sessionStore = new SessionStore({ redis: this.getRedisConfig('session') });
  }

  /**
   * Get Redis configuration for specific purpose
   */
  getRedisConfig(purpose) {
    const baseConfig = {
      host: this.config.host || 'localhost',
      port: this.config.port || 6379,
      password: this.config.password,
      db: 0,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    };

    // Use different Redis databases for different purposes
    switch (purpose) {
      case 'cache':
        return { ...baseConfig, db: 0 };
      case 'session':
        return { ...baseConfig, db: 1 };
      case 'activity':
        return { ...baseConfig, db: 2 };
      case 'stream':
        return { ...baseConfig, db: 3 };
      default:
        return baseConfig;
    }
  }

  /**
   * Get Redis client for specific purpose
   */
  getClient(purpose = 'default') {
    if (!this.clients[purpose]) {
      this.clients[purpose] = new Redis(this.getRedisConfig(purpose));
      
      // Set up error handling
      this.clients[purpose].on('error', (err) => {
        console.error(`Redis ${purpose} client error:`, err);
      });
    }
    
    return this.clients[purpose];
  }

  /**
   * Close all Redis connections
   */
  async closeAll() {
    const closePromises = Object.values(this.clients).map(client => client.quit());
    await Promise.all(closePromises);
    this.clients = {};
  }

  /**
   * Get cache client wrapper
   */
  getCache() {
    return this.nutritionCache;
  }

  /**
   * Get user activity tracker
   */
  getUserActivity() {
    return this.userActivity;
  }

  /**
   * Get session store
   */
  getSessionStore() {
    return this.sessionStore;
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const client = this.getClient();
      const ping = await client.ping();
      return ping === 'PONG';
    } catch (err) {
      console.error('Redis health check failed:', err);
      return false;
    }
  }
}

module.exports = RedisClient;