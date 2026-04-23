import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  createVillaLiftOrder,
  deleteVillaLiftOrder,
  deleteVillaLiftOrderItem,
  getVillaLiftOrderItems,
  getVillaLiftOrders,
  updateVillaLiftOrder,
  updateVillaLiftOrderStatus,
  upsertVillaLiftOrderItems,
} from '@/services/apiVillaLiftOrders'

export const VILLA_LIFT_ORDERS_KEY = 'villa-lift-orders' as const
export const VILLA_LIFT_ORDER_ITEMS_KEY = 'villa-lift-order-items' as const

export function useVillaLiftOrders({
  page,
  pageSize,
  keyword,
}: {
  page: number
  pageSize: number
  keyword?: string
}) {
  return useQuery({
    queryKey: [VILLA_LIFT_ORDERS_KEY, page, pageSize, keyword],
    queryFn: () => getVillaLiftOrders({ page, pageSize, keyword }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useVillaLiftOrderItems(orderId: string | null) {
  return useQuery({
    queryKey: [VILLA_LIFT_ORDER_ITEMS_KEY, orderId],
    queryFn: () => getVillaLiftOrderItems(orderId!),
    enabled: !!orderId,
    ...queryConfig.detail,
  })
}

export function useCreateVillaLiftOrder() {
  return useMutationWithInvalidation({
    mutationFn: createVillaLiftOrder,
    invalidateQueries: [[VILLA_LIFT_ORDERS_KEY]],
  })
}

export function useUpdateVillaLiftOrder() {
  return useMutationWithInvalidation({
    mutationFn: updateVillaLiftOrder,
    invalidateQueries: [[VILLA_LIFT_ORDERS_KEY]],
  })
}

export function useUpdateVillaLiftOrderStatus() {
  return useMutationWithInvalidation({
    mutationFn: updateVillaLiftOrderStatus,
    invalidateQueries: [[VILLA_LIFT_ORDERS_KEY]],
  })
}

export function useDeleteVillaLiftOrder() {
  return useMutationWithInvalidation({
    mutationFn: deleteVillaLiftOrder,
    invalidateQueries: [[VILLA_LIFT_ORDERS_KEY]],
  })
}

export function useUpsertVillaLiftOrderItems() {
  return useMutationWithInvalidation({
    mutationFn: upsertVillaLiftOrderItems,
    invalidateQueries: [[VILLA_LIFT_ORDER_ITEMS_KEY]],
  })
}

export function useDeleteVillaLiftOrderItem(orderId: string) {
  return useMutationWithInvalidation({
    mutationFn: deleteVillaLiftOrderItem,
    invalidateQueries: [[VILLA_LIFT_ORDER_ITEMS_KEY, orderId]],
  })
}
