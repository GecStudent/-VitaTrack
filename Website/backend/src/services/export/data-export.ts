import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import UserRepository from '../../database/repositories/UserRepository';
import MealLogRepository from '../../database/repositories/MealLogRepository';
import ExerciseLogRepository from '../../database/repositories/ExerciseLogRepository';
import WaterLogRepository from '../../database/repositories/WaterLogRepository';
import SleepLogRepository from '../../database/repositories/SleepLogRepository';
import WeightLogRepository from '../../database/repositories/WeightLogRepository';
import GoalRepository from '../../database/repositories/GoalRepository';
import { AuditLogger } from '../../utils/auditLogger';
import { minimizeData } from '../../api/auth/gdpr';
import { createPdf } from './file-generation';
import { getAnonymizedData } from './gdpr-compliance';
import { ExportFormat, ExportOptions, ExportStatus, ExportRequest } from './types';
import { getConfig } from '../../config';

// Ensure exports directory exists
const config = getConfig();
const exportsDir = path.join(__dirname, '../../../', config.export.storagePath);
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
}

// In-memory store for export requests (in production, use a database)
const exportRequests = new Map<string, ExportRequest>();

/**
 * Initiate a data export request
 * @param userId User ID
 * @param options Export options
 * @returns Export request details
 */
export async function initiateExport(
  userId: string,
  options: ExportOptions
): Promise<{ requestId: string; status: ExportStatus }> {
  // Generate a unique request ID
  const requestId = uuidv4();
  
  // Create export request
  const request: ExportRequest = {
    userId,
    requestId,
    options,
    status: 'pending',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + config.export.fileExpiryDays * 24 * 60 * 60 * 1000), // Use config value
    progress: 0,
    filePath: null
  };
  
  // Store the request
  exportRequests.set(requestId, request);
  
  // Log the export request
  AuditLogger.log('data_export_requested', {
    userId,
    requestId,
    options,
    timestamp: new Date()
  });
  
  // Start the export process in the background
  setTimeout(() => {
    processExport(userId, requestId, options);
  }, 100);
  
  return {
    requestId,
    status: 'pending'
  };
}

/**
 * Get the status of an export request
 * @param requestId Export request ID
 * @returns Export status details
 */
export function getExportStatus(requestId: string): ExportRequest | null {
  return exportRequests.get(requestId) || null;
}

/**
 * Process an export request
 * @param userId User ID
 * @param requestId Export request ID
 * @param options Export options
 */
async function processExport(
  userId: string,
  requestId: string,
  options: ExportOptions
): Promise<void> {
  try {
    // Update status to processing
    const request = exportRequests.get(requestId);
    if (!request) {
      throw new Error('Export request not found');
    }
    
    request.status = 'processing';
    request.progress = 10;
    exportRequests.set(requestId, request);
    
    // Gather user data
    const userData = await gatherUserData(userId, options);
    request.progress = 50;
    exportRequests.set(requestId, request);
    
    // Apply anonymization if requested
    const finalData = options.anonymize ? 
      await getAnonymizedData(userData) : 
      userData;
    
    request.progress = 70;
    exportRequests.set(requestId, request);
    
    // Generate the export file
    const filePath = await generateExportFile(finalData, options.format, userId, requestId);
    
    // Update request with file path and completed status
    request.status = 'completed';
    request.progress = 100;
    request.filePath = filePath;
    exportRequests.set(requestId, request);
    
    // Log the export completion
    AuditLogger.log('data_export_completed', {
      userId,
      requestId,
      format: options.format,
      timestamp: new Date()
    });
  } catch (error) {
    // Update status to failed
    const request = exportRequests.get(requestId);
    if (request) {
      request.status = 'failed';
      request.error = (error as Error).message;
      exportRequests.set(requestId, request);
    }
    
    AuditLogger.logError('data_export_processing_error', { 
      userId, 
      requestId, 
      error 
    });
  }
}

/**
 * Gather user data based on export options
 * @param userId User ID
 * @param options Export options
 * @returns User data
 */
async function gatherUserData(userId: string, options: ExportOptions): Promise<any> {
  // Get user profile
  const user = await UserRepository.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Remove sensitive data
  const safeUser = minimizeData(user);
  
  // Initialize data object
  const data: any = {
    profile: safeUser,
    exportDate: new Date().toISOString(),
    exportOptions: options
  };
  
  // Add selected data types based on options
  if (options.includeData.includes('goals')) {
    data.goals = await GoalRepository.findByUserId(userId);
  }
  
  if (options.includeData.includes('weight')) {
    data.weightLogs = await WeightLogRepository.findByUserId(userId);
  }
  
  if (options.includeData.includes('meals')) {
    data.mealLogs = await MealLogRepository.findByUserId(userId);
  }
  
  if (options.includeData.includes('exercise')) {
    data.exerciseLogs = await ExerciseLogRepository.findByUserId(userId);
  }
  
  if (options.includeData.includes('water')) {
    data.waterLogs = await WaterLogRepository.findByUserId(userId);
  }
  
  if (options.includeData.includes('sleep')) {
    data.sleepLogs = await SleepLogRepository.findByUserId(userId);
  }
  
  // Apply date filtering if specified
  if (options.dateRange) {
    const { startDate, endDate } = options.dateRange;
    
    // Filter each data type by date range
    Object.keys(data).forEach(key => {
      if (Array.isArray(data[key])) {
        data[key] = data[key].filter((item: any) => {
          const itemDate = new Date(item.date || item.created_at);
          return itemDate >= startDate && itemDate <= endDate;
        });
      }
    });
  }
  
  return data;
}

/**
 * Generate export file in the specified format
 * @param data Data to export
 * @param format Export format
 * @param userId User ID
 * @param requestId Export request ID
 * @returns Path to the generated file
 */
async function generateExportFile(
  data: any,
  format: ExportFormat,
  userId: string,
  requestId: string
): Promise<string> {
  const fileName = `${userId}-${requestId}.${format}`;
  const filePath = path.join(exportsDir, fileName);
  
  switch (format) {
    case 'json':
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      break;
      
    case 'csv':
      const csvContent = convertToCSV(data);
      fs.writeFileSync(filePath, csvContent);
      break;
      
    case 'pdf':
      await createPdf(data, filePath);
      break;
      
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
  
  return filePath;
}

/**
 * Convert data to CSV format
 * @param data Data to convert
 * @returns CSV content
 */
function convertToCSV(data: any): string {
  // This is a simplified implementation
  // In a real application, you would use a CSV library
  
  let csvContent = '';
  
  // Handle user profile
  if (data.profile) {
    csvContent += 'USER PROFILE\n';
    csvContent += Object.keys(data.profile).join(',') + '\n';
    csvContent += Object.values(data.profile).map(v => `"${v}"`).join(',') + '\n\n';
  }
  
  // Handle each data type
  ['goals', 'weightLogs', 'mealLogs', 'exerciseLogs', 'waterLogs', 'sleepLogs'].forEach(type => {
    if (data[type] && data[type].length > 0) {
      csvContent += `${type.toUpperCase()}\n`;
      
      // Headers
      csvContent += Object.keys(data[type][0]).join(',') + '\n';
      
      // Data rows
      data[type].forEach((item: any) => {
        csvContent += Object.values(item).map(v => `"${v}"`).join(',') + '\n';
      });
      
      csvContent += '\n';
    }
  });
  
  return csvContent;
}

/**
 * Schedule a recurring export
 * @param userId User ID
 * @param options Export options
 * @param schedule Schedule options
 * @returns Schedule ID
 */
export function scheduleExport(
  userId: string,
  options: ExportOptions,
  schedule: { frequency: 'daily' | 'weekly' | 'monthly', startDate: Date }
): string {
  // Generate a schedule ID
  const scheduleId = uuidv4();
  
  // In a real implementation, this would create a scheduled job
  // For now, we'll just log it
  AuditLogger.log('data_export_scheduled', {
    userId,
    scheduleId,
    options,
    schedule,
    timestamp: new Date()
  });
  
  return scheduleId;
}

/**
 * Delete an export file
 * @param requestId Export request ID
 * @returns Success status
 */
export function deleteExportFile(requestId: string): boolean {
  const request = exportRequests.get(requestId);
  if (!request || !request.filePath) {
    return false;
  }
  
  try {
    // Delete the file
    fs.unlinkSync(request.filePath);
    
    // Update the request
    request.status = 'deleted';
    request.filePath = null;
    exportRequests.set(requestId, request);
    
    // Log the deletion
    AuditLogger.log('data_export_deleted', {
      userId: request.userId,
      requestId,
      timestamp: new Date()
    });
    
    return true;
  } catch (error) {
    AuditLogger.logError('data_export_deletion_error', { 
      requestId, 
      error 
    });
    return false;
  }
}

/**
 * Bulk export data for research purposes
 * @param userIds Array of user IDs
 * @param options Export options
 * @returns Export request details
 */
export async function bulkExport(
  userIds: string[],
  options: ExportOptions
): Promise<{ requestId: string; status: ExportStatus }> {
  // Generate a unique request ID
  const requestId = uuidv4();
  
  // Create export request
  const request: ExportRequest = {
    userId: 'bulk-export',
    requestId,
    options,
    status: 'pending',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    progress: 0,
    filePath: null,
    userIds
  };
  
  // Store the request
  exportRequests.set(requestId, request);
  
  // Log the bulk export request
  AuditLogger.log('bulk_data_export_requested', {
    userIds,
    requestId,
    options,
    timestamp: new Date()
  });
  
  // Start the export process in the background
  setTimeout(() => {
    processBulkExport(userIds, requestId, options);
  }, 100);
  
  return {
    requestId,
    status: 'pending'
  };
}

/**
 * Process a bulk export request
 * @param userIds Array of user IDs
 * @param requestId Export request ID
 * @param options Export options
 */
async function processBulkExport(
  userIds: string[],
  requestId: string,
  options: ExportOptions
): Promise<void> {
  try {
    // Update status to processing
    const request = exportRequests.get(requestId);
    if (!request) {
      throw new Error('Export request not found');
    }
    
    request.status = 'processing';
    request.progress = 10;
    exportRequests.set(requestId, request);
    
    // Gather data for each user
    const allData: any[] = [];
    let processedUsers = 0;
    
    for (const userId of userIds) {
      try {
        const userData = await gatherUserData(userId, options);
        
        // Apply anonymization if requested
        const finalData = options.anonymize ? 
          await getAnonymizedData(userData) : 
          userData;
        
        allData.push(finalData);
      } catch (error) {
        // Log error but continue with other users
        AuditLogger.logError('bulk_export_user_error', { 
          userId, 
          requestId, 
          error 
        });
      }
      
      // Update progress
      processedUsers++;
      request.progress = Math.floor((processedUsers / userIds.length) * 80) + 10;
      exportRequests.set(requestId, request);
    }
    
    // Generate the export file
    const fileName = `bulk-export-${requestId}.${options.format}`;
    const filePath = path.join(exportsDir, fileName);
    
    switch (options.format) {
      case 'json':
        fs.writeFileSync(filePath, JSON.stringify(allData, null, 2));
        break;
        
      case 'csv':
        const csvContent = allData.map(data => convertToCSV(data)).join('\n---NEW USER---\n\n');
        fs.writeFileSync(filePath, csvContent);
        break;
        
      case 'pdf':
        await createPdf({ bulkData: allData }, filePath);
        break;
        
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
    
    // Update request with file path and completed status
    request.status = 'completed';
    request.progress = 100;
    request.filePath = filePath;
    exportRequests.set(requestId, request);
    
    // Log the export completion
    AuditLogger.log('bulk_data_export_completed', {
      userCount: userIds.length,
      requestId,
      format: options.format,
      timestamp: new Date()
    });
  } catch (error) {
    // Update status to failed
    const request = exportRequests.get(requestId);
    if (request) {
      request.status = 'failed';
      request.error = (error as Error).message;
      exportRequests.set(requestId, request);
    }
    
    AuditLogger.logError('bulk_data_export_processing_error', { 
      requestId, 
      error 
    });
  }
}