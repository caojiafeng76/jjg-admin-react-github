import { useQuery } from '@tanstack/react-query'

import {
  getProductionOrderItems,
  addProductionOrderItem,
  updateProductionOrderItem,
  deleteProductionOrderItems,
} from '@/services/apiProductionOrderItems'
import { queryConfig } from '@/config/queryClient'
import { useMutationWithMessage } from '@/hooks/useMutationWithMessage'

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
  return useMutationWithMessage({
    mutationFn: addProductionOrderItem,
    invalidateQueries: [[PRODUCTION_ORDER_ITEMS_KEY], ['production-orders']],
    successMessage: '添加工单明细成功',
  })
}

export function useUpdateProductionOrderItem() {
  return useMutationWithMessage({
    mutationFn: ({
      id,
      values,
    }: {
      id: string
      values: Parameters<typeof updateProductionOrderItem>[0]['values']
    }) => updateProductionOrderItem({ id, values }),
    invalidateQueries: [[PRODUCTION_ORDER_ITEMS_KEY], ['production-orders']],
    successMessage: '更新工单明细成功',
  })
}

export function useDeleteProductionOrderItems() {
  return useMutationWithMessage({
    mutationFn: deleteProductionOrderItems,
    invalidateQueries: [[PRODUCTION_ORDER_ITEMS_KEY], ['production-orders']],
    successMessage: '删除工单明细成功',
  })
}
