import { createContext, useContext, useEffect, useState, useRef } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'

import supabase from '@/services/supabase'
import type { Employee } from '@/services/apiEmployees'
import { getCurrentEmployeeProfile } from '@/services/apiEmployees'
import type { AppRole } from '@/config/access'

type AuthContextValue = {
  user: User | null
  employeeProfile: Employee | null
  role: AppRole | null
  loading: boolean
  error: Error | null
  clearError: () => void
  signIn: (email: string, password: string) => Promise<void>
  changePassword: (currentPassword: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [employeeProfile, setEmployeeProfile] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const initializedRef = useRef(false)
  const currentUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    currentUserIdRef.current = user?.id ?? null
  }, [user])

  const loadEmployeeProfile = async (nextUser: User | null) => {
    if (!nextUser) {
      setEmployeeProfile(null)
      return null
    }

    try {
      const profile = await getCurrentEmployeeProfile(nextUser.id)
      setEmployeeProfile(profile)
      return profile
    } catch (profileError) {
      const normalizedError =
        profileError instanceof Error
          ? profileError
          : new Error('获取当前员工信息失败')

      setError(normalizedError)
      setEmployeeProfile(null)
      return null
    }
  }

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
          setEmployeeProfile(null)
        } else {
          const nextUser = data.user ?? null
          setUser(nextUser)
          return loadEmployeeProfile(nextUser)
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
        const nextUser = session?.user ?? null
        const nextUserId = nextUser?.id ?? null
        const isSameUser = currentUserIdRef.current === nextUserId

        if (event === 'SIGNED_IN' && isSameUser) {
          setUser(nextUser)
          return
        }

        if (
          event === 'SIGNED_IN' ||
          event === 'SIGNED_OUT' ||
          event === 'USER_UPDATED'
        ) {
          setLoading(true)
          setUser(nextUser)

          void loadEmployeeProfile(nextUser).finally(() => {
            if (mounted) {
              setLoading(false)
            }
          })

          return
        }

        setUser(nextUser)
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
    } catch (error) {
      setLoading(false)
      throw error
    } finally {
      // 登录成功时，loading 由 onAuthStateChange + loadEmployeeProfile 结束。
      // 这里不主动关闭，避免 role 尚未加载完成就触发前端分流误判。
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
    setEmployeeProfile(null)
    setLoading(false)
  }

  const changePassword = async (currentPassword: string, password: string) => {
    setError(null)

    if (!user?.email) {
      const nextError = new Error('当前账号缺少邮箱信息，无法验证原密码')
      setError(nextError)
      throw nextError
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (signInError) {
      console.error('Auth verifyCurrentPassword error:', signInError)
      setError(signInError)
      throw signInError
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      console.error('Auth changePassword error:', error)
      setError(error)
      throw error
    }
  }

  const role = (employeeProfile?.role || null) as AppRole | null

  const value: AuthContextValue = {
    user,
    employeeProfile,
    role,
    loading,
    error,
    clearError,
    signIn,
    changePassword,
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
