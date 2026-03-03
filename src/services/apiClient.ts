/**
 * API Client Configuration
 * 
 * Centralized HTTP client for all API requests to the backend.
 * Includes request/response interceptors for authentication, error handling,
 * and automatic header management.
 * 
 * REPLICATES WEB FRONTEND EXACTLY:
 * - Uses Axios HTTP client
 * - Automatic JWT token attachment from Supabase
 * - Request/response interceptors matching web behavior
 * - Error handling identical to web frontend
 * - Same timeout and configuration
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { config } from '../config/env';
import { getAccessToken, signOutUser } from './supabase';
import { ApiError } from './types';

/**
 * Create axios instance with base configuration
 * 
 * Base URL is read from environment variable API_BASE_URL
 * Falls back to default development URL if not set
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout (same as web)
});

/**
 * Request Interceptor
 * 
 * Automatically adds JWT authentication token to all requests.
 * 
 * JWT Authentication (same as web frontend):
 * - Reads JWT token from Supabase session
 * - Adds Authorization: Bearer <token> header to all requests
 * - Handles token refresh automatically if expired
 * 
 * Format: Authorization: Bearer <token>
 */
apiClient.interceptors.request.use(
  async (requestConfig: InternalAxiosRequestConfig) => {
    try {
      // Get JWT token from Supabase
      const token = await getAccessToken();

      // Attach JWT token to request headers
      if (token && requestConfig.headers) {
        requestConfig.headers['Authorization'] = `Bearer ${token}`;

        if (config.debugApi && __DEV__) {
          console.log(`🔐 [API] JWT token attached to ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`);
          console.log(`🔐 [API] Token prefix: ${token.substring(0, 20)}...`);
        }
      } else {
        if (__DEV__) {
          console.warn('⚠️ [API] No JWT token available - request will proceed without authentication');
          console.warn('⚠️ [API] This will cause 401/403 errors on protected endpoints');
        }
      }

      return requestConfig;
    } catch (error) {
      console.error('❌ [API] Request interceptor error:', error);
      // Continue with request even if token retrieval fails
      return requestConfig;
    }
  },
  (error) => {
    // Handle request configuration errors
    console.error('❌ [API] Request interceptor failure:', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * 
 * Handles API responses and errors (matching web frontend behavior):
 * - Logs responses for debugging
 * - Handles 401 Unauthorized (token expired/invalid)
 * - Handles 403 Forbidden (insufficient permissions)
 * - Handles other error scenarios (4xx, 5xx, network)
 * 
 * Error Types:
 * - 401: JWT token expired or invalid → Sign out user
 * - 403: User doesn't have permission
 * - 4xx: Client errors (validation, not found, etc.)
 * - 5xx: Server errors
 * - Network errors: No response received
 */
apiClient.interceptors.response.use(
  (response) => {
    // Successful response - log and return as-is
    if (config.debugApi && __DEV__) {
      console.log(`✅ [API] Response ${response.status}: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    }
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status (4xx, 5xx)
      const apiError = error.response.data;
      const status = error.response.status;

      // Handle 401 Unauthorized (JWT token expired/invalid)
      if (status === 401) {
        console.error('❌ [API] Authentication failed (401 Unauthorized) - JWT token invalid or expired');
        console.error('   Message:', apiError?.message || 'Unauthorized');

        // Sign out user and clear session
        try {
          await signOutUser();
          console.log('✅ [API] User signed out due to invalid token');
        } catch (signOutError) {
          console.error('❌ [API] Error during sign out:', signOutError);
        }

        // Note: Navigation to login screen will be handled by auth store listener

        return Promise.reject(error);
      }

      // Handle 403 Forbidden (insufficient permissions)
      if (status === 403) {
        console.error('❌ [API] Insufficient permissions (403 Forbidden)');
        console.error('   Message:', apiError?.message || 'Forbidden');
        return Promise.reject(error);
      }

      // Handle 404 Not Found
      if (status === 404) {
        if (config.debugApi && __DEV__) {
          console.warn(`⚠️ [API] Resource not found (404): ${error.config?.url}`);
        }
        return Promise.reject(error);
      }

      // Handle validation errors (400)
      if (status === 400 && apiError?.errors) {
        console.warn('⚠️ [API] Validation error (400):', apiError.errors);
        return Promise.reject(error);
      }

      // Handle other client errors (4xx)
      if (status >= 400 && status < 500) {
        console.error(`❌ [API] Client error [${status}]: ${apiError?.message || 'Unknown error'}`);
        return Promise.reject(error);
      }

      // Handle server errors (5xx)
      if (status >= 500) {
        console.error(`❌ [API] Server error [${status}]: ${apiError?.message || 'Unknown error'}`);
        return Promise.reject(error);
      }
    } else if (error.request) {
      // Request made but no response received (network error)
      console.error('❌ [API] Network Error: No response received');
      console.error('   URL:', error.config?.url || 'Unknown');
      console.error('   Base URL:', error.config?.baseURL || 'Unknown');
      console.error('   Full URL:', `${error.config?.baseURL}${error.config?.url}`);
      console.error('   Method:', error.config?.method?.toUpperCase() || 'Unknown');
      console.error('   Error:', error.message);
      console.error('   ⚠️  TROUBLESHOOTING:');
      console.error('      1. Is backend running? Check: curl http://192.168.100.144:3000/health');
      console.error('      2. Is backend listening on 0.0.0.0? (not just localhost)');
      console.error('      3. Is firewall blocking connection?');
      console.error('      4. Are you on the same WiFi network?');
      return Promise.reject(error);
    } else {
      // Something else happened (request setup error)
      console.error('❌ [API] Request Setup Error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
