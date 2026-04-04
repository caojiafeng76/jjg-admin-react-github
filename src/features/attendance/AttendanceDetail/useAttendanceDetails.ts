import { useQuery, keepPreviousData } from '@tanstack/react-query'

import {
  getAttendanceDetails,
  createAttendanceDetail,
  createAttendanceDetailsBatch,
  updateAttendanceDetail,
  deleteAttendanceDetails,
  getAttendanceShiftStats,
  getAttendanceLateEarlyStats,
  getAttendanceMonthlyExportData,
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

export function useAttendanceShiftStats({
  startDate,
  endDate,
  name,
}: {
  startDate?: string
  endDate?: string
  name?: string
}) {
  return useQuery({
    queryKey: [ATTENDANCE_DETAILS_KEY, 'stats', { startDate, endDate, name }],
    queryFn: () => getAttendanceShiftStats({ startDate, endDate, name }),
    ...queryConfig.list,
  })
}

export function useAttendanceLateEarlyStats({
  startDate,
  endDate,
  name,
}: {
  startDate?: string
  endDate?: string
  name?: string
}) {
  return useQuery({
    queryKey: [
      ATTENDANCE_DETAILS_KEY,
      'late-early-stats',
      { startDate, endDate, name },
    ],
    queryFn: () => getAttendanceLateEarlyStats({ startDate, endDate, name }),
    ...queryConfig.list,
  })
}

export function useAttendanceMonthlyExportData({
  year,
  month,
  name,
  enabled,
}: {
  year: number
  month: number
  name?: string
  enabled?: boolean
}) {
  return useQuery({
    queryKey: [ATTENDANCE_DETAILS_KEY, 'monthly-export', { year, month, name }],
    queryFn: () => getAttendanceMonthlyExportData({ year, month, name }),
    enabled: enabled !== false,
    ...queryConfig.detail,
  })
}
