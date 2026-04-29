import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import {
  getOrderStatusDashboard,
  REWORK_REPAIR_STATUS_COLORS,
  REWORK_REPAIR_STATUS_LABELS,
  type OrderStatusDashboardFilters,
} from '@/services/apiOrderStatusDashboard'

export const ORDER_STATUS_DASHBOARD_KEY = 'order-status-dashboard' as const
export { REWORK_REPAIR_STATUS_COLORS, REWORK_REPAIR_STATUS_LABELS }

export function useOrderStatusDashboard({
  page,
  pageSize,
  filters,
}: {
  page: number
  pageSize: number
  filters?: OrderStatusDashboardFilters
}) {
  return useQuery({
    queryKey: [ORDER_STATUS_DASHBOARD_KEY, { page, pageSize, filters }],
    queryFn: ({ signal }) =>
      getOrderStatusDashboard({ page, pageSize, filters, signal }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}
