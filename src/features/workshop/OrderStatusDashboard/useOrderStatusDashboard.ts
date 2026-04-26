import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import {
  getOrderStatusDashboard,
  type OrderStatusDashboardFilters,
} from '@/services/apiOrderStatusDashboard'

export const ORDER_STATUS_DASHBOARD_KEY = 'order-status-dashboard' as const

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
    queryFn: () => getOrderStatusDashboard({ page, pageSize, filters }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}
