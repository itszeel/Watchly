'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

const VALID_USERNAME = 'zeel562'
const VALID_PASSWORD = 'Z33l562!@'

interface AuthState {
  user: string | null
  login: (username: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthState>({
  user: null,
  login: () => false,
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

  const login = useCallback((username: string, password: string): boolean => {
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      sessionStorage.setItem('watchly_user', username)
      setUser(username)
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem('watchly_user')
    setUser(null)
  }, [])

  return <AuthContext value={{ user, login, logout }}>{children}</AuthContext>
}
