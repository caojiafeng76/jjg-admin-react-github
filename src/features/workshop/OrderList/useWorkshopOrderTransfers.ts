import { useQuery } from '@tanstack/react-query'

import { getTransferStatsByProjectNo } from '@/services/apiMaterialTransfers'
import { queryConfig } from '@/config/queryClient'

export function useWorkshopOrderTransfers(
  projectNo: string | null | undefined,
) {
  return useQuery({
    queryKey: ['workshop-order-transfers', projectNo],
    queryFn: () => getTransferStatsByProjectNo(projectNo!),
    enabled: !!projectNo,
    ...queryConfig.list,
  })
}
