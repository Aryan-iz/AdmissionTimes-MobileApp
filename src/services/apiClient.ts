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
import { getAccessToken, refreshAccessToken, supabase } from './supabase';
import { ApiError } from './types';
import { createLogger } from '../utils/logger'

const log = createLogger('apiClient')

const NETWORK_ERROR_LOG_THROTTLE_MS = 15000;
let lastNetworkErrorLogAt = 0;

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
      requestConfig.baseURL = config.apiBaseUrl;

      // Get JWT token from Supabase
      const token = await getAccessToken();

      // Attach JWT token to request headers
      if (token && requestConfig.headers) {
        requestConfig.headers['Authorization'] = `Bearer ${token}`;

        if (config.debugApi && __DEV__) {
          log.debug(`JWT token attached to ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`);
        }
      } else {
        if (__DEV__) {
          log.warn('No JWT token available - request will proceed without authentication');
          log.warn('This will cause 401/403 errors on protected endpoints');
        }
      }

      return requestConfig;
    } catch (error) {
      log.error('Request interceptor error:', error);
      // Continue with request even if token retrieval fails
      return requestConfig;
    }
  },
  (error) => {
    // Handle request configuration errors
    log.error('Request interceptor failure:', error);
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
      log.debug(`Response ${response.status}: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    }
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status (4xx, 5xx)
      const apiError = error.response.data;
      const status = error.response.status;

      // 401: the access token may simply have expired. Refresh once and
      // retry; only if that fails is the session unusable.
      if (status === 401) {
        const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
        if (original && !original._retried) {
          original._retried = true;
          const token = await refreshAccessToken();
          if (token) {
            original.headers['Authorization'] = `Bearer ${token}`;
            return apiClient(original);
          }
        }

        log.warn('Session rejected (401); signing out locally');
        // Local sign-out fires SIGNED_OUT, which clears the auth store.
        await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
        return Promise.reject(error);
      }

      // Handle 403 Forbidden (insufficient permissions)
      if (status === 403) {
        log.error('Insufficient permissions (403 Forbidden)');
        log.error('   Message:', apiError?.message || 'Forbidden');
        return Promise.reject(error);
      }

      // Handle 404 Not Found
      if (status === 404) {
        if (config.debugApi && __DEV__) {
          log.warn(`Resource not found (404): ${error.config?.url}`);
        }
        return Promise.reject(error);
      }

      // Handle validation errors (400)
      if (status === 400 && apiError?.errors) {
        log.warn('Validation error (400):', apiError.errors);
        return Promise.reject(error);
      }

      // Handle other client errors (4xx)
      if (status >= 400 && status < 500) {
        log.error(`Client error [${status}]: ${apiError?.message || 'Unknown error'}`);
        return Promise.reject(error);
      }

      // Handle server errors (5xx)
      if (status >= 500) {
        log.error(`Server error [${status}]: ${apiError?.message || 'Unknown error'}`);
        return Promise.reject(error);
      }
    } else if (error.request) {
      // Request made but no response received (network error)
      const baseUrl = String(error.config?.baseURL || '');
      const healthUrl = baseUrl.includes('/api/v1')
        ? baseUrl.replace('/api/v1', '/health')
        : `${baseUrl}/health`;

      const now = Date.now();
      const shouldLogDetails = now - lastNetworkErrorLogAt >= NETWORK_ERROR_LOG_THROTTLE_MS;

      if (shouldLogDetails) {
        lastNetworkErrorLogAt = now;
        log.error('Network Error: No response received');
        log.error('   URL:', error.config?.url || 'Unknown');
        log.error('   Base URL:', error.config?.baseURL || 'Unknown');
        log.error('   Full URL:', `${error.config?.baseURL}${error.config?.url}`);
        log.error('   Method:', error.config?.method?.toUpperCase() || 'Unknown');
        log.error('   Error:', error.message);
        log.error('   ⚠️  TROUBLESHOOTING:');
        log.error(`      1. Is backend running? Check: curl ${healthUrl}`);
        log.error('      2. Is backend listening on 0.0.0.0? (not just localhost)');
        log.error('      3. Is firewall blocking connection?');
        log.error('      4. Are you on the same WiFi network?');
      } else if (__DEV__) {
        log.warn('Repeated network error suppressed (throttled)');
      }
      return Promise.reject(error);
    } else {
      // Something else happened (request setup error)
      log.error('Request Setup Error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
