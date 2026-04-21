import { useMutationWithMessage } from '@hooks/useMutationWithMessage'
import { setRolePermissions } from '@/services/apiPermissions'

export function useUpdateRolePermissions() {
  return useMutationWithMessage({
    mutationFn: ({
      role,
      permissionIds,
    }: {
      role: string
      permissionIds: string[]
    }) => setRolePermissions(role, permissionIds),
    invalidateQueries: [['role-permissions'], ['my-permissions']],
    successMessage: '角色权限已保存',
    errorMessage: '角色权限保存失败',
  })
}
