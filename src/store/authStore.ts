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
    try {
      set({ isLoading: true, error: null })

      console.log('🔐 [authStore] Checking authentication...')

      // Check if user has active Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        throw sessionError
      }

      if (session?.access_token) {
        console.log('🔐 [authStore] Active session found, fetching user data...')
        
        // Get current user from backend using JWT
        const response = await authService.getCurrentUser()
        const backendUser = response.data
        const authUser = convertToAuthUser(backendUser)

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
      console.error('❌ [authStore] Auth check failed:', error)
      set({ user: null, isAuthenticated: false })
      await AsyncStorage.removeItem(STORAGE_KEY)
    } finally {
      set({ isLoading: false })
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
      const authUser = convertToAuthUser(backendUser)

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
      const authUser = convertToAuthUser(backendUser)

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

// Listen for Supabase auth state changes
// This ensures the store stays in sync with Supabase auth state
onAuthStateChange((event, session) => {
  console.log('🔐 [authStore] Supabase auth state changed:', event)
  
  if (event === 'SIGNED_OUT') {
    useAuthStore.getState().setUser(null)
  } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    // Refresh user data when signed in or token refreshed
    useAuthStore.getState().checkAuth()
  }
})
