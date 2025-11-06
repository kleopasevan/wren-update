'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { authApi, User } from '../api/auth'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Load user on mount
  useEffect(() => {
    loadUser()
  }, [])

  async function loadUser() {
    try {
      const token = localStorage.getItem('access_token')
      if (token) {
        const userData = await authApi.getMe()
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
      }
    } catch (error) {
      console.error('Failed to load user:', error)
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
    } finally {
      setIsLoading(false)
    }
  }

  async function login(email: string, password: string) {
    try {
      const authResponse = await authApi.login({ email, password })
      localStorage.setItem('access_token', authResponse.access_token)

      const userData = await authApi.getMe()
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))

      router.push('/workspaces')
    } catch (error) {
      throw error
    }
  }

  async function register(email: string, password: string, fullName?: string) {
    try {
      await authApi.register({
        email,
        password,
        full_name: fullName,
      })

      // Auto-login after registration
      await login(email, password)
    } catch (error) {
      throw error
    }
  }

  function logout() {
    authApi.logout()
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
