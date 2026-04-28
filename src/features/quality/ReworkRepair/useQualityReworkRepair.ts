import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  createQualityReworkRepair,
  deleteQualityReworkRepair,
  getQualityReworkRepairList,
  updateQualityReworkRepair,
  type QualityReworkRepairSearchParams,
} from '@/services/apiQualityReworkRepair'

const QUALITY_REWORK_REPAIR_KEY = 'quality-rework-repair' as const

export function useQualityReworkRepairList({
  page,
  pageSize,
  searchParams,
}: {
  page: number
  pageSize: number
  searchParams: QualityReworkRepairSearchParams
}) {
  return useQuery({
    queryKey: [QUALITY_REWORK_REPAIR_KEY, page, pageSize, searchParams],
    queryFn: () =>
      getQualityReworkRepairList({
        page,
        pageSize,
        keyword: searchParams.keyword,
        reworkCategory: searchParams.reworkCategory,
      }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useCreateQualityReworkRepair() {
  return useMutationWithInvalidation({
    mutationFn: createQualityReworkRepair,
    invalidateQueries: [[QUALITY_REWORK_REPAIR_KEY]],
  })
}

export function useUpdateQualityReworkRepair() {
  return useMutationWithInvalidation({
    mutationFn: updateQualityReworkRepair,
    invalidateQueries: [[QUALITY_REWORK_REPAIR_KEY]],
  })
}

export function useDeleteQualityReworkRepair() {
  return useMutationWithInvalidation({
    mutationFn: deleteQualityReworkRepair,
    invalidateQueries: [[QUALITY_REWORK_REPAIR_KEY]],
  })
}
