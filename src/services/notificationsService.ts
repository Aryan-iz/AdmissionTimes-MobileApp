/**
 * Notifications Service
 * 
 * Service for managing user notifications.
 * Handles fetching, marking as read, and filtering notifications.
 * 
 * REPLICATES WEB FRONTEND EXACTLY:
 * - Same endpoints and request/response formats
 * - Automatic user filtering by backend
 */

import apiClient from './apiClient';
import { ApiResponse, PaginatedResponse, Notification } from './types';

type PushPlatform = 'ios' | 'android' | 'web';

interface PushTokenPayload {
  expo_push_token: string;
  platform: PushPlatform;
}

export const notificationsService = {
  /**
   * List notifications with optional filters
   * 
   * Backend endpoint: GET /notifications
   * Backend automatically filters by current user's role.
   * 
   * @param params - Query parameters for filtering and pagination
   * @returns Promise resolving to paginated notifications list
   */
  list: async (params?: {
    category?: string;
    priority?: string;
    is_read?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Notification>> => {
    console.log('🔔 [notificationsService] Fetching notifications');
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  /**
   * Get notification by ID
   * 
   * Backend endpoint: GET /notifications/:id
   * 
   * @param id - Notification ID
   * @returns Promise resolving to notification data
   */
  getById: async (id: string): Promise<ApiResponse<Notification>> => {
    console.log('🔔 [notificationsService] Fetching notification:', id);
    const response = await apiClient.get(`/notifications/${id}`);
    return response.data;
  },

  /**
   * Mark notification as read
   * 
   * Backend endpoint: PATCH /notifications/:id/read
   * 
   * @param id - Notification ID
   * @returns Promise resolving to updated notification
   */
  markAsRead: async (id: string): Promise<ApiResponse<Notification>> => {
    console.log('🔔 [notificationsService] Marking notification as read:', id);
    const response = await apiClient.patch(`/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   * 
   * Backend endpoint: PATCH /notifications/read-all
   * 
   * @returns Promise resolving to update count
   */
  markAllAsRead: async (): Promise<ApiResponse<{ updated_count: number }>> => {
    console.log('🔔 [notificationsService] Marking all notifications as read');
    const response = await apiClient.patch('/notifications/read-all');
    return response.data;
  },

  /**
   * Get unread notification count
   * 
   * Backend endpoint: GET /notifications/unread-count
   * 
   * @returns Promise resolving to unread count
   */
  getUnreadCount: async (): Promise<ApiResponse<{ unread_count: number }>> => {
    console.log('🔔 [notificationsService] Fetching unread count');
    const response = await apiClient.get('/notifications/unread-count');
    return response.data;
  },

  /**
   * Delete notification
   * 
   * Backend endpoint: DELETE /notifications/:id
   * 
   * @param id - Notification ID
   * @returns Promise resolving to success response
   */
  delete: async (id: string): Promise<ApiResponse<void>> => {
    console.log('🔔 [notificationsService] Deleting notification:', id);
    const response = await apiClient.delete(`/notifications/${id}`);
    return response.data;
  },

  registerPushToken: async (payload: PushTokenPayload): Promise<ApiResponse<{ id: string }>> => {
    console.log('🔔 [notificationsService] Registering push token');
    const response = await apiClient.post('/notifications/push-token', payload);
    return response.data;
  },

  unregisterPushToken: async (payload: { expo_push_token: string }): Promise<ApiResponse<void>> => {
    console.log('🔔 [notificationsService] Unregistering push token');
    const response = await apiClient.delete('/notifications/push-token', { data: payload });
    return response.data;
  },
};
