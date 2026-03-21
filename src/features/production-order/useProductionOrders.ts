import { useQuery, keepPreviousData } from '@tanstack/react-query'

import {
  getProductionOrders,
  getProductionOrderById,
  createProductionOrder,
  updateProductionOrder,
  deleteProductionOrders,
} from '@/services/apiProductionOrders'
import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'

const PRODUCTION_ORDERS_KEY = 'production-orders' as const

export function useProductionOrders({
  page,
  pageSize,
  filters,
}: {
  page: number
  pageSize: number
  filters: {
    startDate?: string
    endDate?: string
    employeeId?: string
    productModel?: string
    customerModel?: string
  }
}) {
  return useQuery({
    queryKey: [PRODUCTION_ORDERS_KEY, page, pageSize, filters],
    queryFn: () => getProductionOrders({ page, pageSize, ...filters }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useProductionOrder(id: string | undefined) {
  return useQuery({
    queryKey: [PRODUCTION_ORDERS_KEY, id],
    queryFn: () => getProductionOrderById(id!),
    enabled: !!id,
    ...queryConfig.detail,
  })
}

export function useCreateProductionOrder() {
  return useMutationWithInvalidation({
    mutationFn: createProductionOrder,
    invalidateQueries: [[PRODUCTION_ORDERS_KEY]],
  })
}

export function useUpdateProductionOrder() {
  return useMutationWithInvalidation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string
      values: Parameters<typeof updateProductionOrder>[0]['values']
    }) => updateProductionOrder({ id, values }),
    invalidateQueries: [[PRODUCTION_ORDERS_KEY]],
  })
}

export function useDeleteProductionOrders() {
  return useMutationWithInvalidation({
    mutationFn: deleteProductionOrders,
    invalidateQueries: [[PRODUCTION_ORDERS_KEY]],
  })
}
