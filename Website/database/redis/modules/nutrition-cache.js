/**
 * VitaTrack Nutrition Calculations Cache Module
 * 
 * This module provides Redis-based caching for expensive nutrition calculations
 */

const Redis = require('ioredis');
const crypto = require('crypto');

class NutritionCache {
  constructor(config) {
    this.redis = new Redis(config.redis);
    this.ttl = config.ttl || 604800; // 7 days default
    this.prefix = 'nutrition:calc:';
  }

  /**
   * Generate a unique hash for the input parameters
   */
  generateHash(params) {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(params));
    return hash.digest('hex');
  }

  /**
   * Get cached calculation result
   */
  async getCached(params) {
    const hash = this.generateHash(params);
    const key = `${this.prefix}${hash}`;
    
    const cached = await this.redis.hgetall(key);
    if (Object.keys(cached).length === 0) {
      return null;
    }
    
    return cached;
  }

  /**
   * Store calculation result in cache
   */
  async storeCalculation(params, result) {
    const hash = this.generateHash(params);
    const key = `${this.prefix}${hash}`;
    
    // Store as hash
    await this.redis.hmset(key, result);
    await this.redis.expire(key, this.ttl);
    
    return true;
  }

  /**
   * Calculate or retrieve from cache
   */
  async getCalculation(params, calculationFn) {
    // Try to get from cache first
    const cached = await this.getCached(params);
    if (cached) {
      return cached;
    }
    
    // Calculate if not in cache
    const result = await calculationFn(params);
    
    // Store in cache
    await this.storeCalculation(params, result);
    
    return result;
  }

  /**
   * Invalidate specific calculation
   */
  async invalidateCalculation(params) {
    const hash = this.generateHash(params);
    const key = `${this.prefix}${hash}`;
    
    await this.redis.del(key);
  }

  /**
   * Invalidate all nutrition calculations
   */
  async invalidateAll() {
    const keys = await this.redis.keys(`${this.prefix}*`);
    if (keys.length > 0) {
      await this.redis.del(keys);
    }
  }
}

module.exports = NutritionCache;