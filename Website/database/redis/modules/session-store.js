/**
 * VitaTrack Redis Session Store
 * 
 * This module provides Redis-based session management
 */

const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');

class SessionStore {
  constructor(config) {
    this.redis = new Redis(config.redis);
    this.prefix = 'session:';
    this.ttl = config.ttl || 86400; // 24 hours default
  }

  /**
   * Create a new session
   */
  async createSession(userData) {
    const sessionId = uuidv4();
    const key = `${this.prefix}${sessionId}`;
    
    const sessionData = {
      userId: userData.id,
      username: userData.username,
      email: userData.email,
      roles: JSON.stringify(userData.roles || []),
      created: Date.now(),
      lastActive: Date.now()
    };
    
    await this.redis.hmset(key, sessionData);
    await this.redis.expire(key, this.ttl);
    
    // Add to user's sessions set
    await this.redis.sadd(`user:${userData.id}:sessions`, sessionId);
    
    return { sessionId, ...sessionData };
  }

  /**
   * Get session data
   */
  async getSession(sessionId) {
    const key = `${this.prefix}${sessionId}`;
    
    const session = await this.redis.hgetall(key);
    if (Object.keys(session).length === 0) {
      return null;
    }
    
    // Parse JSON fields
    if (session.roles) {
      session.roles = JSON.parse(session.roles);
    }
    
    return session;
  }

  /**
   * Update session last activity time
   */
  async touchSession(sessionId) {
    const key = `${this.prefix}${sessionId}`;
    
    const exists = await this.redis.exists(key);
    if (!exists) {
      return false;
    }
    
    await this.redis.hset(key, 'lastActive', Date.now());
    await this.redis.expire(key, this.ttl);
    
    return true;
  }

  /**
   * Destroy a session
   */
  async destroySession(sessionId) {
    const key = `${this.prefix}${sessionId}`;
    
    // Get user ID before deleting session
    const userId = await this.redis.hget(key, 'userId');
    
    if (userId) {
      // Remove from user's sessions set
      await this.redis.srem(`user:${userId}:sessions`, sessionId);
    }
    
    await this.redis.del(key);
    
    return true;
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId) {
    const sessionIds = await this.redis.smembers(`user:${userId}:sessions`);
    
    const sessions = [];
    for (const sessionId of sessionIds) {
      const session = await this.getSession(sessionId);
      if (session) {
        sessions.push({ sessionId, ...session });
      }
    }
    
    return sessions;
  }

  /**
   * Destroy all sessions for a user
   */
  async destroyUserSessions(userId) {
    const sessionIds = await this.redis.smembers(`user:${userId}:sessions`);
    
    for (const sessionId of sessionIds) {
      await this.destroySession(sessionId);
    }
    
    return sessionIds.length;
  }
}

module.exports = SessionStore;