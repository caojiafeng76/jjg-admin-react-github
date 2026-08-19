import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import {
  getProductionDailyReport,
  type ProductionDailyReportFilters,
} from '@/services/apiProductionDailyReport'

const PRODUCTION_DAILY_REPORT_KEY = 'production-daily-report' as const

export function useProductionDailyReport({
  page,
  pageSize,
  filters,
}: {
  page: number
  pageSize: number
  filters: ProductionDailyReportFilters
}) {
  return useQuery({
    queryKey: [PRODUCTION_DAILY_REPORT_KEY, page, pageSize, filters],
    queryFn: () => getProductionDailyReport({ page, pageSize, ...filters }),
    placeholderData: keepPreviousData,
    // 不抛错到 ErrorBoundary，让列表页用 TableState 展示错误态 + 重试
    throwOnError: false,
    ...queryConfig.list,
  })
}
