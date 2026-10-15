import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useProcessStandardJobRows } from '@/features/workshop/OrderStatusDashboard/useOrderStatusDashboard'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  getProductionSchedulingLengthOptions,
  getProductionSchedulingOrderStandardCapacity,
  getProductionSchedulingOrders,
  updateProductionSchedulingOrder,
  type ProductionSchedulingFilters,
  type ProductionSchedulingOrder,
} from '@/services/apiProductionScheduling'

export const PRODUCTION_SCHEDULING_KEY = 'production-scheduling' as const
// 库存/转移等数据来自扫码、精切、转移等其他页面和设备，本页定时轮询保持动态更新
const ORDERS_REFETCH_INTERVAL = 1000 * 30

export function useProductionSchedulingOrders({
  filters,
  page,
  pageSize,
}: {
  filters: ProductionSchedulingFilters
  page: number
  pageSize: number
}) {
  const { data: processRows } = useProcessStandardJobRows()

  return useQuery({
    queryKey: [
      PRODUCTION_SCHEDULING_KEY,
      'orders',
      { filters, page, pageSize },
    ],
    queryFn: ({ signal }) =>
      getProductionSchedulingOrders({
        filters,
        page,
        pageSize,
        processRows,
        signal,
      }),
    enabled: processRows !== undefined,
    placeholderData: keepPreviousData,
    ...queryConfig.list,
    refetchInterval: ORDERS_REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
  })
}

export function useProductionSchedulingLengthOptions() {
  return useQuery({
    queryKey: [PRODUCTION_SCHEDULING_KEY, 'length-options'],
    queryFn: ({ signal }) => getProductionSchedulingLengthOptions(signal),
    ...queryConfig.list,
  })
}

export function useProductionSchedulingOrderStandardCapacity({
  enabled,
  order,
}: {
  enabled: boolean
  order: ProductionSchedulingOrder | null
}) {
  return useQuery({
    queryKey: [
      PRODUCTION_SCHEDULING_KEY,
      'order-standard-capacity',
      order?.id,
      order?.product_model,
      order?.material_code,
      order?.length_mm,
      order?.process_flow,
    ],
    queryFn: ({ signal }) =>
      order
        ? getProductionSchedulingOrderStandardCapacity({ order, signal })
        : null,
    enabled: enabled && Boolean(order),
    ...queryConfig.detail,
  })
}

export function useUpdateProductionSchedulingOrder() {
  return useMutationWithInvalidation({
    mutationFn: updateProductionSchedulingOrder,
    invalidateQueries: [
      [PRODUCTION_SCHEDULING_KEY],
      ['workshop-orders'],
      ['order-status-dashboard'],
    ],
  })
}
