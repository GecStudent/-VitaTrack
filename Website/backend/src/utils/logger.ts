import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
import { getConfig } from '../config';

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const { env } = getConfig();
const isDevelopment = env === 'development';

// Define log format
const logFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  // Format timestamp to YYYY-MM-DD HH:mm:ss
  const formattedTimestamp = new Date(typeof timestamp === 'string' || typeof timestamp === 'number' || timestamp instanceof Date ? timestamp : Date.now()).toISOString().replace(/T/, ' ').replace(/\..+/, '');
  
  let msg = `[${formattedTimestamp}] [${level.toUpperCase()}] ${message}`;
  
  // Add metadata if it exists and is not empty
  if (metadata && Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  return msg;
});

// Create file transports with daily rotation
const fileTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, '%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '15d', // Keep logs for 15 days
  format: winston.format.combine(
    winston.format.timestamp(),
    logFormat
  )
});

// Create error-specific transport
const errorFileTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxFiles: '15d', // Keep logs for 15 days
  format: winston.format.combine(
    winston.format.timestamp(),
    logFormat
  )
});

// Console transport for development
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    logFormat
  )
});

// Create the logger
const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  levels: winston.config.npm.levels,
  transports: [
    fileTransport,
    errorFileTransport
  ]
});

// Add console transport in development
if (isDevelopment) {
  logger.add(consoleTransport);
}

// Handle transport errors
fileTransport.on('error', (error) => {
  console.error('Error in file transport:', error);
});

errorFileTransport.on('error', (error) => {
  console.error('Error in error file transport:', error);
});

// Export the logger
export default logger;