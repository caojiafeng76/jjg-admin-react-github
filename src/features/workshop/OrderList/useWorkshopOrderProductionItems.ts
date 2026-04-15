import { useQuery } from '@tanstack/react-query'

import { getProductionItemsByProjectNo } from '@/services/apiProductionOrders'
import { getPrecisionCuttingTransferItemsByProjectNo } from '@/services/apiPrecisionCuttingTransfers'
import { queryConfig } from '@/config/queryClient'

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
