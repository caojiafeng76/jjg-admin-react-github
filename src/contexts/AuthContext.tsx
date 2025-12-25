import { createContext, useContext, useEffect, useState, useRef } from 'react'
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
  const initializedRef = useRef(false)

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
        } else {
          setUser(data.user ?? null)
        }
      })
      .finally(() => {
        if (!mounted) return
        initializedRef.current = true
        setLoading(false)
      })

    // 监听登录状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      // 只有在初始化完成后才处理状态变化，避免竞态条件
      if (initializedRef.current) {
        setUser(session?.user ?? null)
        // 登录/登出事件时，确保 loading 状态正确
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          setLoading(false)
        }
      }
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

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Auth signIn error:', error)
        setError(error)
        throw error
      }

      // 登录成功后，用户状态会通过 onAuthStateChange 自动更新
      // 这里不需要手动设置，避免与 onAuthStateChange 冲突
      setUser(data.user ?? null)
    } finally {
      // 确保 loading 状态被清除，即使发生错误
      setLoading(false)
    }
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

