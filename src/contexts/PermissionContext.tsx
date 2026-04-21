import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'

import type { PermissionMap } from '@/types/permission'
import {
  getMyPermissions,
  syncPermissionRegistry,
} from '@/services/apiPermissions'
import { PERMISSION_REGISTRY } from '@/config/permissionRegistry'
import { useAuth } from './useAuth'

export type PermissionContextValue = {
  permissions: PermissionMap
  isLoading: boolean
  can: (key: string) => boolean
  canAll: (keys: string[]) => boolean
}

const PermissionContext = createContext<PermissionContextValue | undefined>(
  undefined,
)

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { user, role, loading: authLoading } = useAuth()
  const enabled = !authLoading && !!user

  const { data: permissions = {}, isLoading } = useQuery({
    queryKey: ['my-permissions'],
    queryFn: getMyPermissions,
    enabled,
    staleTime: 5 * 60 * 1000, // 5分钟
  })

  // admin 用户权限加载完成后，静默同步权限注册表到数据库
  useEffect(() => {
    if (role !== 'admin' || isLoading || !enabled) return
    if (PERMISSION_REGISTRY.length === 0) return
    syncPermissionRegistry(PERMISSION_REGISTRY).catch((err) => {
      console.error('[PermissionContext] syncPermissionRegistry error:', err)
    })
  }, [role, isLoading, enabled])

  const can = (key: string) => permissions[key] === true

  const canAll = (keys: string[]) => keys.every((k) => permissions[k] === true)

  return (
    <PermissionContext.Provider value={{ permissions, isLoading, can, canAll }}>
      {children}
    </PermissionContext.Provider>
  )
}

export function usePermissionContext(): PermissionContextValue {
  const ctx = useContext(PermissionContext)
  if (!ctx) {
    throw new Error(
      'usePermissionContext must be used within a PermissionProvider',
    )
  }
  return ctx
}
