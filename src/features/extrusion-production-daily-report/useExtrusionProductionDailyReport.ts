import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryConfig } from '@/config/queryClient'
import {
  getExtrusionProductionDailyReport,
  type ExtrusionProductionDailyReportFilters,
} from '@/services/apiExtrusionProductionDailyReport'

export const EXTRUSION_PRODUCTION_DAILY_REPORT_KEY =
  'extrusion-production-daily-report' as const

interface UseExtrusionProductionDailyReportOptions {
  page?: number
  pageSize?: number
  filters?: ExtrusionProductionDailyReportFilters
}

export function useExtrusionProductionDailyReport({
  page = 1,
  pageSize = 10,
  filters = {},
}: UseExtrusionProductionDailyReportOptions = {}) {
  return useQuery({
    queryKey: [
      EXTRUSION_PRODUCTION_DAILY_REPORT_KEY,
      { page, pageSize, ...filters },
    ],
    queryFn: ({ signal }) =>
      getExtrusionProductionDailyReport({ page, pageSize, filters, signal }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}
