# VitaTrack Redis Caching Strategies

## Overview

This document outlines the caching strategies implemented in VitaTrack using Redis. Proper caching improves application performance, reduces database load, and enhances user experience.

## Cache Categories

### 1. User Profile Cache

- **Key Pattern**: `user:{userId}:profile`
- **TTL**: 30 minutes
- **Data Structure**: Hash
- **Content**: Basic user information (name, email, preferences)
- **Invalidation**: On profile update

### 2. Session Storage

- **Key Pattern**: `session:{sessionId}`
- **TTL**: 24 hours (extended on activity)
- **Data Structure**: Hash
- **Content**: User session data, authentication tokens
- **Invalidation**: On logout or session expiry

### 3. Food Database Cache

- **Key Pattern**: `food:{foodId}` and `food:search:{query}`
- **TTL**: 7 days for food items, 1 hour for search results
- **Data Structure**: Hash for items, Sorted Set for search results
- **Content**: Nutritional information, search results
- **Invalidation**: On food database updates

### 4. Exercise Data Cache

- **Key Pattern**: `exercise:{exerciseId}` and `exercise:category:{categoryId}`
- **TTL**: 7 days
- **Data Structure**: Hash for exercises, Sets for categories
- **Content**: Exercise details, calorie burn rates
- **Invalidation**: On exercise database updates

### 5. User Activity Cache

- **Key Pattern**: `user:{userId}:activity:recent`
- **TTL**: 1 day
- **Data Structure**: Sorted Set
- **Content**: Recent user activities with timestamps
- **Invalidation**: Automatic expiry

### 6. Nutrition Calculation Cache

- **Key Pattern**: `nutrition:calc:{inputHash}`
- **TTL**: 7 days
- **Data Structure**: Hash
- **Content**: Pre-calculated nutrition values
- **Invalidation**: On calculation algorithm updates

### 7. Recommendation Cache

- **Key Pattern**: `user:{userId}:recommendations:{type}`
- **TTL**: 12 hours
- **Data Structure**: List
- **Content**: AI-generated recommendations
- **Invalidation**: On new recommendations generation

## Cache Invalidation Patterns

### 1. Time-Based Expiration (TTL)

Default strategy using Redis TTL for automatic expiration.

### 2. Event-Based Invalidation

Manually invalidate cache entries when underlying data changes:

```javascript
// Example: Invalidate user profile cache on update
async function updateUserProfile(userId, profileData) {
  // Update database
  await db.users.update(userId, profileData);
  
  // Invalidate cache
  await redisClient.del(`user:${userId}:profile`);
}

```

### 3. Bulk Invalidation

```javascript
// Example: Invalidate all exercise caches
async function updateExerciseDatabase() {
  // Update database
  await db.exercises.bulkUpdate(newData);
  
  // Get all exercise cache keys
  const keys = await redisClient.keys('exercise:*');
  
  // Delete all matching keys
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
}
```

### 4. Soft Invalidation

```javascript
// Example: Update food item cache
async function updateFoodItem(foodId, newData) {
  // Update database
  await db.foods.update(foodId, newData);
  
  // Update cache
  await redisClient.hmset(`food:${foodId}`, newData);
}
```

## Redis Streams for Real-time Notifications
### Stream Configuration
- Stream Name : vitatrack:notifications
- Consumer Groups : mobile-app , web-app , admin-panel
### Example Usage

```javascript
// Publishing to stream
async function publishNotification(userId, notification) {
  await redisClient.xadd(
    'vitatrack:notifications', 
    '*',  // Auto-generate ID
    'userId', userId,
    'type', notification.type,
    'message', notification.message,
    'timestamp', Date.now()
  );
}

// Consuming from stream
async function consumeNotifications(consumerGroup, consumerId) {
  // Create consumer group if not exists
  try {
    await redisClient.xgroup('CREATE', 'vitatrack:notifications', consumerGroup, '$', 'MKSTREAM');
  } catch (err) {
    // Group may already exist
  }
  
  // Read new messages
  const messages = await redisClient.xreadgroup(
    'GROUP', consumerGroup, consumerId,
    'COUNT', 10,
    'BLOCK', 2000,
    'STREAMS', 'vitatrack:notifications', '>'
  );
  
  // Process messages
  // ...
  
  // Acknowledge processed messages
  for (const msg of processedMsgIds) {
    await redisClient.xack('vitatrack:notifications', consumerGroup, msg);
  }
}
```


## 4. Redis Monitoring Configuration

```conf:f%3A%5CAditya%5C%F0%9F%8C%BF%20VitaTrack%5CWebsite%5Cdatabase%5Credis%5Cmonitoring.conf
# VitaTrack Redis Monitoring Configuration

# Redis Exporter for Prometheus
# Install: https://github.com/oliver006/redis_exporter

# Redis Exporter Configuration
REDIS_EXPORTER_OPTS="--redis.addr=redis://localhost:6379 --redis.password=${REDIS_PASSWORD}"

# Prometheus Configuration Snippet for Redis
# Add to prometheus.yml
#
# scrape_configs:
#   - job_name: 'redis'
#     static_configs:
#       - targets: ['localhost:9121']

# Grafana Dashboard for Redis
# Import dashboard ID: 763

# Redis INFO Command Schedule
INFO_SCHEDULE="*/5 * * * *"

# Redis SLOWLOG Configuration
SLOWLOG_SCHEDULE="*/10 * * * *"

# Memory Analysis Schedule
MEMORY_SCHEDULE="0 */1 * * *"

# Alert Thresholds
MEMORY_USAGE_THRESHOLD=80  # Percentage
CONNECTION_THRESHOLD=1000  # Number of connections
COMMAND_THRESHOLD=10000    # Commands per second

# Sample Monitoring Script
# /usr/local/bin/redis-monitor.sh
#
# #!/bin/bash
# 
# REDIS_CLI="redis-cli -a ${REDIS_PASSWORD}"
# 
# # Get Redis INFO
# $REDIS_CLI INFO > /var/log/redis/info_$(date +%Y%m%d%H%M%S).log
# 
# # Get SLOWLOG
# $REDIS_CLI SLOWLOG GET 100 > /var/log/redis/slowlog_$(date +%Y%m%d%H%M%S).log
# 
# # Memory Analysis
# $REDIS_CLI MEMORY STATS > /var/log/redis/memory_$(date +%Y%m%d%H%M%S).log
# 
# # Check for alerts
# MEMORY_USED=$(echo "$(redis-cli INFO | grep used_memory_rss_human | cut -d ':' -f2 | sed 's/[^0-9.]//g')")
# MEMORY_TOTAL=$(echo "$(redis-cli CONFIG GET maxmemory | tail -n 1 | awk '{print $1/1024/1024/1024}')")
# MEMORY_PERCENT=$(echo "scale=2; $MEMORY_USED/$MEMORY_TOTAL*100" | bc)
# 
# if (( $(echo "$MEMORY_PERCENT > $MEMORY_USAGE_THRESHOLD" | bc -l) )); then
#   echo "ALERT: Redis memory usage at ${MEMORY_PERCENT}%" | mail -s "Redis Memory Alert" admin@vitatrack.com
# fi