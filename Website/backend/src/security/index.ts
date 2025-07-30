import { initRedisClient } from './rate-limiting';
import { getConfig } from '../config';
import logger from '../utils/logger';

// Export all security modules
export * from './rate-limiting';
export * from './security-middleware';
export * from './threat-detection';
export * from './vulnerability-scan';

// Initialize security features
export async function initSecurity() {
  try {
    // Initialize Redis for rate limiting if configured
    const redisInitialized = await initRedisClient();
    if (redisInitialized) {
      logger.info('Redis initialized for rate limiting');
    } else {
      logger.info('Using in-memory store for rate limiting');
    }
    
    // Get security config
    const { security } = getConfig();
    
    // Schedule vulnerability scans if enabled
    if (security.vulnerabilityScan.enabled) {
      // Import dynamically to avoid circular dependencies
      const { scheduleDependencyScan, scheduleCodeScan, scheduleConfigScan } = 
        await import('./vulnerability-scan');
      
      // Schedule scans based on configured intervals
      scheduleDependencyScan(security.vulnerabilityScan.dependencyScanInterval);
      scheduleCodeScan(security.vulnerabilityScan.codeScanInterval);
      scheduleConfigScan(security.vulnerabilityScan.configScanInterval);
      
      logger.info('Vulnerability scanning scheduled');
    }
    
    return true;
  } catch (error) {
    logger.error('Failed to initialize security features:', error);
    return false;
  }
}