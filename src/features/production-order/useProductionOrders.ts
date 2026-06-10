import { useQuery, keepPreviousData } from '@tanstack/react-query'

import {
  getProductionOrders,
  getProductionOrderById,
  createProductionOrder,
  updateProductionOrder,
  updateProductionOrders,
  deleteProductionOrders,
  type ProductionOrderShift,
} from '@/services/apiProductionOrders'
import type { ProductionOrderDataCategory } from '@/services/apiProductionOrderItems'
import { queryConfig } from '@/config/queryClient'
import { useMutationWithMessage } from '@/hooks/useMutationWithMessage'

const PRODUCTION_ORDERS_KEY = 'production-orders' as const

interface ProductionOrderQueryOptions {
  enabled?: boolean
  realtime?: boolean
}

export function useProductionOrders({
  page,
  pageSize,
  filters,
  options,
}: {
  page: number
  pageSize: number
  filters: {
    startDate?: string
    endDate?: string
    employeeId?: string
    shift?: ProductionOrderShift
    dataCategory?: ProductionOrderDataCategory
    productModel?: string
    customerModel?: string
    isAudited?: boolean
  }
  options?: ProductionOrderQueryOptions
}) {
  return useQuery({
    queryKey: [PRODUCTION_ORDERS_KEY, page, pageSize, filters],
    queryFn: () => getProductionOrders({ page, pageSize, ...filters }),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    ...(options?.realtime ? queryConfig.realtime : queryConfig.list),
  })
}

export function useProductionOrder(
  id: string | undefined,
  options?: ProductionOrderQueryOptions,
) {
  return useQuery({
    queryKey: [PRODUCTION_ORDERS_KEY, id],
    queryFn: () => getProductionOrderById(id!),
    enabled: (options?.enabled ?? true) && !!id,
    ...(options?.realtime ? queryConfig.realtime : queryConfig.detail),
  })
}

export function useCreateProductionOrder() {
  return useMutationWithMessage({
    mutationFn: createProductionOrder,
    invalidateQueries: [[PRODUCTION_ORDERS_KEY]],
    successMessage: '创建生产工单成功',
  })
}

export function useUpdateProductionOrder() {
  return useMutationWithMessage({
    mutationFn: ({
      id,
      values,
    }: {
      id: string
      values: Parameters<typeof updateProductionOrder>[0]['values']
    }) => updateProductionOrder({ id, values }),
    invalidateQueries: [[PRODUCTION_ORDERS_KEY]],
    successMessage: '更新生产工单成功',
  })
}

export function useDeleteProductionOrders() {
  return useMutationWithMessage({
    mutationFn: deleteProductionOrders,
    invalidateQueries: [[PRODUCTION_ORDERS_KEY]],
    successMessage: '删除生产工单成功',
  })
}

export function useBatchUpdateProductionOrders() {
  return useMutationWithMessage({
    mutationFn: ({
      ids,
      values,
    }: {
      ids: string[]
      values: Parameters<typeof updateProductionOrders>[0]['values']
    }) => updateProductionOrders({ ids, values }),
    invalidateQueries: [[PRODUCTION_ORDERS_KEY]],
    successMessage: '批量更新生产工单成功',
  })
}
