import 'dotenv/config';
import app from './app';
import { connectDatabase, closeConnections } from './database/connection';
import { connectMongoDB, closeMongoConnection } from './database/mongodb';
import logger from './utils/logger';
import { startLogCleanupJob } from './cron/cleanupLogs';
import { initSecurity } from './security';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to databases
    await connectDatabase();
    await connectMongoDB();
    
    // Initialize security features
    await initSecurity();
    
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });

    // Start log cleanup job
    startLogCleanupJob();

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      logger.info('Closing HTTP server...');
      server.close(async () => {
        logger.info('HTTP server closed');
        logger.info('Closing database connections...');
        await closeConnections();
        logger.info('Closing MongoDB connection...');
        await closeMongoConnection();
        logger.info('All connections closed. Exiting process.');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      logger.info('Closing HTTP server...');
      server.close(async () => {
        logger.info('HTTP server closed');
        logger.info('Closing database connections...');
        await closeConnections();
        logger.info('Closing MongoDB connection...');
        await closeMongoConnection();
        logger.info('All connections closed. Exiting process.');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: (error as Error).message, stack: (error as Error).stack });
    process.exit(1);
  }
}

startServer();