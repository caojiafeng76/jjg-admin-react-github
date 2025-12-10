import { useQuery, keepPreviousData } from '@tanstack/react-query'

import {
  getWorkshopDefectReasons,
  createWorkshopDefectReason,
  updateWorkshopDefectReason,
  deleteWorkshopDefectReasons,
} from '@/services/apiWorkshopDefectReasons'
import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'

const WORKSHOP_DEFECT_REASONS_KEY = 'workshop-defect-reasons' as const

export function useWorkshopDefectReasonsList({
  page,
  pageSize,
  searchParams,
}: {
  page: number
  pageSize: number
  searchParams: { defect_reason?: string }
}) {
  return useQuery({
    queryKey: [WORKSHOP_DEFECT_REASONS_KEY, page, pageSize, searchParams],
    queryFn: () => getWorkshopDefectReasons({ page, pageSize, ...searchParams }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useCreateWorkshopDefectReason() {
  return useMutationWithInvalidation({
    mutationFn: createWorkshopDefectReason,
    invalidateQueries: [[WORKSHOP_DEFECT_REASONS_KEY]],
  })
}

export function useUpdateWorkshopDefectReason() {
  return useMutationWithInvalidation({
    mutationFn: updateWorkshopDefectReason,
    invalidateQueries: [[WORKSHOP_DEFECT_REASONS_KEY]],
  })
}

export function useDeleteWorkshopDefectReasons() {
  return useMutationWithInvalidation({
    mutationFn: deleteWorkshopDefectReasons,
    invalidateQueries: [[WORKSHOP_DEFECT_REASONS_KEY]],
  })
}
