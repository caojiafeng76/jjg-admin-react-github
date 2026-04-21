import { useQuery } from '@tanstack/react-query'
import { queryConfig } from '@/config/queryClient'
import { getUserPermissionOverrides } from '@/services/apiPermissions'

export function useUserPermissionOverrides(employeeId: string | null) {
  return useQuery({
    queryKey: ['user-permission-overrides', employeeId],
    queryFn: () => getUserPermissionOverrides(employeeId!),
    enabled: !!employeeId,
    ...queryConfig.list,
  })
}
