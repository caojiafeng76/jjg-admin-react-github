import { useQuery, keepPreviousData } from '@tanstack/react-query'

import {
  getAttendanceDetails,
  createAttendanceDetail,
  createAttendanceDetailsBatch,
  updateAttendanceDetail,
  deleteAttendanceDetails,
} from '@/services/apiAttendanceDetails'
import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'

const ATTENDANCE_DETAILS_KEY = 'attendance-details' as const

export function useAttendanceDetailsList({
  page,
  pageSize,
  searchParams,
}: {
  page: number
  pageSize: number
  searchParams: {
    name?: string
    startDate?: string
    endDate?: string
  }
}) {
  return useQuery({
    queryKey: [ATTENDANCE_DETAILS_KEY, page, pageSize, searchParams],
    queryFn: () => getAttendanceDetails({ page, pageSize, ...searchParams }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useCreateAttendanceDetail() {
  return useMutationWithInvalidation({
    mutationFn: createAttendanceDetail,
    invalidateQueries: [[ATTENDANCE_DETAILS_KEY]],
  })
}

export function useUpdateAttendanceDetail() {
  return useMutationWithInvalidation({
    mutationFn: updateAttendanceDetail,
    invalidateQueries: [[ATTENDANCE_DETAILS_KEY]],
  })
}

export function useDeleteAttendanceDetails() {
  return useMutationWithInvalidation({
    mutationFn: deleteAttendanceDetails,
    invalidateQueries: [[ATTENDANCE_DETAILS_KEY]],
  })
}

export function useCreateAttendanceDetailsBatch() {
  return useMutationWithInvalidation({
    mutationFn: createAttendanceDetailsBatch,
    invalidateQueries: [[ATTENDANCE_DETAILS_KEY]],
  })
}
