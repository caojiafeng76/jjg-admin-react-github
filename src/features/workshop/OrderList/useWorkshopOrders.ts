import { useQuery, keepPreviousData } from '@tanstack/react-query'

import {
  getWorkshopOrders,
  getWorkshopOrderOptions,
  createWorkshopOrder,
  updateWorkshopOrder,
  updateWorkshopOrderStatuses,
  createWorkshopOrdersBatch,
  deleteWorkshopOrders,
} from '@/services/apiWorkshopOrders'
import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import type { WorkshopOrderStatus } from './orderStatus'

const WORKSHOP_ORDERS_KEY = 'workshop-orders' as const
const WORKSHOP_ORDER_OPTIONS_KEY = [
  WORKSHOP_ORDERS_KEY,
  'options',
] as const

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
    project_no_search?: string | string[] // 多关键词搜索项目号
    model_search?: string | string[] // 多关键词搜索产品型号、客户型号
    length_mm?: number[]
    startDate?: string
    endDate?: string
    status?: WorkshopOrderStatus
  }
}) {
  return useQuery({
    queryKey: [WORKSHOP_ORDERS_KEY, page, pageSize, searchParams],
    queryFn: ({ signal }) =>
      getWorkshopOrders({ page, pageSize, ...searchParams, signal }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useWorkshopOrderLengths() {
  return useQuery({
    queryKey: WORKSHOP_ORDER_OPTIONS_KEY,
    queryFn: ({ signal }) => getWorkshopOrderOptions(signal),
    select: (options) => options.lengths,
    ...queryConfig.static,
  })
}

export function useWorkshopOrderProjectNos() {
  return useQuery({
    queryKey: WORKSHOP_ORDER_OPTIONS_KEY,
    queryFn: ({ signal }) => getWorkshopOrderOptions(signal),
    select: (options) => options.projectNos,
    ...queryConfig.static,
  })
}

export function useWorkshopOrderModels() {
  return useQuery({
    queryKey: WORKSHOP_ORDER_OPTIONS_KEY,
    queryFn: ({ signal }) => getWorkshopOrderOptions(signal),
    select: (options) => options.productModels,
    ...queryConfig.static,
  })
}

export function useCreateWorkshopOrder() {
  return useMutationWithInvalidation({
    mutationFn: createWorkshopOrder,
    invalidateQueries: [
      [WORKSHOP_ORDERS_KEY],
      ['process-standards', 'project-nos'],
    ],
  })
}

export function useUpdateWorkshopOrder() {
  return useMutationWithInvalidation({
    mutationFn: updateWorkshopOrder,
    invalidateQueries: [
      [WORKSHOP_ORDERS_KEY],
      ['process-standards', 'project-nos'],
    ],
  })
}

export function useBatchUpdateWorkshopOrderStatuses() {
  return useMutationWithInvalidation({
    mutationFn: updateWorkshopOrderStatuses,
    invalidateQueries: [
      [WORKSHOP_ORDERS_KEY],
      ['process-standards', 'project-nos'],
    ],
  })
}

export function useCreateWorkshopOrdersBatch() {
  return useMutationWithInvalidation({
    mutationFn: createWorkshopOrdersBatch,
    invalidateQueries: [
      [WORKSHOP_ORDERS_KEY],
      ['process-standards', 'project-nos'],
    ],
  })
}

export function useDeleteWorkshopOrders() {
  return useMutationWithInvalidation({
    mutationFn: deleteWorkshopOrders,
    invalidateQueries: [
      [WORKSHOP_ORDERS_KEY],
      ['process-standards', 'project-nos'],
    ],
  })
}
