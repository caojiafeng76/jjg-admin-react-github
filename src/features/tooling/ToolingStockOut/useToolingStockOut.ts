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

const TOOLING_STOCK_OUT_KEY = 'tooling-stock-out' as const
const TOOLING_INVENTORY_KEY = 'tooling-inventory' as const
const TOOLING_DATA_OPTIONS_KEY = 'tooling-data-options' as const
const PUBLIC_TOOLING_DATA_OPTIONS_KEY = 'public-tooling-data-options' as const

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
    queryKey: [TOOLING_STOCK_OUT_KEY, page, pageSize, searchParams],
    queryFn: () =>
      getToolingStockOutList({
        page,
        pageSize,
        keyword: searchParams.keyword,
        status: searchParams.status,
      }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useToolingDataOptions() {
  return useQuery({
    queryKey: [TOOLING_DATA_OPTIONS_KEY],
    queryFn: () => getToolingDataOptions(),
    ...queryConfig.list,
  })
}

export function usePublicToolingDataOptions() {
  return useQuery({
    queryKey: [PUBLIC_TOOLING_DATA_OPTIONS_KEY],
    queryFn: () => getPublicToolingDataOptions(),
    ...queryConfig.list,
  })
}

export function useCreateToolingStockOut() {
  return useMutationWithInvalidation({
    mutationFn: createToolingStockOut,
    invalidateQueries: [[TOOLING_STOCK_OUT_KEY], [TOOLING_INVENTORY_KEY]],
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
    invalidateQueries: [[TOOLING_STOCK_OUT_KEY], [TOOLING_INVENTORY_KEY]],
  })
}

export function useBatchUpdateToolingStockOutStatus() {
  return useMutationWithInvalidation({
    mutationFn: batchUpdateToolingStockOutStatus,
    invalidateQueries: [[TOOLING_STOCK_OUT_KEY], [TOOLING_INVENTORY_KEY]],
  })
}

export function useImportToolingStockOut() {
  return useMutationWithInvalidation({
    mutationFn: importToolingStockOut,
    invalidateQueries: [[TOOLING_STOCK_OUT_KEY], [TOOLING_INVENTORY_KEY]],
  })
}

export function useDeleteToolingStockOut() {
  return useMutationWithInvalidation({
    mutationFn: deleteToolingStockOut,
    invalidateQueries: [[TOOLING_STOCK_OUT_KEY], [TOOLING_INVENTORY_KEY]],
  })
}
