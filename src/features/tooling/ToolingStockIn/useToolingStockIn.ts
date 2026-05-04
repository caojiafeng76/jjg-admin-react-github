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

const TOOLING_STOCK_IN_KEY = 'tooling-stock-in' as const
const TOOLING_INVENTORY_KEY = 'tooling-inventory' as const
const TOOLING_DATA_OPTIONS_KEY = 'tooling-data-options' as const

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
    queryKey: [TOOLING_STOCK_IN_KEY, page, pageSize, searchParams],
    queryFn: () =>
      getToolingStockInList({
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

export function useCreateToolingStockIn() {
  return useMutationWithInvalidation({
    mutationFn: createToolingStockIn,
    invalidateQueries: [[TOOLING_STOCK_IN_KEY], [TOOLING_INVENTORY_KEY]],
  })
}

export function useUpdateToolingStockIn() {
  return useMutationWithInvalidation({
    mutationFn: updateToolingStockIn,
    invalidateQueries: [[TOOLING_STOCK_IN_KEY], [TOOLING_INVENTORY_KEY]],
  })
}

export function useBatchUpdateToolingStockInStatus() {
  return useMutationWithInvalidation({
    mutationFn: batchUpdateToolingStockInStatus,
    invalidateQueries: [[TOOLING_STOCK_IN_KEY], [TOOLING_INVENTORY_KEY]],
  })
}

export function useDeleteToolingStockIn() {
  return useMutationWithInvalidation({
    mutationFn: deleteToolingStockIn,
    invalidateQueries: [[TOOLING_STOCK_IN_KEY], [TOOLING_INVENTORY_KEY]],
  })
}
