import { useQuery } from '@tanstack/react-query'
import { queryConfig } from '@/config/queryClient'
import { getRoles } from '@/services/apiRoles'
import { useMutationWithMessage } from '@hooks/useMutationWithMessage'
import { createRole, deleteRole } from '@/services/apiRoles'

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
    ...queryConfig.list,
  })
}

export function useCreateRole() {
  return useMutationWithMessage({
    mutationFn: createRole,
    invalidateQueries: [['roles'], ['role-permissions']],
    successMessage: '角色已创建',
    errorMessage: '角色创建失败',
  })
}

export function useDeleteRole() {
  return useMutationWithMessage({
    mutationFn: (key: string) => deleteRole(key),
    invalidateQueries: [['roles'], ['role-permissions']],
    successMessage: '角色已删除',
    errorMessage: '角色删除失败',
  })
}
