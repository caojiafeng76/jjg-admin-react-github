import type { WorkshopMiscMaterialsReportStage } from '@/services/apiWorkshopMiscMaterialsReport'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { getWorkshopMiscMaterialsMonthlyReport } from '@/services/apiWorkshopMiscMaterialsReport'
import { workshopMiscMaterialsKeys } from '../queryKeys'

export function workshopMiscMaterialsMonthlyReportQueryOptions(
  month: string,
  stage: WorkshopMiscMaterialsReportStage,
) {
  return {
    queryKey: workshopMiscMaterialsKeys.monthlyReport.detail(month, stage),
    queryFn: () => getWorkshopMiscMaterialsMonthlyReport(month, stage),
    ...queryConfig.list,
  }
}

export function useWorkshopMiscMaterialsMonthlyReport(
  month: string,
  stage: WorkshopMiscMaterialsReportStage,
) {
  return useQuery({
    ...workshopMiscMaterialsMonthlyReportQueryOptions(month, stage),
    placeholderData: keepPreviousData,
    throwOnError: false,
  })
}
