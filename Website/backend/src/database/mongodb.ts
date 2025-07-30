import mongoose from 'mongoose';
import { EventEmitter } from 'events';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vitatrack';

// MongoDB connection events
export const mongoEvents = new EventEmitter();

// Connection state
let isMongoHealthy = false;

// Connect to MongoDB
export async function connectMongoDB() {
  let retries = 5;
  while (retries) {
    try {
      await mongoose.connect(MONGODB_URI);
      
      console.log('Connected to MongoDB');
      isMongoHealthy = true;
      mongoEvents.emit('mongodb:connected');
      break;
    } catch (err) {
      console.error('MongoDB connection failed, retrying...', err);
      retries -= 1;
      await new Promise(res => setTimeout(res, 5000));
    }
  }
  
  if (!retries) {
    const error = new Error('Could not connect to MongoDB');
    mongoEvents.emit('mongodb:connection:failed', error);
    throw error;
  }
}

// MongoDB health check
export async function mongoHealthCheck() {
  try {
    if (!isMongoHealthy) {
      return false;
    }
    
    if (!mongoose.connection.db) {
      return false;
    }
    
    // Check MongoDB connection
    await mongoose.connection.db.admin().ping();
    return true;
  } catch (error) {
    console.error('MongoDB health check failed:', error);
    return false;
  }
}

// Graceful shutdown helper
export async function closeMongoConnection() {
  try {
    // Helper to add timeout to a promise
    const withTimeout = (promise: Promise<any>, ms: number, name: string) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`${name} close timed out after ${ms}ms`)), ms))
      ]);
    };
    if (mongoose.connection.readyState !== 0) {
      console.log('Closing MongoDB connection...');
      try {
        await withTimeout(mongoose.connection.close(), 5000, 'MongoDB');
        console.log('MongoDB connection closed');
      } catch (err) {
        console.warn('MongoDB close failed or timed out:', err);
      }
    }
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    throw error;
  }
}