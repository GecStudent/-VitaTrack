import express from 'express';
import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { validate as validateUUID } from 'uuid';
import rateLimit from 'express-rate-limit';
import { AuditLogger } from '../../utils/auditLogger';
import { logDataAccess } from '../auth/gdpr';
import { 
  initiateExport, 
  getExportStatus, 
  scheduleExport, 
  deleteExportFile, 
  bulkExport 
} from '../../services/export/data-export';
import { generateDownloadToken, validateDownloadToken, recordDownload } from '../../services/export/secure-download';
import { ExportFormat, ExportOptions } from '../../services/export/types';
import { getConfig } from '../../config';

const router = express.Router();
const config = getConfig();

// Ensure exports directory exists
const exportsDir = path.join(__dirname, '../../../', config.export.storagePath);
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
}

// Helper function to validate and sanitize file paths
function validateFilePath(filePath: string, baseDir: string): string | null {
  try {
    // Resolve the absolute path
    const resolvedPath = path.resolve(filePath);
    const resolvedBaseDir = path.resolve(baseDir);
    
    // Check if the resolved path is within the base directory
    if (!resolvedPath.startsWith(resolvedBaseDir)) {
      return null;
    }
    
    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      return null;
    }
    
    return resolvedPath;
  } catch (error) {
    return null;
  }
}

const exportLimiter = rateLimit({
  windowMs: config.export.rateLimitWindowMs, // Use config value
  max: config.export.rateLimitMax, // Use config value
  message: { error: 'Too many export requests, please try again later.' }
});

// Request data export (GDPR right to data portability)
router.post('/request', exportLimiter, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.sub;
    const { 
      format = config.export.defaultFormat, // Use config default format
      includeData = ['profile', 'goals', 'weight', 'meals', 'exercise', 'water', 'sleep'],
      anonymize = false,
      dateRange = null
    } = req.body;
    
    // Validate format
    if (!['json', 'csv', 'pdf'].includes(format)) {
      return res.status(400).json({ error: 'Invalid export format. Supported formats: json, csv, pdf' });
    }
    
    // Create export options
    const options: ExportOptions = {
      format: format as ExportFormat,
      includeData,
      anonymize
    };
    
    // Add date range if provided
    if (dateRange && dateRange.startDate && dateRange.endDate) {
      options.dateRange = {
        startDate: new Date(dateRange.startDate),
        endDate: new Date(dateRange.endDate)
      };
    }
    
    // Initiate the export
    const result = await initiateExport(userId, options);
    
    // Log data access for GDPR compliance
    logDataAccess(userId, 'system', 'data_export', new Date());
    
    res.json({
      success: true,
      message: 'Data export request received. You will be notified when your export is ready.',
      requestId: result.requestId
    });
  } catch (error) {
    AuditLogger.logError('data_export_request_error', { userId: req.user!.sub, error });
    res.status(500).json({ error: 'Failed to process data export request' });
  }
});

// Check export status
router.get('/status/:requestId', exportLimiter, async (req: Request, res: Response) => {
  const { requestId } = req.params;
  if (!validateUUID(requestId)) {
    return res.status(400).json({ error: 'Invalid requestId format' });
  }
  try {
    const userId = req.user!.sub;
    
    // Get export status from service
    const exportRequest = getExportStatus(requestId);
    
    if (!exportRequest) {
      return res.status(404).json({ error: 'Export request not found' });
    }
    
    // Verify that the request belongs to the user
    if (exportRequest.userId !== userId && exportRequest.userId !== 'bulk-export') {
      return res.status(403).json({ error: 'Unauthorized access to export request' });
    }
    
    res.json({
      success: true,
      data: {
        requestId,
        status: exportRequest.status,
        progress: exportRequest.progress,
        downloadUrl: exportRequest.status === 'completed' ? `/api/users/data-export/download/${requestId}` : null,
        createdAt: exportRequest.createdAt.toISOString(),
        expiresAt: exportRequest.expiresAt.toISOString(),
        error: exportRequest.error
      }
    });
  } catch (error) {
    AuditLogger.logError('data_export_status_error', { userId: req.user!.sub, requestId, error });
    res.status(500).json({ error: 'Failed to check export status' });
  }
});

// Download exported data
router.get('/download/:requestId', exportLimiter, async (req: Request, res: Response) => {
  const { requestId } = req.params;
  if (!validateUUID(requestId)) {
    return res.status(400).json({ error: 'Invalid requestId format' });
  }
  
  try {
    const userId = req.user!.sub;
    
    // Get export status
    const exportRequest = getExportStatus(requestId);
    
    if (!exportRequest) {
      return res.status(404).json({ error: 'Export request not found' });
    }
    
    // Verify that the request belongs to the user
    if (exportRequest.userId !== userId && exportRequest.userId !== 'bulk-export') {
      return res.status(403).json({ error: 'Unauthorized access to export request' });
    }
    
    // Check if export is completed
    if (exportRequest.status !== 'completed') {
      return res.status(400).json({ error: 'Export is not ready for download' });
    }
    
    // Validate file path to prevent path traversal
    const validatedFilePath = validateFilePath(exportRequest.filePath || '', exportsDir);
    if (!validatedFilePath) {
      return res.status(404).json({ error: 'Export file not found or invalid path' });
    }
    
    // Generate a secure download token with config values
    const token = generateDownloadToken(userId, validatedFilePath, {
      expiresIn: 3600, // 1 hour
      maxDownloads: config.export.maxDownloads // Use config value
    });
    
    // Redirect to secure download endpoint
    res.json({
      success: true,
      data: {
        downloadUrl: `/api/users/data-export/secure-download/${token}`,
        expiresIn: 3600 // 1 hour
      }
    });
  } catch (error) {
    AuditLogger.logError('data_export_download_error', { userId: req.user!.sub, requestId, error });
    res.status(500).json({ error: 'Failed to generate download link' });
  }
});

// Secure download endpoint
router.get('/secure-download/:token', async (req: Request, res: Response) => {
  const { token } = req.params;
  
  try {
    // Validate token
    const validation = validateDownloadToken(token);
    
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error || 'Invalid download token' });
    }
    
    // Validate file path to prevent path traversal
    const validatedFilePath = validateFilePath(validation.filePath!, exportsDir);
    if (!validatedFilePath) {
      return res.status(404).json({ error: 'Export file not found or invalid path' });
    }
    
    // Record the download
    recordDownload(token);
    
    // Get file information
    const format = path.extname(validatedFilePath).substring(1);
    
    // Set appropriate headers for download
    const filename = `vitatrack-data-export-${new Date().toISOString().split('T')[0]}.${format}`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    switch (format) {
      case 'json':
        res.setHeader('Content-Type', 'application/json');
        break;
      case 'csv':
        res.setHeader('Content-Type', 'text/csv');
        break;
      case 'pdf':
        res.setHeader('Content-Type', 'application/pdf');
        break;
      default:
        res.setHeader('Content-Type', 'application/octet-stream');
    }
    
    // Stream the file to the response
    const fileStream = fs.createReadStream(validatedFilePath);
    fileStream.on('error', (error) => {
      AuditLogger.logError('data_export_stream_error', { token, error });
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream export file' });
      }
    });
    
    fileStream.pipe(res);
  } catch (error) {
    AuditLogger.logError('secure_download_error', { token, error });
    res.status(500).json({ error: 'Failed to process secure download' });
  }
});

// Schedule recurring exports
router.post('/schedule', exportLimiter, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.sub;
    const { 
      format = 'json', 
      includeData = ['profile', 'goals', 'weight', 'meals', 'exercise', 'water', 'sleep'],
      anonymize = false,
      frequency = 'monthly',
      startDate = new Date()
    } = req.body;
    
    // Validate format
    if (!['json', 'csv', 'pdf'].includes(format)) {
      return res.status(400).json({ error: 'Invalid export format. Supported formats: json, csv, pdf' });
    }
    
    // Validate frequency
    if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
      return res.status(400).json({ error: 'Invalid frequency. Supported values: daily, weekly, monthly' });
    }
    
    // Create export options
    const options: ExportOptions = {
      format: format as ExportFormat,
      includeData,
      anonymize
    };
    
    // Schedule the export
    const scheduleId = scheduleExport(userId, options, {
      frequency: frequency as any,
      startDate: new Date(startDate)
    });
    
    res.json({
      success: true,
      message: 'Export schedule created successfully',
      scheduleId
    });
  } catch (error) {
    AuditLogger.logError('export_schedule_error', { userId: req.user!.sub, error });
    res.status(500).json({ error: 'Failed to schedule export' });
  }
});

// Delete an export
router.delete('/:requestId', async (req: Request, res: Response) => {
  const { requestId } = req.params;
  if (!validateUUID(requestId)) {
    return res.status(400).json({ error: 'Invalid requestId format' });
  }
  
  try {
    const userId = req.user!.sub;
    
    // Get export status
    const exportRequest = getExportStatus(requestId);
    
    if (!exportRequest) {
      return res.status(404).json({ error: 'Export request not found' });
    }
    
    // Verify that the request belongs to the user
    if (exportRequest.userId !== userId && exportRequest.userId !== 'bulk-export') {
      return res.status(403).json({ error: 'Unauthorized access to export request' });
    }
    
    // Validate file path before deletion to prevent path traversal
    if (exportRequest.filePath) {
      const validatedFilePath = validateFilePath(exportRequest.filePath, exportsDir);
      if (!validatedFilePath) {
        return res.status(400).json({ error: 'Invalid file path detected' });
      }
      
      // Manually delete the file with validated path
      try {
        await fs.promises.unlink(validatedFilePath);
      } catch (unlinkError) {
        // File might not exist or already deleted, which is acceptable
        AuditLogger.log('export_file_already_deleted', { 
          userId, 
          requestId, 
          filePath: validatedFilePath 
        });
      }
    }
    
    // Call the service method to clean up the export record
    // Note: If deleteExportFile also handles file deletion, you might want to 
    // modify it to accept a pre-validated path or skip file operations
    const success = await deleteExportFile(requestId);
    
    if (!success) {
      return res.status(400).json({ error: 'Failed to delete export record' });
    }
    
    res.json({
      success: true,
      message: 'Export deleted successfully'
    });
  } catch (error) {
    AuditLogger.logError('export_deletion_error', { userId: req.user!.sub, requestId, error });
    res.status(500).json({ error: 'Failed to delete export' });
  }
});

// Admin endpoint for bulk exports (requires admin role)
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    // Check if user has admin role - Fixed: changed 'roles' to 'role'
    const userRole = req.user!.role;
    if (!userRole || (Array.isArray(userRole) ? !userRole.includes('admin') : userRole !== 'admin')) {
      return res.status(403).json({ error: 'Unauthorized. Admin role required.' });
    }
    
    const { 
      userIds, 
      format = 'json', 
      includeData = ['profile', 'goals', 'weight', 'meals', 'exercise', 'water', 'sleep'],
      anonymize = true // Default to true for bulk exports
    } = req.body;
    
    // Validate userIds
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs array is required' });
    }
    
    // Validate format
    if (!['json', 'csv', 'pdf'].includes(format)) {
      return res.status(400).json({ error: 'Invalid export format. Supported formats: json, csv, pdf' });
    }
    
    // Create export options
    const options: ExportOptions = {
      format: format as ExportFormat,
      includeData,
      anonymize
    };
    
    // Initiate bulk export
    const result = await bulkExport(userIds, options);
    
    res.json({
      success: true,
      message: `Bulk export initiated for ${userIds.length} users`,
      requestId: result.requestId
    });
  } catch (error) {
    AuditLogger.logError('bulk_export_request_error', { userId: req.user!.sub, error });
    res.status(500).json({ error: 'Failed to process bulk export request' });
  }
});

export default router;