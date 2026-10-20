import type { PermissionMap } from '@/types/permission'

import { createContext, use } from 'react'

export interface PermissionContextValue {
  permissions: PermissionMap
  isLoading: boolean
  can: (key: string) => boolean
  canAll: (keys: string[]) => boolean
}

export const PermissionContext = createContext<PermissionContextValue | undefined>(
  undefined,
)

export function usePermissionContext(): PermissionContextValue {
  const ctx = use(PermissionContext)
  if (!ctx) {
    throw new Error(
      'usePermissionContext must be used within a PermissionProvider',
    )
  }
  return ctx
}
