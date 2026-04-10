import { createContext } from 'react'
import type { User } from '@supabase/supabase-js'

import type { Employee } from '@/services/apiEmployees'
import type { AppRole } from '@/config/access'

export type AuthContextValue = {
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

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
)