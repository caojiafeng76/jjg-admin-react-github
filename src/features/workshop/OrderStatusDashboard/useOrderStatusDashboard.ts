import type { OrderStatusDashboardFilters } from '@/services/apiOrderStatusDashboard'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryConfig } from '@/config/queryClient'
import {
  getAllProcessStandardJobRows,
  getOrderStatusDashboard,

  REWORK_REPAIR_STATUS_COLORS,
  REWORK_REPAIR_STATUS_LABELS,
} from '@/services/apiOrderStatusDashboard'

export const ORDER_STATUS_DASHBOARD_KEY = 'order-status-dashboard' as const
export const PROCESS_STANDARDS_KEY = 'process-standards' as const
export const PROCESS_STANDARD_JOB_ROWS_KEY = 'job-rows' as const
// 库存/转移/报工数据来自扫码、精切、转移等其他页面和设备，看板定时轮询保持动态更新
export const ORDER_STATUS_DASHBOARD_REFETCH_INTERVAL = 1000 * 30
export { REWORK_REPAIR_STATUS_COLORS, REWORK_REPAIR_STATUS_LABELS }

/**
 * 岗位行（process_standards 全表）查询。
 *
 * - 使用 queryConfig.static（1 小时 staleTime）：岗位字典低变更，
 *   避免 dashboard 翻页/改筛选时重复全表拉取。
 * - 复用 'process-standards' 前缀：StandardTimeList 的
 *   useUpdateStandardTime / useUpdateStandardTimesLastProcess /
 *   useCreateStandardTime / useDeleteStandardTimes 在数据变更后
 *   invalidate ['process-standards']，会前缀命中本查询，保证缓存立即刷新。
 */
export function useProcessStandardJobRows() {
  return useQuery({
    queryKey: [PROCESS_STANDARDS_KEY, PROCESS_STANDARD_JOB_ROWS_KEY],
    queryFn: ({ signal }) => getAllProcessStandardJobRows(signal),
    ...queryConfig.static,
  })
}

export function useOrderStatusDashboard({
  page,
  pageSize,
  filters,
}: {
  page: number
  pageSize: number
  filters?: OrderStatusDashboardFilters
}) {
  const { data: processRows } = useProcessStandardJobRows()

  return useQuery({
    queryKey: [ORDER_STATUS_DASHBOARD_KEY, { page, pageSize, filters }],
    queryFn: ({ signal }) =>
      getOrderStatusDashboard({ page, pageSize, filters, processRows, signal }),
    enabled: processRows !== undefined,
    placeholderData: keepPreviousData,
    ...queryConfig.list,
    refetchInterval: ORDER_STATUS_DASHBOARD_REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
  })
}
