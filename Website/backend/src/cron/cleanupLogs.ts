import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';

/**
 * Cleanup job that runs every day at 1:00 AM to delete log files
 * that are older than 15 days
 */
export function startLogCleanupJob() {
  logger.info('Starting log cleanup job');
  
  // Schedule job to run every day at 1:00 AM
  cron.schedule('0 1 * * *', async () => {
    try {
      logger.info('Running cleanup job for old log files...');
      
      const logsDir = path.join(__dirname, '../../logs');
      const currentDate = new Date();
      const maxAge = 15 * 24 * 60 * 60 * 1000; // 15 days in milliseconds
      
      // Read all files in the logs directory
      const files = fs.readdirSync(logsDir);
      let deletedCount = 0;
      
      for (const file of files) {
        // Skip non-log files
        if (!file.endsWith('.log')) continue;
        
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);
        const fileAge = currentDate.getTime() - stats.mtime.getTime();
        
        // Delete files older than maxAge
        if (fileAge > maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
      
      logger.info(`Deleted ${deletedCount} old log files`);
    } catch (error) {
      logger.error('Error in log cleanup job:', { error: (error as Error).message, stack: (error as Error).stack });
    }
  });
}