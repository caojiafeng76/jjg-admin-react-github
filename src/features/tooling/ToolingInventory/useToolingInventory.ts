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
import { toolingKeys } from '../queryKeys'

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
    queryKey: toolingKeys.inventory.list({
      page,
      pageSize,
      keyword: searchParams.keyword,
    }),
    queryFn: ({ signal }) =>
      getToolingInventoryList({
        page,
        pageSize,
        keyword: searchParams.keyword,
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

export function useCreateToolingInventory() {
  return useMutationWithInvalidation({
    mutationFn: createToolingInventory,
    invalidateQueries: [toolingKeys.inventory.all],
  })
}

export function useUpdateToolingInventory() {
  return useMutationWithInvalidation({
    mutationFn: updateToolingInventory,
    invalidateQueries: [toolingKeys.inventory.all],
  })
}

export function useImportToolingInventory() {
  return useMutationWithInvalidation({
    mutationFn: importToolingInventory,
    invalidateQueries: [toolingKeys.inventory.all],
  })
}

export function useDeleteToolingInventory() {
  return useMutationWithInvalidation({
    mutationFn: deleteToolingInventory,
    invalidateQueries: [toolingKeys.inventory.all],
  })
}
