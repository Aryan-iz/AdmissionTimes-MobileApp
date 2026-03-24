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
 * Admission/Program entity
 * Represents a university admission program
 */
export interface Admission {
  id: string;
  title: string;
  description?: string | null;
  field_of_study?: string | null;
  location?: string | null;
  delivery_mode?: 'On-campus' | 'Online' | 'Hybrid' | null;
  degree_level?: string | null;
  program_type?: string | null;
  duration?: string | null;
  tuition_fee?: number | null;
  application_fee?: number | null;
  currency?: string | null;
  deadline?: string | null;
  start_date?: string | null;
  requirements?: {
    eligibility?: string;
    documents?: string[];
    highlights?: string[];
    importantDates?: Record<string, string>;
    feeStructure?: Record<string, any>;
    officialLinks?: string[];
  } | null;
  verification_status: 'draft' | 'pending' | 'verified' | 'rejected';
  verified_at?: string | null;
  verified_by?: string | null;
  rejection_reason?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  is_active?: boolean;
  university_id?: string | null;
  university_name?: string | null; // Included in joined queries
  universities?: University | null;
  // Additional fields for dashboard responses
  saved?: boolean; // Indicates if user has saved/watchlisted this admission
  alert_enabled?: boolean; // Indicates if user has enabled alerts for this admission
  match_score?: number; // Recommendation match score
  match_reason?: string; // Reason for recommendation
  days_remaining?: number; // Days until deadline
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
 * Notification entity
 */
export interface Notification {
  id: string;
  user_type: 'student' | 'university' | 'admin';
  category: 'verification' | 'deadline' | 'system' | 'update';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  related_entity_type?: 'admission' | 'deadline' | 'user' | null;
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
export interface SignUpData {
  email: string;
  password: string;
  user_type: 'student' | 'university' | 'admin';
  display_name?: string;
  university_id?: string;
  auth_user_id?: string;
}

/**
 * Sign in data
 */
export interface SignInData {
  email: string;
  password: string;
}
