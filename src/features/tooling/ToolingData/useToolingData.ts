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
import { toolingKeys } from '../queryKeys'

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
    queryKey: toolingKeys.data.list({
      page,
      pageSize,
      keyword: searchParams.keyword,
    }),
    queryFn: ({ signal }) =>
      getToolingDataList({
        page,
        pageSize,
        keyword: searchParams.keyword,
        signal,
      }),
    placeholderData: keepPreviousData,
    // 不抛错到 ErrorBoundary，让列表页用 TableState 展示错误态 + 重试
    throwOnError: false,
    ...queryConfig.list,
  })
}

export function useCreateToolingData() {
  return useMutationWithInvalidation({
    mutationFn: createToolingData,
    invalidateQueries: [toolingKeys.data.all],
  })
}

export function useUpdateToolingData() {
  return useMutationWithInvalidation({
    mutationFn: updateToolingData,
    invalidateQueries: [toolingKeys.data.all],
  })
}

export function useImportToolingData() {
  return useMutationWithInvalidation({
    mutationFn: createToolingDataBatch,
    invalidateQueries: [toolingKeys.data.all],
  })
}

export function useDeleteToolingData() {
  return useMutationWithInvalidation({
    mutationFn: deleteToolingData,
    invalidateQueries: [toolingKeys.data.all],
  })
}
