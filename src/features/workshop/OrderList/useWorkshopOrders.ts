import { useQuery, keepPreviousData } from '@tanstack/react-query'

import {
  getWorkshopOrders,
  createWorkshopOrder,
  updateWorkshopOrder,
  createWorkshopOrdersBatch,
  deleteWorkshopOrders,
} from '@/services/apiWorkshopOrders'
import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'

const WORKSHOP_ORDERS_KEY = 'workshop-orders' as const

export function useWorkshopOrdersList({
  page,
  pageSize,
  searchParams,
}: {
  page: number
  pageSize: number
  searchParams: {
    project_no?: string
    product_model?: string
    customer_model?: string
    model_search?: string // 统一的搜索字段，支持项目号、产品型号、客户型号
    startDate?: string
    endDate?: string
  }
}) {
  return useQuery({
    queryKey: [WORKSHOP_ORDERS_KEY, page, pageSize, searchParams],
    queryFn: () => getWorkshopOrders({ page, pageSize, ...searchParams }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useCreateWorkshopOrder() {
  return useMutationWithInvalidation({
    mutationFn: createWorkshopOrder,
    invalidateQueries: [[WORKSHOP_ORDERS_KEY]],
  })
}

export function useUpdateWorkshopOrder() {
  return useMutationWithInvalidation({
    mutationFn: updateWorkshopOrder,
    invalidateQueries: [[WORKSHOP_ORDERS_KEY]],
  })
}

export function useCreateWorkshopOrdersBatch() {
  return useMutationWithInvalidation({
    mutationFn: createWorkshopOrdersBatch,
    invalidateQueries: [[WORKSHOP_ORDERS_KEY]],
  })
}

export function useDeleteWorkshopOrders() {
  return useMutationWithInvalidation({
    mutationFn: deleteWorkshopOrders,
    invalidateQueries: [[WORKSHOP_ORDERS_KEY]],
  })
}
