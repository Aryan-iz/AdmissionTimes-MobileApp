/**
 * Dashboard Service
 * 
 * Service for fetching aggregated dashboard data from backend.
 * Uses the aggregated dashboard endpoints for optimal performance.
 * 
 * REPLICATES WEB FRONTEND EXACTLY:
 * - Same endpoint: GET /student/dashboard
 * - Same response structure
 */

import apiClient from './apiClient';
import { ApiResponse, StudentDashboard } from './types';

export const dashboardService = {
  /**
   * Get student dashboard data
   * 
   * Fetches aggregated data including:
   * - User info
   * - Statistics (watchlist count, deadlines, notifications)
   * - Recent admissions
   * - Upcoming deadlines
   * - Watchlisted admissions
   * 
   * Backend endpoint: GET /student/dashboard
   * 
   * @returns Promise resolving to student dashboard data
   */
  getStudentDashboard: async (): Promise<ApiResponse<StudentDashboard>> => {
    console.log('📊 [dashboardService] Fetching student dashboard');
    const response = await apiClient.get('/student/dashboard');
    return response.data;
  },
};
