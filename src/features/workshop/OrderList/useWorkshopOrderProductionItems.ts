import { useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { getPrecisionCuttingTransferItemsByProjectNo } from '@/services/apiPrecisionCuttingTransfers'
import { getProductionItemsByProjectNo } from '@/services/apiProductionOrders'

export function useWorkshopOrderProductionItems(
  projectNo: string | null | undefined,
) {
  return useQuery({
    queryKey: ['workshop-order-production-items', projectNo],
    queryFn: async () => {
      const [productionItems, precisionCuttingItems] = await Promise.all([
        getProductionItemsByProjectNo(projectNo!),
        getPrecisionCuttingTransferItemsByProjectNo(projectNo!),
      ])

      return [...productionItems, ...precisionCuttingItems]
    },
    enabled: !!projectNo,
    ...queryConfig.list,
  })
}
