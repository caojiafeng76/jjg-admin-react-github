import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  createToolingInventory,
  deleteToolingInventory,
  getToolingDataOptions,
  getToolingInventoryList,
  importToolingInventory,
  updateToolingInventory,
} from '@/services/apiToolingInventory'

const TOOLING_INVENTORY_KEY = 'tooling-inventory' as const
const TOOLING_DATA_OPTIONS_KEY = 'tooling-data-options' as const

export function useToolingInventoryList({
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
    queryKey: [TOOLING_INVENTORY_KEY, page, pageSize, searchParams],
    queryFn: () =>
      getToolingInventoryList({
        page,
        pageSize,
        keyword: searchParams.keyword,
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

export function useCreateToolingInventory() {
  return useMutationWithInvalidation({
    mutationFn: createToolingInventory,
    invalidateQueries: [[TOOLING_INVENTORY_KEY]],
  })
}

export function useUpdateToolingInventory() {
  return useMutationWithInvalidation({
    mutationFn: updateToolingInventory,
    invalidateQueries: [[TOOLING_INVENTORY_KEY]],
  })
}

export function useImportToolingInventory() {
  return useMutationWithInvalidation({
    mutationFn: importToolingInventory,
    invalidateQueries: [[TOOLING_INVENTORY_KEY]],
  })
}

export function useDeleteToolingInventory() {
  return useMutationWithInvalidation({
    mutationFn: deleteToolingInventory,
    invalidateQueries: [[TOOLING_INVENTORY_KEY]],
  })
}
