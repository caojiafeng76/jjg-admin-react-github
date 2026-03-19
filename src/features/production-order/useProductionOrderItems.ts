import { useQuery } from '@tanstack/react-query'

import {
  getProductionOrderItems,
  addProductionOrderItem,
  updateProductionOrderItem,
  deleteProductionOrderItems,
} from '@/services/apiProductionOrderItems'
import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'

const PRODUCTION_ORDER_ITEMS_KEY = 'production-order-items' as const

export function useProductionOrderItems(orderId: string | undefined) {
  return useQuery({
    queryKey: [PRODUCTION_ORDER_ITEMS_KEY, orderId],
    queryFn: () => getProductionOrderItems(orderId!),
    enabled: !!orderId,
    ...queryConfig.list,
  })
}

export function useAddProductionOrderItem() {
  return useMutationWithInvalidation({
    mutationFn: addProductionOrderItem,
    invalidateQueries: [[PRODUCTION_ORDER_ITEMS_KEY], ['production-orders']],
  })
}

export function useUpdateProductionOrderItem() {
  return useMutationWithInvalidation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string
      values: Parameters<typeof updateProductionOrderItem>[0]['values']
    }) => updateProductionOrderItem({ id, values }),
    invalidateQueries: [[PRODUCTION_ORDER_ITEMS_KEY], ['production-orders']],
  })
}

export function useDeleteProductionOrderItems() {
  return useMutationWithInvalidation({
    mutationFn: deleteProductionOrderItems,
    invalidateQueries: [[PRODUCTION_ORDER_ITEMS_KEY], ['production-orders']],
  })
}
