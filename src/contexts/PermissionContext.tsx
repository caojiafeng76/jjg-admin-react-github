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

  const { data: permissions = {}, isPending } = useQuery({
    // 必须把 user.id 放进 queryKey，避免不同账号在同浏览器切换时
    // 命中上一个用户的权限缓存，导致权限串号
    queryKey: ['my-permissions', user?.id ?? null],
    queryFn: getMyPermissions,
    enabled,
    staleTime: 5 * 60 * 1000, // 5分钟
  })

  // 真正的 isLoading 语义：「已启用但首次权限数据尚未到达」。
  // 不能直接用 useQuery 的 isLoading（= isPending && isFetching），因为 enabled
  // 从 false 切到 true 的那一帧 isFetching 还没起来，会让 RouteGuards 误判
  // permLoading=false + permissions={} → 立刻跳 /access-denied，刷新后才正常。
  const isLoading = enabled && isPending

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
