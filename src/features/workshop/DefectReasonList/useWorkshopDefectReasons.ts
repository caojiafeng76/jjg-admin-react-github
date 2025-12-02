import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import {
  getWorkshopDefectReasons,
  createWorkshopDefectReason,
  updateWorkshopDefectReason,
  deleteWorkshopDefectReasons,
} from '@/services/apiWorkshopDefectReasons'

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
    placeholderData: (previousData) => previousData,
  })
}

export function useCreateWorkshopDefectReason() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWorkshopDefectReason,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [WORKSHOP_DEFECT_REASONS_KEY] })
      return args
    },
  })
}

export function useUpdateWorkshopDefectReason() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateWorkshopDefectReason,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [WORKSHOP_DEFECT_REASONS_KEY] })
      return args
    },
  })
}

export function useDeleteWorkshopDefectReasons() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteWorkshopDefectReasons,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [WORKSHOP_DEFECT_REASONS_KEY] })
      return args
    },
  })
}
