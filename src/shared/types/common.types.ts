/**
 * Common Types - Shared across all modules
 *
 * These are the ONLY types that can be shared between modules.
 * They represent the contract between domains.
 */

/**
 * Pagination request parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Pagination response metadata
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Date range filter
 */
export interface DateRangeFilter {
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, any>;
  error?: string;
}

/**
 * API Error response
 */
export interface ApiError {
  error: string;
  statusCode: number;
  details?: Record<string, any>;
}
