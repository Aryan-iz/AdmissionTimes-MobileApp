/**
 * Environment Configuration
 * 
 * Centralized environment variables for the mobile app.
 * Uses expo-constants to read from .env file.
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface Config {
  apiBaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  debugApi: boolean;
  enableRealtime: boolean;
  enablePushNotifications: boolean;
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

const getOptionalEnvVar = (key: string): string | undefined => {
  const value = Constants.expoConfig?.extra?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
};

const isLocalWebHost = (host: string): boolean => {
  return host === 'localhost' || host === '127.0.0.1';
};

const getBrowserHostname = (): string | undefined => {
  const maybeLocation = (globalThis as { location?: { hostname?: string } }).location;
  const hostname = maybeLocation?.hostname;
  return typeof hostname === 'string' && hostname.length > 0 ? hostname : undefined;
};

const extractHostnameFromUrl = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const withoutProtocol = trimmed.replace(/^[a-zA-Z][a-zA-Z\d+.-]*:\/\//, '');
  const hostPort = withoutProtocol.split('/')[0];
  const hostWithOptionalAuth = hostPort.split('@').pop();
  const host = hostWithOptionalAuth?.split(':')[0];

  return host && host.length > 0 ? host : undefined;
};

const getWebApiBaseUrl = (): string => {
  const hostname = getBrowserHostname();

  if (!hostname) {
    return 'http://localhost:3000/api/v1';
  }

  return `http://${hostname}:3000/api/v1`;
};

const getValidatedApiBaseUrl = (): string | undefined => {
  const explicitApiBaseUrl = getOptionalEnvVar('API_BASE_URL');

  if (!explicitApiBaseUrl) {
    return undefined;
  }

  if (Platform.OS !== 'web') {
    return explicitApiBaseUrl;
  }

  const explicitHost = extractHostnameFromUrl(explicitApiBaseUrl);
  const browserHost = getBrowserHostname();

  if (!browserHost) {
    return explicitApiBaseUrl;
  }

  if (!explicitHost) {
    if (__DEV__) {
      console.warn(`⚠️ [Config] Ignoring invalid API_BASE_URL override: ${explicitApiBaseUrl}`);
    }
    return undefined;
  }

  if (explicitHost === browserHost) {
    return explicitApiBaseUrl;
  }

  if (isLocalWebHost(explicitHost) && isLocalWebHost(browserHost)) {
    return explicitApiBaseUrl;
  }

  if (__DEV__) {
    console.warn(
      `⚠️ [Config] Ignoring stale API_BASE_URL override for web: ${explicitApiBaseUrl}. Using browser host ${browserHost} instead.`
    );
  }

  return undefined;
};

const resolveDefaultApiBaseUrl = (): string => {
  if (Platform.OS === 'web') {
    return getWebApiBaseUrl();
  }

  const constantsAny = Constants as any;
  const hostUri = constantsAny?.expoConfig?.hostUri as string | undefined;
  const debuggerHost =
    constantsAny?.manifest2?.extra?.expoGo?.debuggerHost as string | undefined;
  const legacyDebuggerHost = constantsAny?.manifest?.debuggerHost as string | undefined;

  const rawHost = hostUri || debuggerHost || legacyDebuggerHost;
  const host = rawHost?.split(':')[0];

  if (host) {
    return `http://${host}:3000/api/v1`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api/v1';
  }

  return 'http://localhost:3000/api/v1';
};

export const config: Config = {
  apiBaseUrl: getValidatedApiBaseUrl() || resolveDefaultApiBaseUrl(),
  supabaseUrl: getEnvVar('SUPABASE_URL', 'https://lufhgsgubvxjrrcsevte.supabase.co'),
  supabaseAnonKey: getEnvVar('SUPABASE_ANON_KEY', 'sb_publishable_RzAA52ZFGw9LV2piNWd4bA_3wVwdbDP'),
  debugApi: getEnvVar('DEBUG_API', 'false') === 'true',
  enableRealtime: getEnvVar('ENABLE_REALTIME', 'true') === 'true',
  enablePushNotifications: getEnvVar('ENABLE_PUSH_NOTIFICATIONS', 'true') === 'true',
};

// Log configuration in development
if (__DEV__) {
  console.log('📋 [Config] Environment configuration loaded:');
  console.log('  API Base URL:', config.apiBaseUrl);
  console.log('  Supabase URL:', config.supabaseUrl ? '✅ Set' : '❌ Not Set');
  console.log('  Supabase Anon Key:', config.supabaseAnonKey ? '✅ Set' : '❌ Not Set');
  console.log('  Debug API:', config.debugApi);
  console.log('  Enable Realtime:', config.enableRealtime);
  console.log('  Enable Push Notifications:', config.enablePushNotifications);
}
