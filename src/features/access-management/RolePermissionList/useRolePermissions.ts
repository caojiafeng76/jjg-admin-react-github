import { useQuery } from '@tanstack/react-query'
import { queryConfig } from '@/config/queryClient'
import {
  getAllPermissions,
  getRolePermissionIds,
} from '@/services/apiPermissions'

export function useAllPermissions() {
  return useQuery({
    queryKey: ['permissions-all'],
    queryFn: getAllPermissions,
    ...queryConfig.list,
  })
}

export function useRolePermissionIds(role: string) {
  return useQuery({
    queryKey: ['role-permissions', role],
    queryFn: () => getRolePermissionIds(role),
    ...queryConfig.list,
  })
}
