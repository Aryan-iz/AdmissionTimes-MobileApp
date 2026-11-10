/**
 * Authentication Store (Zustand) - Mobile App
 * 
 * Complete authentication state management integrated with backend API.
 * Uses Supabase for authentication and backend API for user data.
 * 
 * REPLICATES WEB FRONTEND EXACTLY:
 * - Same authentication flow (Supabase + backend)
 * - Same state management pattern
 * - Same error handling
 * 
 * @module store/authStore
 */

import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { authService, supabase, signOutUser, onAuthStateChange, releasePushTokenForSignOut } from '../services'
import { resetStudentSession } from './sessionCleanup'
import type { User } from '../services/types'
import { createLogger } from '../utils/logger'

const log = createLogger('authStore')

// Re-export types
export type { SignInData, SignUpData } from '../services/types'

// Convert backend User to AuthUser (for compatibility with existing code)
export interface AuthUser {
  id: string
  name?: string
  email: string
  role: 'student' | 'university' | 'admin'
  phone?: string
  city?: string
  university?: string
  degree?: string
  display_name?: string
  university_id?: string
  organization_id?: string
}

interface AuthStoreState {
  // State
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  checkAuth: () => Promise<void>
  signIn: (data: { email: string; password: string }, options?: { 
    onSuccess?: (user: AuthUser) => void
    onError?: (message: string) => void
  }) => Promise<void>
  signUp: (data: { 
    email: string
    password: string
    user_type: 'student' | 'university' | 'admin'
    display_name: string
    university_id?: string
  }, options?: {
    onSuccess?: () => void
    onError?: (message: string) => void
  }) => Promise<void>
  signOut: (options?: { onSuccess?: () => void }) => Promise<void>
  setUser: (user: AuthUser | null) => void
  refreshUser: () => Promise<void>

  // Cleanup
  reset: () => void
}

// Older app versions stored the profile here; it is only removed now (never
// read: the session is always re-validated with the backend).
const STORAGE_KEY = 'admissiontimes.auth.user'
const AUTH_CHECK_THROTTLE_MS = 15000
const STUDENT_ONLY_MESSAGE = 'This mobile app currently supports student accounts only.'

let checkAuthInFlight: Promise<void> | null = null
let lastCheckAuthAt = 0

const authStoreGlobal = globalThis as typeof globalThis & {
  __admissionTimesAuthStateUnsubscribe?: (() => void) | null
}

/**
 * Convert backend User to AuthUser for compatibility
 */
const convertToAuthUser = (user: User): AuthUser => {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.display_name,
    display_name: user.display_name,
    university_id: user.university_id,
    organization_id: user.organization_id || user.university_id,
    // Additional fields can be added as needed
  }
}

const assertStudentRole = async (user: AuthUser) => {
  if (user.role !== 'student') {
    await signOutUser().catch(() => {})
    throw new Error(STUDENT_ONLY_MESSAGE)
  }

  return user
}

const isStaleAuthError = (error: unknown): boolean => {
  const message = String((error as { message?: string })?.message || '').toLowerCase()
  return (
    message.includes('refresh token') ||
    message.includes('invalid refresh') ||
    message.includes('session not found') ||
    message.includes('jwt expired')
  )
}

const clearStaleAuthSession = async (
  set: (partial: Partial<AuthStoreState>) => void
): Promise<void> => {
  try {
    await supabase.auth.signOut({ scope: 'local' })
  } catch {
    // Session may already be invalid on device.
  }
  await AsyncStorage.removeItem(STORAGE_KEY)
  resetStudentSession()
  set({ user: null, isAuthenticated: false, error: null, isLoading: false })
}

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
}

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  // Initial State
  ...initialState,

  // Check Authentication (on app start)  
  checkAuth: async () => {
    if (checkAuthInFlight) {
      return checkAuthInFlight
    }

    const runCheck = async () => {
    try {
      set({ isLoading: true, error: null })
      lastCheckAuthAt = Date.now()

      log.debug('Checking authentication...')

      // Check if user has active Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        if (isStaleAuthError(sessionError)) {
          log.warn('Stale session cleared (invalid refresh token)')
          await clearStaleAuthSession(set)
          return
        }
        throw sessionError
      }

      if (session?.access_token) {
        log.debug('Active session found, fetching user data...')
        
        // Get current user from backend using JWT
        const response = await authService.getCurrentUser()
        const backendUser = response.data
        const authUser = await assertStudentRole(convertToAuthUser(backendUser))

        log.debug('User authenticated', { role: authUser.role })

        set({ user: authUser, isAuthenticated: true })
      } else {
        log.debug('No active session')
        set({ user: null, isAuthenticated: false })
        await AsyncStorage.removeItem(STORAGE_KEY)
      }
    } catch (error: any) {
      if (isStaleAuthError(error)) {
        log.warn('Stale session cleared during auth check')
        await clearStaleAuthSession(set)
        return
      }

      log.error('Auth check failed:', error)

      const isNetworkError =
        error?.code === 'ECONNABORTED' ||
        error?.message?.toLowerCase?.().includes('timeout') ||
        (!!error?.request && !error?.response)

      if (isNetworkError) {
        const currentUser = get().user
        set({
          user: currentUser,
          isAuthenticated: !!currentUser,
          error: 'Backend is unreachable. Please verify backend host/network and try again.',
        })
      } else {
        set({ user: null, isAuthenticated: false })
        await AsyncStorage.removeItem(STORAGE_KEY)
      }
    } finally {
      set({ isLoading: false })
    }
    }

    checkAuthInFlight = runCheck()

    try {
      await checkAuthInFlight
    } finally {
      checkAuthInFlight = null
    }
  },

  // Sign In
  signIn: async (data, options) => {
    try {
      set({ isLoading: true, error: null })

      log.debug('Signing in')

      const email = data.email.trim().toLowerCase()
      const password = data.password

      // Authenticate with Supabase
      const { error: supabaseError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (supabaseError) {
        if (supabaseError.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email before signing in. Check your inbox for the verification link.')
        }
        throw supabaseError
      }

      log.debug('Supabase authentication successful')

      // Fetch user from backend
      const response = await authService.getCurrentUser()
      const backendUser = response.data
      const authUser = await assertStudentRole(convertToAuthUser(backendUser))

      log.debug('User data received', { role: authUser.role })

      set({ user: authUser, isAuthenticated: true, error: null })

      if (options?.onSuccess) {
        options.onSuccess(authUser)
      }
    } catch (error: any) {
      log.error('Sign in failed:', error)
      const errorMsg = error.message || error.response?.data?.message || 'Failed to sign in. Please check your credentials.'
      set({ error: errorMsg, isLoading: false })
      
      if (options?.onError) {
        options.onError(errorMsg)
      }
      
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  // Sign Up
  signUp: async (data, options) => {
    try {
      set({ isLoading: true, error: null })

      if (data.user_type !== 'student') {
        throw new Error(STUDENT_ONLY_MESSAGE)
      }

      log.debug('Signing up user')

      const email = data.email.trim().toLowerCase()
      const password = data.password

      // Create user in Supabase Auth
      const { data: signUpResult, error: supabaseError } = await supabase.auth.signUp({
        email,
        password,
        // Role is not sent as metadata: the backend assigns it (students only
        // via self-signup) and ignores token metadata for authorization.
        options: {
          data: { display_name: data.display_name?.trim() || null },
        },
      })

      if (supabaseError) {
        throw supabaseError
      }

      const authUserId = signUpResult.user?.id

      if (!authUserId) {
        throw new Error('Failed to create account in Supabase')
      }

      log.debug('Supabase user created:', authUserId)

      // Create user in database  
      try {
        // Credentials live in Supabase Auth only; never send the password here.
        await authService.signUp({
          email,
          display_name: data.display_name?.trim() || undefined,
          user_type: 'student',
          auth_user_id: authUserId,
        })
        log.debug('User created in database')
      } catch (backendError: any) {
        log.warn('Database user creation failed (JWT middleware will auto-create):', backendError)
        // JWT middleware will auto-create the user on first authenticated request
      }

      if (options?.onSuccess) {
        options.onSuccess()
      }
    } catch (error: any) {
      log.error('Sign up failed:', error)
      const errorMsg = error.message || error.response?.data?.message || 'Failed to create account'
      set({ error: errorMsg, isLoading: false })
      
      if (options?.onError) {
        options.onError(errorMsg)
      }
      
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  // Sign Out
  signOut: async (options) => {
    try {
      set({ isLoading: true })

      log.debug('Signing out user...')

      // Stop pushes to this device while the request can still authenticate.
      await releasePushTokenForSignOut().catch((error) => log.warn('Could not unregister push token:', error))

      // Sign out from Supabase
      await signOutUser()

      // Clear storage
      await AsyncStorage.removeItem(STORAGE_KEY)

      resetStudentSession()

      set({ user: null, isAuthenticated: false, error: null })

      log.debug('User signed out successfully')

      if (options?.onSuccess) {
        options.onSuccess()
      }
    } catch (error) {
      log.error('Sign out failed:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  // Set User
  setUser: (user) => {
    set({ user, isAuthenticated: !!user })
    if (!user) void AsyncStorage.removeItem(STORAGE_KEY)
  },

  // Refresh User (fetch latest user data from backend)
  refreshUser: async () => {
    try {
      log.debug('Refreshing user data...')
      
      const response = await authService.getCurrentUser()
      const backendUser = response.data
      const authUser = await assertStudentRole(convertToAuthUser(backendUser))
      set({ user: authUser })

      log.debug('User data refreshed')
    } catch (error) {
      log.error('Failed to refresh user:', error)
    }
  },

  // Reset
  reset: () => {
    set(initialState)
    AsyncStorage.removeItem(STORAGE_KEY)
  },
}))

if (authStoreGlobal.__admissionTimesAuthStateUnsubscribe) {
  authStoreGlobal.__admissionTimesAuthStateUnsubscribe()
}

authStoreGlobal.__admissionTimesAuthStateUnsubscribe = onAuthStateChange((event) => {
  log.debug('Supabase auth state changed:', event)

  const now = Date.now()
  const shouldSkipThrottledCheck = now - lastCheckAuthAt < AUTH_CHECK_THROTTLE_MS

  if (event === 'SIGNED_OUT') {
    useAuthStore.getState().setUser(null)
    resetStudentSession()
  } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
    if (shouldSkipThrottledCheck) {
      return
    }
    useAuthStore.getState().checkAuth()
  }
})
