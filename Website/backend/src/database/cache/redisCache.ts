import { redisClient } from '../connection';

/**
 * Set a value in the Redis cache
 * @param key Cache key
 * @param value Value to cache
 * @param ttl Time to live in seconds (default: 1 hour)
 */
export async function setCache(key: string, value: any, ttl = 3600) {
  await redisClient.set(key, JSON.stringify(value), { EX: ttl });
}

/**
 * Get a value from the Redis cache
 * @param key Cache key
 * @returns Parsed value or null if not found
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
}

/**
 * Delete a value from the Redis cache
 * @param key Cache key
 */
export async function deleteCache(key: string): Promise<void> {
  await redisClient.del(key);
}

/**
 * Delete multiple values from the Redis cache using a pattern
 * @param pattern Key pattern to match
 */
export async function deleteCacheByPattern(pattern: string): Promise<void> {
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
}

/**
 * Set a hash field in the Redis cache
 * @param key Cache key
 * @param field Hash field
 * @param value Value to cache
 * @param ttl Time to live in seconds (default: 1 hour)
 */
export async function setHashCache(key: string, field: string, value: any, ttl = 3600) {
  await redisClient.hSet(key, field, JSON.stringify(value));
  if (ttl > 0) {
    await redisClient.expire(key, ttl);
  }
}

/**
 * Get a hash field from the Redis cache
 * @param key Cache key
 * @param field Hash field
 * @returns Parsed value or null if not found
 */
export async function getHashCache<T>(key: string, field: string): Promise<T | null> {
  const data = await redisClient.hGet(key, field);
  return data ? JSON.parse(data) : null;
}

/**
 * Get all hash fields from the Redis cache
 * @param key Cache key
 * @returns Object with all hash fields
 */
export async function getAllHashCache<T>(key: string): Promise<Record<string, T> | null> {
  const data = await redisClient.hGetAll(key);
  if (!data || Object.keys(data).length === 0) {
    return null;
  }
  
  const result: Record<string, T> = {};
  for (const [field, value] of Object.entries(data)) {
    result[field] = JSON.parse(value);
  }
  
  return result;
}