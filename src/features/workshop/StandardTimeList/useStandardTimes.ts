import { useQuery, keepPreviousData } from '@tanstack/react-query'

import {
  getStandardTimes,
  createStandardTime,
  updateStandardTime,
  deleteStandardTimes,
} from '@/services/apiStandardTimes'
import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'

const STANDARD_TIMES_KEY = 'standard-times' as const

export function useStandardTimesList({
  page,
  pageSize,
  searchParams,
}: {
  page: number
  pageSize: number
  searchParams: { operation?: string; model?: string }
}) {
  return useQuery({
    queryKey: [STANDARD_TIMES_KEY, page, pageSize, searchParams],
    queryFn: () => getStandardTimes({ page, pageSize, ...searchParams }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useCreateStandardTime() {
  return useMutationWithInvalidation({
    mutationFn: createStandardTime,
    invalidateQueries: [[STANDARD_TIMES_KEY]],
  })
}

export function useUpdateStandardTime() {
  return useMutationWithInvalidation({
    mutationFn: updateStandardTime,
    invalidateQueries: [[STANDARD_TIMES_KEY]],
  })
}

export function useDeleteStandardTimes() {
  return useMutationWithInvalidation({
    mutationFn: deleteStandardTimes,
    invalidateQueries: [[STANDARD_TIMES_KEY]],
  })
}
