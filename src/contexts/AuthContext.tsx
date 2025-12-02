import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'

import supabase from '@/services/supabase'

type AuthContextValue = {
  user: User | null
  loading: boolean
  error: Error | null
  clearError: () => void
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    // 初始化时获取当前用户
    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!mounted) return

        if (error) {
          console.error('Auth getUser error:', error)
          setError(error)
          setUser(null)
          return
        }

        setUser(data.user ?? null)
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })

    // 监听登录状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const clearError = () => setError(null)

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Auth signIn error:', error)
      setError(error)
      setLoading(false)
      throw error
    }

    setUser(data.user ?? null)
    setLoading(false)
  }

  const signOut = async () => {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Auth signOut error:', error)
      setError(error)
      setLoading(false)
      throw error
    }

    setUser(null)
    setLoading(false)
  }

  const value: AuthContextValue = {
    user,
    loading,
    error,
    clearError,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

