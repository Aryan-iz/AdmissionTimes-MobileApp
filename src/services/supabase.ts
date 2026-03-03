/**
 * Supabase Client for React Native
 * 
 * Handles Supabase authentication and JWT token management.
 * Uses AsyncStorage for session persistence on mobile.
 * 
 * IMPORTANT: This client is used ONLY for authentication.
 * All other API calls go through the backend API (apiClient.ts).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../config/env';

/**
 * Custom async storage adapter for React Native
 * Supabase requires this for session persistence
 */
const AsyncStorageAdapter = {
  getItem: async (key: string) => {
    return await AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    await AsyncStorage.removeItem(key);
  },
};

/**
 * Initialize Supabase client with React Native storage
 */
export const supabase: SupabaseClient = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Not needed for mobile
    },
  }
);

/**
 * Get current session with JWT token
 * 
 * @returns Promise with session data and access token
 */
export const getSession = async () => {
  return await supabase.auth.getSession();
};

/**
 * Get current access token
 * 
 * This token should be attached to all API requests in the Authorization header
 * Format: Authorization: Bearer <token>
 * 
 * @returns Promise with access token or null
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ [Supabase] Failed to get session:', error.message);
      return null;
    }
    
    if (!data.session) {
      console.warn('⚠️ [Supabase] No active session');
      return null;
    }
    
    const token = data.session.access_token;
    
    if (config.debugApi && __DEV__) {
      console.log('🔐 [Supabase] Access token retrieved');
      console.log('  Token prefix:', token.substring(0, 20) + '...');
      console.log('  Expires at:', new Date(data.session.expires_at! * 1000).toISOString());
    }
    
    return token;
  } catch (error: any) {
    console.error('❌ [Supabase] Error getting access token:', error);
    return null;
  }
};

/**
 * Get current authenticated user from Supabase Auth
 * 
 * @returns Promise with user data or null
 */
export const getSupabaseUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('❌ [Supabase] Failed to get user:', error.message);
      return null;
    }
    
    return data.user;
  } catch (error: any) {
    console.error('❌ [Supabase] Error getting user:', error);
    return null;
  }
};

/**
 * Sign out current user
 * Clears Supabase session and AsyncStorage
 * 
 * @returns Promise
 */
export const signOutUser = async () => {
  try {
    console.log('🔐 [Supabase] Signing out user...');
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ [Supabase] Sign out error:', error.message);
      throw error;
    }
    
    console.log('✅ [Supabase] User signed out successfully');
  } catch (error: any) {
    console.error('❌ [Supabase] Error during sign out:', error);
    throw error;
  }
};

/**
 * Auth state change listener type
 */
export type AuthChangeCallback = (event: string, session: any) => void;

/**
 * Listen for auth state changes
 * Useful for detecting login/logout events
 * 
 * @param callback - Function to call when auth state changes
 * @returns Unsubscribe function
 */
export const onAuthStateChange = (callback: AuthChangeCallback) => {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return data.subscription.unsubscribe;
};
