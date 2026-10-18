import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { apiFetch, getStoredToken, setStoredToken } from '../api/client'
import type { AuthUser } from '../types'

type AuthState = {
  user: AuthUser | null
  loading: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthState | null>(null)

async function openSession(): Promise<AuthUser> {
  const res = await apiFetch<{ token: string; user: AuthUser }>('/api/auth/session', {
    method: 'POST',
  })
  setStoredToken(res.token)
  return res.user
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const token = getStoredToken()
        if (token) {
          try {
            const res = await apiFetch<{ user: AuthUser }>('/api/auth/me')
            setUser(res.user)
            return
          } catch {
            setStoredToken(null)
          }
        }
        setUser(await openSession())
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAdmin: user?.role === 'admin',
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth requires AuthProvider')
  return ctx
}
