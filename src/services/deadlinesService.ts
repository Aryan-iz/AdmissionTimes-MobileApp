/**
 * Deadlines Service
 * 
 * Service for managing admission deadlines.
 * Handles fetching deadlines and upcoming deadlines.
 * 
 * REPLICATES WEB FRONTEND EXACTLY:
 * - Same endpoints and request/response formats
 * - Same filtering logic
 */

import apiClient from './apiClient';
import { ApiResponse, PaginatedResponse, Deadline } from './types';

export const deadlinesService = {
  /**
   * List deadlines with filters
   * 
   * Backend endpoint: GET /deadlines
   * 
   * @param params - Filter and pagination params
   * @returns Promise resolving to paginated deadlines
   */
  list: async (params?: {
    admission_id?: string;
    deadline_type?: string;
    from_date?: string;
    to_date?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Deadline>> => {
    console.log('📅 [deadlinesService] Fetching deadlines');
    const response = await apiClient.get('/deadlines', { params });
    return response.data;
  },

  /**
   * Get deadline by ID
   * 
   * Backend endpoint: GET /deadlines/:id
   * 
   * @param id - Deadline ID
   * @returns Promise resolving to deadline
   */
  getById: async (id: string): Promise<ApiResponse<Deadline>> => {
    console.log('📅 [deadlinesService] Fetching deadline:', id);
    const response = await apiClient.get(`/deadlines/${id}`);
    return response.data;
  },

  /**
   * Get upcoming deadlines
   * 
   * Backend endpoint: GET /deadlines/upcoming
   * 
   * @param days - Days ahead to look (default: 30)
   * @returns Promise resolving to upcoming deadlines
   */
  getUpcoming: async (days: number = 30): Promise<ApiResponse<Deadline[]>> => {
    console.log('📅 [deadlinesService] Fetching upcoming deadlines (next', days, 'days)');
    const response = await apiClient.get('/deadlines/upcoming', { params: { days } });
    return response.data;
  },

  /**
   * Get urgent deadlines (within 3 days)
   * Convenience method that calls getUpcoming(3)
   * 
   * @returns Promise resolving to urgent deadlines
   */
  getUrgent: async (): Promise<ApiResponse<Deadline[]>> => {
    return deadlinesService.getUpcoming(3);
  },
};
