/**
 * Admissions Service
 * 
 * Service for managing admission/program data.
 * Handles listing, searching, and filtering admissions.
 * 
 * REPLICATES WEB FRONTEND EXACTLY:
 * - Same endpoints and query parameters
 * - Same filtering and pagination
 * - Students see only verified admissions
 */

import apiClient from './apiClient';
import { PaginatedResponse, Admission, ApiResponse } from './types';

export const admissionsService = {
  /**
   * List admissions with filters and pagination
   * 
   * Backend endpoint: GET /admissions
   * 
   * Students automatically see only verified admissions.
   * Backend applies role-based filtering automatically.
   * 
   * @param params - Filter and pagination parameters
   * @returns Promise resolving to paginated admissions list
   */
  list: async (params?: {
    search?: string;
    degree_level?: string;
    field_of_study?: string;
    location?: string;
    program_type?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Admission>> => {
    console.log('📋 [admissionsService] Fetching admissions with filters:', params);
    const response = await apiClient.get('/admissions', { params });
    return response.data;
  },

  /**
   * Get single admission by ID
   * 
   * Backend endpoint: GET /admissions/:id
   * 
   * @param id - Admission ID
   * @returns Promise resolving to admission data
   */
  getById: async (id: string): Promise<ApiResponse<Admission>> => {
    console.log('📋 [admissionsService] Fetching admission:', id);
    const response = await apiClient.get(`/admissions/${id}`);
    return response.data;
  },
};
