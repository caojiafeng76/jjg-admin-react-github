import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import {
  getWorkshopOrders,
  createWorkshopOrder,
  updateWorkshopOrder,
  createWorkshopOrdersBatch,
  deleteWorkshopOrders,
} from '@/services/apiWorkshopOrders'

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
    placeholderData: (previousData) => previousData,
  })
}

export function useCreateWorkshopOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWorkshopOrder,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [WORKSHOP_ORDERS_KEY] })
      return args
    },
  })
}

export function useUpdateWorkshopOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateWorkshopOrder,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [WORKSHOP_ORDERS_KEY] })
      return args
    },
  })
}

export function useCreateWorkshopOrdersBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWorkshopOrdersBatch,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [WORKSHOP_ORDERS_KEY] })
      return args
    },
  })
}

export function useDeleteWorkshopOrders() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteWorkshopOrders,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [WORKSHOP_ORDERS_KEY] })
      return args
    },
  })
}
