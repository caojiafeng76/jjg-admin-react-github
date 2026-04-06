import { useQuery } from '@tanstack/react-query'

import { getProductionItemsByProjectNo } from '@/services/apiProductionOrders'
import { queryConfig } from '@/config/queryClient'

export function useWorkshopOrderProductionItems(
  projectNo: string | null | undefined,
) {
  return useQuery({
    queryKey: ['workshop-order-production-items', projectNo],
    queryFn: () => getProductionItemsByProjectNo(projectNo!),
    enabled: !!projectNo,
    ...queryConfig.list,
  })
}
