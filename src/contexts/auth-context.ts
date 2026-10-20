import type { User } from '@supabase/supabase-js'
import type { AppRole } from '@/config/access'

import type { Employee } from '@/services/apiEmployees'
import { createContext } from 'react'

export interface AuthContextValue {
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
