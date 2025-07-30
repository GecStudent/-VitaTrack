import cron from 'node-cron';
import { AppDataSource } from '../database/connection';
// import { User } from '../database/models/User';
import { AuditLogger } from '../utils/auditLogger';

/**
 * Cleanup job that runs every day at midnight to delete unverified users
 * that are older than 24 hours
 */
export function startCleanupJob() {
  console.log('Starting unverified users cleanup job');
  
  // Schedule job to run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('Running cleanup job for unverified users...');
      
      // Execute the SQL query to delete unverified users older than 24 hours
      const result = await AppDataSource.query(`
        DELETE FROM users 
        WHERE "emailVerified" = false 
          AND "created_at" < NOW() - INTERVAL '24 hours';
      `);
      
      // Log the deletion
      AuditLogger.log('unverified_users_deleted', {
        count: result[1] || 0,
        timestamp: new Date().toISOString()
      });
      
      console.log(`Deleted ${result[1] || 0} unverified users`);
    } catch (error) {
      console.error('Error in cleanup job:', error);
      AuditLogger.log('cleanup_job_error', {
        error: (error as Error).message,
        stack: (error as Error).stack
      });
    }
  });
}