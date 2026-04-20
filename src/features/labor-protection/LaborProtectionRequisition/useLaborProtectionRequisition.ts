import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  createLaborProtectionRequisition,
  deleteLaborProtectionRequisition,
  getLaborProtectionRequisitionList,
  updateLaborProtectionRequisition,
} from '@/services/apiLaborProtectionRequisitions'

const LABOR_PROTECTION_REQUISITION_KEY = 'labor-protection-requisition' as const

export function useLaborProtectionRequisitionList({
  page,
  pageSize,
  searchParams,
}: {
  page: number
  pageSize: number
  searchParams: {
    keyword?: string
    categoryId?: string
  }
}) {
  return useQuery({
    queryKey: [LABOR_PROTECTION_REQUISITION_KEY, page, pageSize, searchParams],
    queryFn: () =>
      getLaborProtectionRequisitionList({
        page,
        pageSize,
        keyword: searchParams.keyword,
        categoryId: searchParams.categoryId,
      }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useCreateLaborProtectionRequisition() {
  return useMutationWithInvalidation({
    mutationFn: createLaborProtectionRequisition,
    invalidateQueries: [[LABOR_PROTECTION_REQUISITION_KEY]],
  })
}

export function useUpdateLaborProtectionRequisition() {
  return useMutationWithInvalidation({
    mutationFn: updateLaborProtectionRequisition,
    invalidateQueries: [[LABOR_PROTECTION_REQUISITION_KEY]],
  })
}

export function useDeleteLaborProtectionRequisition() {
  return useMutationWithInvalidation({
    mutationFn: deleteLaborProtectionRequisition,
    invalidateQueries: [[LABOR_PROTECTION_REQUISITION_KEY]],
  })
}
