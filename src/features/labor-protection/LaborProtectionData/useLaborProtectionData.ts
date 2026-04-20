import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  createLaborProtectionData,
  deleteLaborProtectionData,
  getLaborProtectionDataList,
  updateLaborProtectionData,
} from '@/services/apiLaborProtectionData'

const LABOR_PROTECTION_DATA_KEY = 'labor-protection-data' as const

export function useLaborProtectionDataList({
  page,
  pageSize,
  searchParams,
}: {
  page: number
  pageSize: number
  searchParams: {
    keyword?: string
  }
}) {
  return useQuery({
    queryKey: [LABOR_PROTECTION_DATA_KEY, page, pageSize, searchParams],
    queryFn: () =>
      getLaborProtectionDataList({
        page,
        pageSize,
        keyword: searchParams.keyword,
      }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useCreateLaborProtectionData() {
  return useMutationWithInvalidation({
    mutationFn: createLaborProtectionData,
    invalidateQueries: [[LABOR_PROTECTION_DATA_KEY]],
  })
}

export function useUpdateLaborProtectionData() {
  return useMutationWithInvalidation({
    mutationFn: updateLaborProtectionData,
    invalidateQueries: [[LABOR_PROTECTION_DATA_KEY]],
  })
}

export function useDeleteLaborProtectionData() {
  return useMutationWithInvalidation({
    mutationFn: deleteLaborProtectionData,
    invalidateQueries: [[LABOR_PROTECTION_DATA_KEY]],
  })
}
