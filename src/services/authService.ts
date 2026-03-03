/**
 * Authentication Service
 * 
 * Service for handling user authentication (sign in, sign up, sign out).
 * Uses Supabase for authentication and backend API for user data.
 * 
 * REPLICATES WEB FRONTEND EXACTLY:
 * - Same endpoints and request/response formats
 * - Same authentication flow (Supabase + backend)
 * - Same error handling
 */

import apiClient from './apiClient';
import { ApiResponse, User, SignInData, SignUpData, AuthResponse } from './types';

export const authService = {
  /**
   * Sign up a new user
   * 
   * Creates user in Supabase Auth and backend database.
   * Backend endpoint: POST /auth/signup
   * 
   * @param data - Sign up data (email, password, user_type, etc.)
   * @returns Promise resolving to user data
   */
  signUp: async (data: SignUpData): Promise<ApiResponse<AuthResponse>> => {
    console.log('🔐 [authService] Signing up user:', data.email);
    const response = await apiClient.post('/auth/signup', data);
    return response.data;
  },

  /**
   * Sign in an existing user
   * 
   * Note: This endpoint is for backend-only auth (not used with Supabase).
   * With Supabase, authentication happens via Supabase client,
   * then we call getCurrentUser() to get user data.
   * 
   * Backend endpoint: POST /auth/signin
   * 
   * @param data - Sign in data (email, password)
   * @returns Promise resolving to user data
   */
  signIn: async (data: SignInData): Promise<ApiResponse<AuthResponse>> => {
    console.log('🔐 [authService] Signing in user:', data.email);
    const response = await apiClient.post('/auth/signin', data);
    return response.data;
  },

  /**
   * Sign out current user
   * 
   * Backend endpoint: POST /auth/signout
   * 
   * @returns Promise resolving to success response
   */
  signOut: async (): Promise<ApiResponse<void>> => {
    console.log('🔐 [authService] Signing out user');
    const response = await apiClient.post('/auth/signout');
    return response.data;
  },

  /**
   * Get current authenticated user
   * 
   * Fetches user data from backend using JWT token.
   * Backend endpoint: GET /auth/me
   * 
   * @returns Promise resolving to current user data
   */
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    console.log('🔐 [authService] Fetching current user');
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};
