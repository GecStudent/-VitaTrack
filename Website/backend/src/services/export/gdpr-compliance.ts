import { v4 as uuidv4 } from 'uuid';
import { AuditLogger } from '../../utils/auditLogger';
import UserRepository from '../../database/repositories/UserRepository';
import MealLogRepository from '../../database/repositories/MealLogRepository';
import ExerciseLogRepository from '../../database/repositories/ExerciseLogRepository';
import WaterLogRepository from '../../database/repositories/WaterLogRepository';
import SleepLogRepository from '../../database/repositories/SleepLogRepository';
import WeightLogRepository from '../../database/repositories/WeightLogRepository';
import GoalRepository from '../../database/repositories/GoalRepository';

/**
 * Anonymize user data for GDPR compliance
 * @param data User data to anonymize
 * @returns Anonymized data
 */
export async function getAnonymizedData(data: any): Promise<any> {
  // Create a deep copy to avoid modifying the original data
  const anonymizedData = JSON.parse(JSON.stringify(data));
  
  // Anonymize user profile
  if (anonymizedData.profile) {
    anonymizedData.profile = anonymizeProfile(anonymizedData.profile);
  }
  
  // Anonymize each data type
  ['goals', 'weightLogs', 'mealLogs', 'exerciseLogs', 'waterLogs', 'sleepLogs'].forEach(type => {
    if (anonymizedData[type] && Array.isArray(anonymizedData[type])) {
      anonymizedData[type] = anonymizedData[type].map((item: any) => anonymizeItem(item, type));
    }
  });
  
  return anonymizedData;
}

/**
 * Anonymize user profile data
 * @param profile User profile data
 * @returns Anonymized profile
 */
function anonymizeProfile(profile: any): any {
  const anonymized = { ...profile };
  
  // Replace PII with anonymized values
  anonymized.id = uuidv4(); // Replace real ID with a random one
  anonymized.email = `anonymized-${anonymized.id.substring(0, 8)}@example.com`;
  anonymized.first_name = 'Anonymized';
  anonymized.last_name = 'User';
  
  // Keep non-identifying data
  // (age, gender, height, weight can be kept for research purposes)
  
  return anonymized;
}

/**
 * Anonymize a data item
 * @param item Data item
 * @param type Data type
 * @returns Anonymized item
 */
function anonymizeItem(item: any, type: string): any {
  const anonymized = { ...item };
  
  // Replace user ID with a random one
  if (anonymized.userId || anonymized.user_id) {
    anonymized.userId = anonymized.userId ? uuidv4() : undefined;
    anonymized.user_id = anonymized.user_id ? uuidv4() : undefined;
  }
  
  // Remove any other identifying information based on data type
  switch (type) {
    case 'mealLogs':
      // Remove custom notes that might contain personal information
      if (anonymized.notes) {
        anonymized.notes = '[Redacted]';
      }
      break;
      
    case 'exerciseLogs':
      // Remove location data if present
      if (anonymized.location) {
        anonymized.location = '[Redacted]';
      }
      break;
  }
  
  return anonymized;
}

/**
 * Handle data deletion request (GDPR right to be forgotten)
 * @param userId User ID
 * @param options Deletion options
 * @returns Success status
 */
export async function handleDataDeletion(
  userId: string,
  options: { 
    deleteAccount?: boolean; 
    deleteData?: string[];
  }
): Promise<boolean> {
  try {
    // Log the deletion request
    AuditLogger.log('data_deletion_requested', { 
      userId, 
      options,
      timestamp: new Date() 
    });
    
    // Delete specific data types if requested
    if (options.deleteData && options.deleteData.length > 0) {
      for (const dataType of options.deleteData) {
        switch (dataType) {
          case 'goals':
            await GoalRepository.deleteByUserId(userId);
            break;
            
          case 'weight':
            await WeightLogRepository.deleteByUserId(userId);
            break;
            
          case 'meals':
            await MealLogRepository.deleteByUserId(userId);
            break;
            
          case 'exercise':
            await ExerciseLogRepository.deleteByUserId(userId);
            break;
            
          case 'water':
            await WaterLogRepository.deleteByUserId(userId);
            break;
            
          case 'sleep':
            await SleepLogRepository.deleteByUserId(userId);
            break;
        }
      }
    }
    
    // Delete the entire account if requested
    if (options.deleteAccount) {
      // Delete all associated data first
      await GoalRepository.deleteByUserId(userId);
      await WeightLogRepository.deleteByUserId(userId);
      await MealLogRepository.deleteByUserId(userId);
      await ExerciseLogRepository.deleteByUserId(userId);
      await WaterLogRepository.deleteByUserId(userId);
      await SleepLogRepository.deleteByUserId(userId);
      
      // Finally, delete the user account
      await UserRepository.delete(userId);
    }
    
    // Log the deletion completion
    AuditLogger.log('data_deletion_completed', { 
      userId, 
      options,
      timestamp: new Date() 
    });
    
    return true;
  } catch (error) {
    AuditLogger.logError('data_deletion_error', { userId, options, error });
    return false;
  }
}

/**
 * Generate a data processing record for GDPR compliance
 * @param userId User ID
 * @param action Processing action
 * @param details Processing details
 * @returns Record ID
 */
export function recordDataProcessing(
  userId: string,
  action: 'export' | 'delete' | 'anonymize' | 'access',
  details: any
): string {
  const recordId = uuidv4();
  
  // Log the data processing record
  AuditLogger.log('data_processing_record', {
    recordId,
    userId,
    action,
    details,
    timestamp: new Date()
  });
  
  return recordId;
}

/**
 * Validate data processing consent
 * @param userId User ID
 * @param processingType Type of processing
 * @returns Whether consent is valid
 */
export async function validateConsent(
  userId: string,
  processingType: string
): Promise<boolean> {
  try {
    // In a real implementation, this would check a consents database
    // For now, we'll assume consent is valid
    
    // Log the consent validation
    AuditLogger.log('consent_validated', {
      userId,
      processingType,
      timestamp: new Date()
    });
    
    return true;
  } catch (error) {
    AuditLogger.logError('consent_validation_error', { userId, processingType, error });
    return false;
  }
}