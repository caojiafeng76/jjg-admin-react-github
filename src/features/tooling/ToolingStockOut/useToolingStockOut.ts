import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  batchUpdateToolingStockOutStatus,
  createPublicToolingStockOut,
  createToolingStockOut,
  deleteToolingStockOut,
  getPublicToolingDataOptions,
  getToolingDataOptions,
  getToolingStockOutList,
  importToolingStockOut,
  updateToolingStockOut,
} from '@/services/apiToolingStockOut'
import { toolingKeys } from '../queryKeys'

export function useToolingStockOutList({
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
    queryKey: toolingKeys.stockOut.list({
      page,
      pageSize,
      keyword: searchParams.keyword,
      status: searchParams.status,
    }),
    queryFn: ({ signal }) =>
      getToolingStockOutList({
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

export function usePublicToolingDataOptions(keyword?: string) {
  return useQuery({
    queryKey: toolingKeys.data.publicOptions(keyword),
    queryFn: ({ signal }) => getPublicToolingDataOptions(keyword, signal),
    ...queryConfig.list,
  })
}

export function useCreateToolingStockOut() {
  return useMutationWithInvalidation({
    mutationFn: createToolingStockOut,
    invalidateQueries: [toolingKeys.stockOut.all, toolingKeys.inventory.all],
  })
}

export function useCreatePublicToolingStockOut() {
  return useMutationWithInvalidation({
    mutationFn: createPublicToolingStockOut,
  })
}

export function useUpdateToolingStockOut() {
  return useMutationWithInvalidation({
    mutationFn: updateToolingStockOut,
    invalidateQueries: [toolingKeys.stockOut.all, toolingKeys.inventory.all],
  })
}

export function useBatchUpdateToolingStockOutStatus() {
  return useMutationWithInvalidation({
    mutationFn: batchUpdateToolingStockOutStatus,
    invalidateQueries: [toolingKeys.stockOut.all, toolingKeys.inventory.all],
  })
}

export function useImportToolingStockOut() {
  return useMutationWithInvalidation({
    mutationFn: importToolingStockOut,
    invalidateQueries: [toolingKeys.stockOut.all, toolingKeys.inventory.all],
  })
}

export function useDeleteToolingStockOut() {
  return useMutationWithInvalidation({
    mutationFn: deleteToolingStockOut,
    invalidateQueries: [toolingKeys.stockOut.all, toolingKeys.inventory.all],
  })
}
