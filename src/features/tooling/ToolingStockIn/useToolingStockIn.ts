import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  batchUpdateToolingStockInStatus,
  createToolingStockIn,
  deleteToolingStockIn,
  getToolingDataOptions,
  getToolingStockInList,
  updateToolingStockIn,
} from '@/services/apiToolingStockIn'
import { toolingKeys } from '../queryKeys'

export function useToolingStockInList({
  page,
  pageSize,
  searchParams,
}: {
  page: number
  pageSize: number
  searchParams: {
    keyword?: string
    status?: '待审核' | '已审核'
  }
}) {
  return useQuery({
    queryKey: toolingKeys.stockIn.list({
      page,
      pageSize,
      keyword: searchParams.keyword,
      status: searchParams.status,
    }),
    queryFn: ({ signal }) =>
      getToolingStockInList({
        page,
        pageSize,
        keyword: searchParams.keyword,
        status: searchParams.status,
        signal,
      }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useToolingDataOptions(keyword?: string) {
  return useQuery({
    queryKey: toolingKeys.data.options(keyword),
    queryFn: ({ signal }) => getToolingDataOptions(keyword, signal),
    ...queryConfig.list,
  })
}

export function useCreateToolingStockIn() {
  return useMutationWithInvalidation({
    mutationFn: createToolingStockIn,
    invalidateQueries: [toolingKeys.stockIn.all, toolingKeys.inventory.all],
  })
}

export function useUpdateToolingStockIn() {
  return useMutationWithInvalidation({
    mutationFn: updateToolingStockIn,
    invalidateQueries: [toolingKeys.stockIn.all, toolingKeys.inventory.all],
  })
}

export function useBatchUpdateToolingStockInStatus() {
  return useMutationWithInvalidation({
    mutationFn: batchUpdateToolingStockInStatus,
    invalidateQueries: [toolingKeys.stockIn.all, toolingKeys.inventory.all],
  })
}

export function useDeleteToolingStockIn() {
  return useMutationWithInvalidation({
    mutationFn: deleteToolingStockIn,
    invalidateQueries: [toolingKeys.stockIn.all, toolingKeys.inventory.all],
  })
}
