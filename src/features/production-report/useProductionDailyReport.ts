import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import {
  getProductionDailyReport,
  getProductionDailyReportProductModels,
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
    ...queryConfig.list,
  })
}

export function useProductionDailyReportProductModels() {
  return useQuery({
    queryKey: [PRODUCTION_DAILY_REPORT_KEY, 'product-model-options'],
    queryFn: getProductionDailyReportProductModels,
    ...queryConfig.list,
  })
}
