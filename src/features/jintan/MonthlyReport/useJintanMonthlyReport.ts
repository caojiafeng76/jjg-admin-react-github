import { getJintanMonthlyInventoryReport } from '@services/apiJintanMonthlyReport'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryConfig } from '@/config/queryClient'

import { jintanKeys } from '../queryKeys'

export function jintanMonthlyReportQueryOptions(month: string) {
  return {
    queryKey: jintanKeys.monthlyReport.detail(month),
    queryFn: () => getJintanMonthlyInventoryReport(month),
    ...queryConfig.list,
  }
}

export function useJintanMonthlyReport(month: string) {
  return useQuery({
    ...jintanMonthlyReportQueryOptions(month),
    placeholderData: keepPreviousData,
    throwOnError: false,
  })
}
