import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { getSyneyMaterialsMonthlyReport } from '@/services/apiSyneyMaterialsReport'
import { syneyMaterialsKeys } from '../queryKeys'

export function syneyMaterialsMonthlyReportQueryOptions(month: string) {
  return {
    queryKey: syneyMaterialsKeys.monthlyReport.detail(month),
    queryFn: () => getSyneyMaterialsMonthlyReport(month),
    ...queryConfig.list,
  }
}

export function useSyneyMaterialsMonthlyReport(month: string) {
  return useQuery({
    ...syneyMaterialsMonthlyReportQueryOptions(month),
    placeholderData: keepPreviousData,
    throwOnError: false,
  })
}
