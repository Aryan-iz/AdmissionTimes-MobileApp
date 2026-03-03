/**
 * Environment Configuration
 * 
 * Centralized environment variables for the mobile app.
 * Uses expo-constants to read from .env file.
 */

import Constants from 'expo-constants';

interface Config {
  apiBaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  debugApi: boolean;
}

// Helper to get env variable
const getEnvVar = (key: string, defaultValue?: string): string => {
  // Try expo config extra first
  const value = Constants.expoConfig?.extra?.[key];
  
  if (value) {
    return value;
  }
  
  if (defaultValue) {
    return defaultValue;
  }
  
  console.warn(`⚠️ Environment variable ${key} is not set`);
  return '';
};

export const config: Config = {
  apiBaseUrl: getEnvVar('API_BASE_URL', 'http://10.102.139.20:3000/api/v1'),
  supabaseUrl: getEnvVar('SUPABASE_URL', 'https://lufhgsgubvxjrrcsevte.supabase.co'),
  supabaseAnonKey: getEnvVar('SUPABASE_ANON_KEY', 'sb_publishable_RzAA52ZFGw9LV2piNWd4bA_3wVwdbDP'),
  debugApi: getEnvVar('DEBUG_API', 'false') === 'true',
};

// Log configuration in development
if (__DEV__) {
  console.log('📋 [Config] Environment configuration loaded:');
  console.log('  API Base URL:', config.apiBaseUrl);
  console.log('  Supabase URL:', config.supabaseUrl ? '✅ Set' : '❌ Not Set');
  console.log('  Supabase Anon Key:', config.supabaseAnonKey ? '✅ Set' : '❌ Not Set');
  console.log('  Debug API:', config.debugApi);
}
