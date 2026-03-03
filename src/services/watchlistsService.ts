/**
 * Watchlists Service
 * 
 * Service for managing saved/favorited admission programs.
 * Handles adding/removing from watchlist and managing notes.
 * 
 * REPLICATES WEB FRONTEND EXACTLY:
 * - Same endpoints and request/response formats
 * - Automatic user filtering by backend
 */

import apiClient from './apiClient';
import { ApiResponse, PaginatedResponse, Watchlist } from './types';

export const watchlistsService = {
  /**
   * List watchlist items for current user
   * 
   * Backend endpoint: GET /watchlists
   * Backend automatically filters by current user.
   * 
   * @param params - Query parameters for pagination
   * @returns Promise resolving to paginated watchlist
   */
  list: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Watchlist>> => {
    console.log('🔖 [watchlistsService] Fetching watchlist');
    const response = await apiClient.get('/watchlists', { params });
    return response.data;
  },

  /**
   * Get watchlist item by ID
   * 
   * Backend endpoint: GET /watchlists/:id
   * 
   * @param id - Watchlist ID
   * @returns Promise resolving to watchlist item
   */
  getById: async (id: string): Promise<ApiResponse<Watchlist>> => {
    console.log('🔖 [watchlistsService] Fetching watchlist item:', id);
    const response = await apiClient.get(`/watchlists/${id}`);
    return response.data;
  },

  /**
   * Add admission to watchlist
   * 
   * Backend endpoint: POST /watchlists
   * 
   * @param admissionId - Admission ID to add
   * @param alertOptIn - Whether to enable deadline alerts (optional)
   * @returns Promise resolving to created watchlist item
   */
  add: async (admissionId: string, alertOptIn: boolean = false): Promise<ApiResponse<Watchlist>> => {
    console.log('🔖 [watchlistsService] Adding to watchlist:', admissionId);
    const response = await apiClient.post('/watchlists', {
      admission_id: admissionId,
      alert_opt_in: alertOptIn,
    });
    return response.data;
  },

  /**
   * Remove admission from watchlist
   * 
   * Backend endpoint: DELETE /watchlists/:id
   * 
   * @param id - Watchlist ID to remove
   * @returns Promise resolving to success response
   */
  remove: async (id: string): Promise<ApiResponse<void>> => {
    console.log('🔖 [watchlistsService] Removing from watchlist:', id);
    const response = await apiClient.delete(`/watchlists/${id}`);
    return response.data;
  },

  /**
   * Remove by admission ID (convenience method)
   * 
   * Backend endpoint: DELETE /watchlists/admission/:admissionId
   * 
   * @param admissionId - Admission ID to remove from watchlist
   * @returns Promise resolving to success response
   */
  removeByAdmissionId: async (admissionId: string): Promise<ApiResponse<void>> => {
    console.log('🔖 [watchlistsService] Removing by admission ID:', admissionId);
    const response = await apiClient.delete(`/watchlists/admission/${admissionId}`);
    return response.data;
  },

  /**
   * Update watchlist item (e.g., toggle alert, update notes)
   * 
   * Backend endpoint: PATCH /watchlists/:id
   * 
   * @param id - Watchlist ID
   * @param data - Updated watchlist data
   * @returns Promise resolving to updated watchlist item
   */
  update: async (id: string, data: Partial<Watchlist>): Promise<ApiResponse<Watchlist>> => {
    console.log('🔖 [watchlistsService] Updating watchlist item:', id);
    const response = await apiClient.patch(`/watchlists/${id}`, data);
    return response.data;
  },

  /**
   * Toggle alert opt-in for watchlist item
   * 
   * Backend endpoint: PATCH /watchlists/:id/toggle-alert
   * 
   * @param id - Watchlist ID
   * @returns Promise resolving to updated watchlist item
   */
  toggleAlert: async (id: string): Promise<ApiResponse<Watchlist>> => {
    console.log('🔖 [watchlistsService] Toggling alert for:', id);
    const response = await apiClient.patch(`/watchlists/${id}/toggle-alert`);
    return response.data;
  },
};
