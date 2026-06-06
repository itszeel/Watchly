'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface AuthState {
  user: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthState>({
  user: null,
  login: async () => false,
  logout: () => {},
})

export function useAuth(): AuthState {
  return useContext(AuthContext)
}

export default function AuthProvider({ children }: { children: ReactNode }): ReactNode {
  const [user, setUser] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return sessionStorage.getItem('watchly_user')
  })

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) return false

      const data = await res.json()
      sessionStorage.setItem('watchly_user', data.user)
      setUser(data.user)
      return true
    } catch {
      return false
    }
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem('watchly_user')
    setUser(null)
  }, [])

  return <AuthContext value={{ user, login, logout }}>{children}</AuthContext>
}
