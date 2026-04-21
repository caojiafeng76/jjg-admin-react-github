import { useMutationWithMessage } from '@hooks/useMutationWithMessage'
import { setUserPermissionOverrides } from '@/services/apiPermissions'

export function useUpdateUserPermissions() {
  return useMutationWithMessage({
    mutationFn: ({
      employeeId,
      overrides,
    }: {
      employeeId: string
      overrides: Array<{ permissionId: string; enabled: boolean }>
    }) => setUserPermissionOverrides(employeeId, overrides),
    invalidateQueries: [['user-permission-overrides'], ['my-permissions']],
    successMessage: '用户权限覆盖已保存',
    errorMessage: '用户权限覆盖保存失败',
  })
}
