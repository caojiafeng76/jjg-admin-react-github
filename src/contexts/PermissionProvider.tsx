import { useEffect, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import {
  getMyPermissions,
  syncPermissionRegistry,
} from '@/services/apiPermissions'
import { PERMISSION_REGISTRY } from '@/config/permissionRegistry'
import { useAuth } from './useAuth'
import { PermissionContext } from './usePermissionContext'

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { user, role, loading: authLoading } = useAuth()
  const queryClient = useQueryClient()
  const enabled = !authLoading && !!user

  const { data: permissions = {}, isPending } = useQuery({
    queryKey: ['my-permissions', user?.id ?? null],
    queryFn: getMyPermissions,
    enabled,
    staleTime: 5 * 60 * 1000,
  })

  const isLoading = enabled && isPending

  useEffect(() => {
    if (role !== 'admin' || isLoading || !enabled) return
    if (PERMISSION_REGISTRY.length === 0) return
    syncPermissionRegistry(PERMISSION_REGISTRY)
      .then(() => {
        queryClient.invalidateQueries({
          queryKey: ['my-permissions', user?.id ?? null],
        })
      })
      .catch((err) => {
        console.error('[PermissionContext] syncPermissionRegistry error:', err)
      })
  }, [role, isLoading, enabled, queryClient, user?.id])

  const can = (key: string) => permissions[key] === true

  const canAll = (keys: string[]) => keys.every((k) => permissions[k] === true)

  return (
    <PermissionContext.Provider value={{ permissions, isLoading, can, canAll }}>
      {children}
    </PermissionContext.Provider>
  )
}
