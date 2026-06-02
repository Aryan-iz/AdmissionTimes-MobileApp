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
import { authService, supabase, signOutUser, onAuthStateChange } from '../services'
import { resetStudentSession } from './sessionCleanup'
import type { User } from '../services/types'

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

      console.log('🔐 [authStore] Checking authentication...')

      // Check if user has active Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        if (isStaleAuthError(sessionError)) {
          console.warn('⚠️ [authStore] Stale session cleared (invalid refresh token)')
          await clearStaleAuthSession(set)
          return
        }
        throw sessionError
      }

      if (session?.access_token) {
        console.log('🔐 [authStore] Active session found, fetching user data...')
        
        // Get current user from backend using JWT
        const response = await authService.getCurrentUser()
        const backendUser = response.data
        const authUser = await assertStudentRole(convertToAuthUser(backendUser))

        console.log('✅ [authStore] User authenticated:', authUser.email)

        // Persist to storage
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))

        set({ user: authUser, isAuthenticated: true })
      } else {
        console.log('⚠️ [authStore] No active session')
        set({ user: null, isAuthenticated: false })
        await AsyncStorage.removeItem(STORAGE_KEY)
      }
    } catch (error: any) {
      if (isStaleAuthError(error)) {
        console.warn('⚠️ [authStore] Stale session cleared during auth check')
        await clearStaleAuthSession(set)
        return
      }

      console.error('❌ [authStore] Auth check failed:', error)

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

      console.log('🔐 [authStore] Signing in:', data.email)

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

      console.log('✅ [authStore] Supabase authentication successful')

      // Fetch user from backend
      const response = await authService.getCurrentUser()
      const backendUser = response.data
      const authUser = await assertStudentRole(convertToAuthUser(backendUser))

      console.log('✅ [authStore] User data received:', authUser.email, '- Role:', authUser.role)

      // Persist to storage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))

      set({ user: authUser, isAuthenticated: true, error: null })

      if (options?.onSuccess) {
        options.onSuccess(authUser)
      }
    } catch (error: any) {
      console.error('❌ [authStore] Sign in failed:', error)
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

      console.log('🔐 [authStore] Signing up user:', data.email)

      const email = data.email.trim().toLowerCase()
      const password = data.password

      // Create user in Supabase Auth
      const { data: signUpResult, error: supabaseError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: data.user_type,
            university_id: data.university_id || null,
            display_name: data.display_name || null,
          },
        },
      })

      if (supabaseError) {
        throw supabaseError
      }

      const authUserId = signUpResult.user?.id

      if (!authUserId) {
        throw new Error('Failed to create account in Supabase')
      }

      console.log('✅ [authStore] Supabase user created:', authUserId)

      // Create user in database  
      try {
        await authService.signUp({
          ...data,
          auth_user_id: authUserId,
        })
        console.log('✅ [authStore] User created in database')
      } catch (backendError: any) {
        console.warn('⚠️ [authStore] Database user creation failed (JWT middleware will auto-create):', backendError)
        // JWT middleware will auto-create the user on first authenticated request
      }

      if (options?.onSuccess) {
        options.onSuccess()
      }
    } catch (error: any) {
      console.error('❌ [authStore] Sign up failed:', error)
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

      console.log('🔐 [authStore] Signing out user...')

      // Sign out from Supabase
      await signOutUser()

      // Clear storage
      await AsyncStorage.removeItem(STORAGE_KEY)

      resetStudentSession()

      set({ user: null, isAuthenticated: false, error: null })

      console.log('✅ [authStore] User signed out successfully')

      if (options?.onSuccess) {
        options.onSuccess()
      }
    } catch (error) {
      console.error('❌ [authStore] Sign out failed:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  // Set User
  setUser: (user) => {
    set({ user, isAuthenticated: !!user })
    if (user) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
      AsyncStorage.removeItem(STORAGE_KEY)
    }
  },

  // Refresh User (fetch latest user data from backend)
  refreshUser: async () => {
    try {
      console.log('🔄 [authStore] Refreshing user data...')
      
      const response = await authService.getCurrentUser()
      const backendUser = response.data
      const authUser = await assertStudentRole(convertToAuthUser(backendUser))

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
      set({ user: authUser })

      console.log('✅ [authStore] User data refreshed')
    } catch (error) {
      console.error('❌ [authStore] Failed to refresh user:', error)
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
  console.log('🔐 [authStore] Supabase auth state changed:', event)

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
