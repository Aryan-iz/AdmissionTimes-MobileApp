/**
 * AuthContext - Authentication management for the Admission Times mobile app
 * 
 * SCOPE NOTE: This mobile app currently supports ONLY the Student role.
 * Admin and University Representative roles are intentionally disabled in this phase
 * and planned as future work. This is a deliberate scope decision for the FYP demonstration.
 * 
 * Any attempt to login with university or admin credentials will be blocked.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type UserRole = 'student' | 'university' | 'admin'

export type AuthUser = {
  id: string
  name: string
  email: string
  role: UserRole
  phone?: string
  city?: string
  university?: string
  degree?: string
}

type AuthStatus = 'loading' | 'signedOut' | 'signedIn'

type LoginInput = {
  email: string
  password: string
}

type AuthContextValue = {
  status: AuthStatus
  user: AuthUser | null
  login: (input: LoginInput) => Promise<{ ok: true } | { ok: false; message: string }>
  logout: () => Promise<void>
  updateUserProfile?: (userData: Partial<AuthUser>) => Promise<void>
}

const STORAGE_KEY = 'admissiontimes.auth.user'

// STUDENT-ONLY AUTHENTICATION
// Currently, only the student account is active in this mobile app.
// University and Admin accounts exist in the structure but are disabled
// to maintain clean scope for the FYP demonstration.
const MOCK_ACCOUNTS: Array<{ user: AuthUser; password: string }> = [
  {
    user: { 
      id: 'stu_01', 
      name: 'Aryan Izhar', 
      email: 'student@demo.com', 
      role: 'student',
      phone: '+92 300 1234567',
      city: 'Islamabad',
      university: 'FAST University',
      degree: 'BS Computer Science'
    },
    password: 'student123',
  },
  // University and Admin accounts are commented out - not supported in this phase
  // {
  //   user: { id: 'uni_01', name: 'University Rep', email: 'university@demo.com', role: 'university' },
  //   password: 'university123',
  // },
  // {
  //   user: { id: 'adm_01', name: 'Admin User', email: 'admin@demo.com', role: 'admin' },
  //   password: 'admin123',
  // },
]

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    let mounted = true
    const restore = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY)
        if (!mounted) return
        if (!raw) {
          setUser(null)
          setStatus('signedOut')
          return
        }
        const parsed = JSON.parse(raw) as AuthUser
        setUser(parsed)
        setStatus('signedIn')
      } catch {
        if (!mounted) return
        setUser(null)
        setStatus('signedOut')
      }
    }
    restore()
    return () => {
      mounted = false
    }
  }, [])

  const login = useCallback(async (input: LoginInput) => {
    const email = input.email.trim().toLowerCase()

    const match = MOCK_ACCOUNTS.find(
      (acc) => acc.user.email.toLowerCase() === email && acc.password === input.password,
    )

    if (!match) {
      return { ok: false as const, message: 'Invalid email or password.' }
    }

    // Additional check: Only allow student role in this app version
    if (match.user.role !== 'student') {
      return { 
        ok: false as const, 
        message: 'This app currently supports Student access only. Admin and University modules are planned for future phases.' 
      }
    }

    setUser(match.user)
    setStatus('signedIn')
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(match.user))
    return { ok: true as const }
  }, [])

  const logout = useCallback(async () => {
    setUser(null)
    setStatus('signedOut')
    await AsyncStorage.removeItem(STORAGE_KEY)
  }, [])

  const updateUserProfile = useCallback(async (userData: Partial<AuthUser>) => {
    if (!user) return
    
    const updatedUser = { ...user, ...userData }
    setUser(updatedUser)
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser))
  }, [user])

  const value: AuthContextValue = useMemo(
    () => ({
      status,
      user,
      login,
      logout,
      updateUserProfile,
    }),
    [status, user, login, logout, updateUserProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
