import { useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import {
  getProductionDailyReport,
  type ProductionDailyReportFilters,
} from '@/services/apiProductionDailyReport'

const PRODUCTION_DAILY_REPORT_KEY = 'production-daily-report' as const

export function useProductionDailyReport(filters: ProductionDailyReportFilters) {
  return useQuery({
    queryKey: [PRODUCTION_DAILY_REPORT_KEY, filters],
    queryFn: () => getProductionDailyReport(filters),
    ...queryConfig.list,
  })
}