import 'reflect-metadata';
import { DataSource, QueryRunner } from 'typeorm';
import { createClient, RedisClientType } from 'redis';
import { EventEmitter } from 'events';
import logger from '../utils/logger';

const POSTGRES_URL = process.env.POSTGRES_URL;
const REDIS_URL = process.env.REDIS_URL;

// Database connection events
export const dbEvents = new EventEmitter();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: POSTGRES_URL,
  synchronize: false, // Never use synchronize in production
  logging: process.env.NODE_ENV === 'development',
  entities: [__dirname + '/models/*.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  subscribers: [__dirname + '/subscribers/*.{ts,js}'],
  schema: 'vitatrack',
  // Enhanced connection pool settings
  poolSize: 10,
  connectTimeoutMS: 10000,
  maxQueryExecutionTime: 5000, // Log queries taking longer than 5 seconds
  extra: {
    // Statement timeout (in milliseconds)
    max_statement_timeout: 30000,
    // Connection timeout (in milliseconds)
    connectionTimeoutMillis: 10000,
    // Idle timeout (in milliseconds)
    idleTimeoutMillis: 60000,
  },
});

export const redisClient: RedisClientType = createClient({
  url: REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      // Exponential backoff with max delay of 10 seconds
      const delay = Math.min(Math.pow(2, retries) * 100, 10000);
      return delay;
    },
  },
});

// Connection monitoring
export let isDbHealthy = false;
export let isRedisHealthy = false;

// Database connection status events
redisClient.on('connect', () => {
  logger.info('Redis client connected');
  isRedisHealthy = true;
  dbEvents.emit('redis:connected');
});

redisClient.on('error', (err) => {
  logger.error('Redis client error:', { error: (err as Error).message });
  isRedisHealthy = false;
  dbEvents.emit('redis:error', err);
});

// Transaction management helper
export async function withTransaction<T>(callback: (queryRunner: QueryRunner) => Promise<T>): Promise<T> {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  
  try {
    const result = await callback(queryRunner);
    await queryRunner.commitTransaction();
    return result;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}

export async function connectDatabase() {
  let retries = 5;
  while (retries) {
    try {
      await AppDataSource.initialize();
      isDbHealthy = true;
      dbEvents.emit('postgres:connected');
      
      await redisClient.connect();
      logger.info('Connected to PostgreSQL and Redis');
      break;
    } catch (err) {
      logger.error('DB/Redis connection failed, retrying...', { error: (err as Error).message });
      retries -= 1;
      await new Promise(res => setTimeout(res, 5000));
    }
  }
  if (!retries) {
    const error = new Error('Could not connect to DB/Redis');
    dbEvents.emit('connection:failed', error);
    throw error;
  }
}

export async function healthCheck() {
  try {
    if (!isDbHealthy || !isRedisHealthy) {
      return false;
    }
    
    // Check PostgreSQL connection
    await AppDataSource.query('SELECT 1');
    
    // Check Redis connection
    await redisClient.ping();
    
    return true;
  } catch (error) {
    logger.error('Health check failed:', { error: (error as Error).message });
    return false;
  }
}

// Graceful shutdown helper
export async function closeConnections() {
  try {
    // Helper to add timeout to a promise
    const withTimeout = (promise: Promise<any>, ms: number, name: string) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`${name} close timed out after ${ms}ms`)), ms))
      ]);
    };
    if (AppDataSource.isInitialized) {
      logger.info('Closing Postgres connection...');
      try {
        await withTimeout(AppDataSource.destroy(), 5000, 'Postgres');
        logger.info('Postgres connection closed');
      } catch (err) {
        logger.warn('Postgres close failed or timed out:', { error: (err as Error).message });
      }
    }
    if (redisClient.isOpen) {
      logger.info('Closing Redis connection...');
      try {
        await withTimeout(redisClient.quit(), 5000, 'Redis');
        logger.info('Redis connection closed');
      } catch (err) {
        logger.warn('Redis close failed or timed out:', { error: (err as Error).message });
      }
    }
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database connections:', { error: (error as Error).message });
    throw error;
  }
}

// TEST ONLY: Setter for health flags
export function __setHealthFlags(db: boolean, redis: boolean) {
  isDbHealthy = db;
  isRedisHealthy = redis;
}