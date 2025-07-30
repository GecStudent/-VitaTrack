/**
 * Export format types
 */
export type ExportFormat = 'json' | 'csv' | 'pdf';

/**
 * Export status types
 */
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'deleted';

/**
 * Export options interface
 */
export interface ExportOptions {
  format: ExportFormat;
  includeData: string[];
  anonymize?: boolean;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  encryptionPassword?: string;
}

/**
 * Export request interface
 */
export interface ExportRequest {
  userId: string;
  requestId: string;
  options: ExportOptions;
  status: ExportStatus;
  createdAt: Date;
  expiresAt: Date;
  progress: number;
  filePath: string | null;
  error?: string;
  userIds?: string[];
}

/**
 * Export schedule interface
 */
export interface ExportSchedule {
  scheduleId: string;
  userId: string;
  options: ExportOptions;
  frequency: 'daily' | 'weekly' | 'monthly';
  nextRunDate: Date;
  lastRunDate?: Date;
  active: boolean;
}

/**
 * Download token interface
 */
export interface DownloadToken {
  token: string;
  filePath: string;
  userId: string;
  expiresAt: Date;
  downloadCount: number;
  maxDownloads: number;
}