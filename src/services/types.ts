/**
 * API Type Definitions
 * 
 * TypeScript types matching the backend API response structures.
 * These types ensure type safety when working with API responses.
 * 
 * IMPORTANT: These types MUST match the backend API contract exactly.
 */

/**
 * Base API response structure
 * All successful API responses follow this format
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

/**
 * Paginated API response structure
 * Used for list endpoints that support pagination
 */
export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
}

/**
 * API error response structure
 * Standardized error format from backend
 */
export interface ApiError {
  success: false;
  message: string;
  errors?: { [field: string]: string };
  timestamp: string;
}

/**
 * User entity
 * Represents an authenticated user
 */
export interface User {
  id: string;
  email: string;
  role: 'student' | 'university' | 'admin';
  display_name?: string;
  university_id?: string;
  organization_id?: string;
  auth_user_id?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Admission as returned by the API (GET /admissions, /admissions/:id, dashboard).
 *
 * Raw columns plus the backend "contract" fields (contract_version >= 3), which
 * are display-ready and identical for web and mobile. Render the contract fields;
 * do not re-derive them in the app.
 */
export interface Admission {
  id: string;
  university_id?: string | null;
  title: string;
  description?: string | null;
  program_type?: string | null;
  degree_level?: string | null;
  field_of_study?: string | null;
  duration?: string | null;
  tuition_fee?: number | string | null;
  application_fee?: number | string | null;
  currency?: string | null;
  deadline?: string | null;
  start_date?: string | null;
  location?: string | null;
  delivery_mode?: string | null;
  requirements?: Record<string, unknown> | null;
  verification_status: 'draft' | 'pending' | 'verified' | 'rejected';
  data_origin?: string | null;
  source_url?: string | null;
  created_at: string;
  updated_at: string;
  is_active?: boolean;

  // Joined from universities
  university_name?: string | null;
  university_logo_url?: string | null;
  university_city?: string | null;
  university_country?: string | null;
  university_website?: string | null;

  // Contract fields (backend shared/utils/admissionContract.ts)
  contract_version?: number;
  source?: 'university' | 'scraper';
  degree_label?: string;
  degree_type?: string;
  deadline_iso?: string | null;
  has_deadline?: boolean;
  days_remaining?: number;
  program_status?: 'Open' | 'Closing Soon' | 'Closed';
  fee_amount?: number | null;
  fee_display?: string;
  location_display?: string | null;
  eligibility_text?: string | null;
  university_website_url?: string | null;
  admission_portal_url?: string | null;
  source_announcement_url?: string | null;
  primary_apply_url?: string | null;
  programs_offered?: string[];
  status_label?: 'Verified' | 'Pending' | 'Closed' | 'Draft';

  // Per-student fields (dashboard / recommendations)
  saved?: boolean;
  alert_enabled?: boolean;
  match_score?: number;
  match_reason?: string;
  match_label?: string;
}

/**
 * University entity
 */
export interface University {
  id: string;
  name: string;
  logo_url?: string | null;
  city?: string | null;
  country?: string | null;
  website?: string | null;
}

/**
 * Watchlist entity
 * Represents a saved/favorited admission program
 */
export interface Watchlist {
  id: string;
  user_id: string;
  admission_id: string;
  notes?: string | null;
  alert_opt_in?: boolean;
  created_at: string;
  admission?: Admission;
}

/**
 * Notification entity (GET /notifications)
 */
export interface Notification {
  id: string;
  recipient_id?: string;
  role_type: 'student' | 'university' | 'admin';
  notification_type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  is_read: boolean;
  read_at?: string | null;
  action_url?: string | null;
  created_at: string;
}

/**
 * Deadline entity
 */
export interface Deadline {
  id: string;
  admission_id: string;
  deadline_type: 'application' | 'decision' | 'enrollment' | 'fee_payment' | 'custom';
  deadline_date: string;
  reminder_sent?: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  admission?: Admission;
}

/**
 * Student Dashboard Data
 * Aggregated data for student dashboard (matches backend response)
 */
export interface StudentDashboard {
  stats: {
    active_admissions: number;
    saved_count: number;
    upcoming_deadlines: number;
    recommendations_count: number;
    unread_notifications: number;
    urgent_deadlines: number;
  };
  recommended_programs: Admission[];
  upcoming_deadlines: Array<{
    id: string;
    admission_id: string;
    university_name: string;
    program_title: string;
    deadline: string;
    days_remaining: number;
    urgency_level: 'low' | 'medium' | 'high' | 'urgent';
    saved: boolean;
    alert_enabled: boolean;
  }>;
  recent_notifications: Array<{
    id: string;
    category: 'verification' | 'deadline' | 'system' | 'update';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    action_url: string | null;
  }>;
  recent_activity: Array<{
    type: 'notification' | 'saved' | 'alert' | 'deadline';
    action: string;
    timestamp: string;
    related_entity_id?: string;
    related_entity_type?: string;
  }>;
}

/**
 * Auth response
 */
export interface AuthResponse {
  user: User;
  message: string;
}

/**
 * Sign up data
 */
/** Profile creation after Supabase signup (POST /auth/signup). Students only. */
export interface SignUpData {
  email: string;
  user_type: 'student';
  display_name?: string;
  auth_user_id: string;
}

/**
 * Sign in data
 */
export interface SignInData {
  email: string;
  password: string;
}
