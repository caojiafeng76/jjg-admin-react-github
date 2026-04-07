import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  createToolingData,
  createToolingDataBatch,
  deleteToolingData,
  getToolingDataList,
  updateToolingData,
} from '@/services/apiToolingData'

const TOOLING_DATA_KEY = 'tooling-data' as const

export function useToolingDataList({
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
    queryKey: [TOOLING_DATA_KEY, page, pageSize, searchParams],
    queryFn: () =>
      getToolingDataList({
        page,
        pageSize,
        keyword: searchParams.keyword,
      }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useCreateToolingData() {
  return useMutationWithInvalidation({
    mutationFn: createToolingData,
    invalidateQueries: [[TOOLING_DATA_KEY]],
  })
}

export function useUpdateToolingData() {
  return useMutationWithInvalidation({
    mutationFn: updateToolingData,
    invalidateQueries: [[TOOLING_DATA_KEY]],
  })
}

export function useImportToolingData() {
  return useMutationWithInvalidation({
    mutationFn: createToolingDataBatch,
    invalidateQueries: [[TOOLING_DATA_KEY]],
  })
}

export function useDeleteToolingData() {
  return useMutationWithInvalidation({
    mutationFn: deleteToolingData,
    invalidateQueries: [[TOOLING_DATA_KEY]],
  })
}