import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  batchDeleteVillaLiftOrders,
  batchMarkVillaLiftOrdersDate,
  batchUpdateVillaLiftOrdersStatus,
  createVillaLiftOrder,
  deleteVillaLiftOrder,
  deleteVillaLiftOrderItem,
  getVillaLiftOrderItems,
  getVillaLiftOrders,
  markVillaLiftOrderDate,
  updateVillaLiftOrder,
  updateVillaLiftOrderStatus,
  upsertVillaLiftOrderItems,
  type VillaLiftOrderStatus,
} from '@/services/apiVillaLiftOrders'

export const VILLA_LIFT_ORDERS_KEY = 'villa-lift-orders' as const
export const VILLA_LIFT_ORDER_ITEMS_KEY = 'villa-lift-order-items' as const

export function useVillaLiftOrders({
  page,
  pageSize,
  status,
  customer,
  projectName,
  productName,
  deliveryDateFrom,
  deliveryDateTo,
}: {
  page: number
  pageSize: number
  status?: VillaLiftOrderStatus
  customer?: string
  projectName?: string
  productName?: string
  deliveryDateFrom?: string
  deliveryDateTo?: string
}) {
  return useQuery({
    queryKey: [
      VILLA_LIFT_ORDERS_KEY,
      page,
      pageSize,
      status,
      customer,
      projectName,
      productName,
      deliveryDateFrom,
      deliveryDateTo,
    ],
    queryFn: () =>
      getVillaLiftOrders({
        page,
        pageSize,
        status,
        customer,
        projectName,
        productName,
        deliveryDateFrom,
        deliveryDateTo,
      }),
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

// 切割/加工下拉菜单的 query key（与 CuttingProcess/FinishingProcess 共用同一字符串）
const ORDERS_FOR_SELECT_KEY = 'villa-lift-orders-for-select' as const

export function useCreateVillaLiftOrder() {
  return useMutationWithInvalidation({
    mutationFn: createVillaLiftOrder,
    invalidateQueries: [[VILLA_LIFT_ORDERS_KEY], [ORDERS_FOR_SELECT_KEY]],
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
    invalidateQueries: [[VILLA_LIFT_ORDERS_KEY], [ORDERS_FOR_SELECT_KEY]],
  })
}

export function useDeleteVillaLiftOrder() {
  return useMutationWithInvalidation({
    mutationFn: deleteVillaLiftOrder,
    invalidateQueries: [[VILLA_LIFT_ORDERS_KEY], [ORDERS_FOR_SELECT_KEY]],
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

export function useBatchDeleteVillaLiftOrders() {
  return useMutationWithInvalidation({
    mutationFn: batchDeleteVillaLiftOrders,
    invalidateQueries: [[VILLA_LIFT_ORDERS_KEY], [ORDERS_FOR_SELECT_KEY]],
  })
}

export function useBatchUpdateVillaLiftOrdersStatus() {
  return useMutationWithInvalidation({
    mutationFn: batchUpdateVillaLiftOrdersStatus,
    invalidateQueries: [[VILLA_LIFT_ORDERS_KEY], [ORDERS_FOR_SELECT_KEY]],
  })
}

export function useMarkVillaLiftOrderDate() {
  return useMutationWithInvalidation({
    mutationFn: markVillaLiftOrderDate,
    invalidateQueries: [[VILLA_LIFT_ORDERS_KEY]],
  })
}

export function useBatchMarkVillaLiftOrdersDate() {
  return useMutationWithInvalidation({
    mutationFn: batchMarkVillaLiftOrdersDate,
    invalidateQueries: [[VILLA_LIFT_ORDERS_KEY]],
  })
}
