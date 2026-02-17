import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type UserRole = 'student' | 'university' | 'admin'

export type AuthUser = {
  id: string
  name: string
  email: string
  role: UserRole
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
}

const STORAGE_KEY = 'admissiontimes.auth.user'

// No backend: simple mock accounts (adjust to match your web credentials if you have them).
const MOCK_ACCOUNTS: Array<{ user: AuthUser; password: string }> = [
  {
    user: { id: 'stu_01', name: 'Student User', email: 'student@demo.com', role: 'student' },
    password: 'student123',
  },
  {
    user: { id: 'uni_01', name: 'University Rep', email: 'university@demo.com', role: 'university' },
    password: 'university123',
  },
  {
    user: { id: 'adm_01', name: 'Admin User', email: 'admin@demo.com', role: 'admin' },
    password: 'admin123',
  },
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

  const value: AuthContextValue = useMemo(
    () => ({
      status,
      user,
      login,
      logout,
    }),
    [status, user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
