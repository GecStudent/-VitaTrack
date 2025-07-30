import { ApiResponse } from '../types';

// Standard success response
export function formatSuccess<T>(data: T, message = 'Success'): ApiResponse<T> {
  return {
    message,
    data,
  };
}

// Error response
export function formatError(message: string, data: any = null): ApiResponse<any> {
  return {
    message,
    data,
  };
}

// Pagination response
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

export function formatPagination<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  message = 'Success'
): PaginatedResponse<T> {
  return {
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}