/**
 * Service Exports
 * 
 * Centralized export for all API services.
 * Import services from this file in your components/stores.
 * 
 * @example
 * import { authService, dashboardService } from '@/services';
 */

export { authService } from './authService';
export { dashboardService } from './dashboardService';
export { admissionsService } from './admissionsService';
export { watchlistsService } from './watchlistsService';
export { notificationsService } from './notificationsService';
export { deadlinesService } from './deadlinesService';
export { recommendationsService } from './recommendationsService';
export { activityService, trackActivitySafe, trackCappedStudentActivitySafe } from './activityService';
export {
	setupNotificationChannel,
	registerForPushNotifications,
	addForegroundNotificationListener,
	addNotificationResponseListener,
	showLocalNotification,
} from './pushNotifications';

// Export types
export * from './types';

// Export API client (for custom requests if needed)
export { default as apiClient } from './apiClient';

// Export Supabase client (for auth)
export { supabase, getAccessToken, signOutUser, onAuthStateChange } from './supabase';
