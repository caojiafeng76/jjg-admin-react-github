import { useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { getTransferStatsByProjectNo } from '@/services/apiMaterialTransfers'

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
