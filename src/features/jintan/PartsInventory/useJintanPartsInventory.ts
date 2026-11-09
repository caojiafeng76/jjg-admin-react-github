import type { JintanPartsStockStatus } from '@services/apiJintanPartsInventory'
import type { JintanItemType } from '@/services/jintanItemType'
import type { JintanSearchFilters } from '@/services/jintanSearchFields'

import { useMutationWithInvalidation } from '@hooks/useMutationWithInvalidation'
import {
  createJintanPartsInventoryBatch,
  getJintanPartsInventoryList,
  getJintanPartsInventoryOptions,
  getJintanPartsInventoryStatusSummary,
  getPublicJintanPartsInventoryOptions,

  updateJintanPartsInventory,
} from '@services/apiJintanPartsInventory'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryConfig } from '@/config/queryClient'

import { jintanKeys } from '../queryKeys'

export function useJintanPartsInventoryList({
  page,
  pageSize,
  searchParams,
}: {
  page: number
  pageSize: number
  searchParams: {
    filters?: JintanSearchFilters
    status?: JintanPartsStockStatus
    itemType?: JintanItemType
  }
}) {
  return useQuery({
    queryKey: jintanKeys.partsInventory.list({
      page,
      pageSize,
      filters: searchParams.filters,
      status: searchParams.status,
      itemType: searchParams.itemType,
    }),
    queryFn: () =>
      getJintanPartsInventoryList({
        page,
        pageSize,
        filters: searchParams.filters,
        status: searchParams.status,
        itemType: searchParams.itemType,
      }),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}

export function useJintanPartsInventorySummary(
  filters?: JintanSearchFilters,
  itemType?: JintanItemType,
) {
  return useQuery({
    queryKey: jintanKeys.partsInventory.summary(filters, itemType),
    queryFn: () => getJintanPartsInventoryStatusSummary(filters, itemType),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}

export function useUpdateJintanPartsInventory() {
  return useMutationWithInvalidation({
    mutationFn: updateJintanPartsInventory,
    invalidateQueries: [jintanKeys.partsInventory.all],
  })
}

export function useJintanPartsInventoryOptions(keyword?: string) {
  return useQuery({
    queryKey: jintanKeys.partsInventory.options(keyword),
    queryFn: () => getJintanPartsInventoryOptions(keyword),
    ...queryConfig.list,
  })
}

export function usePublicJintanPartsInventoryOptions(keyword?: string) {
  return useQuery({
    queryKey: jintanKeys.partsInventory.publicOptions(keyword),
    queryFn: ({ signal }) =>
      getPublicJintanPartsInventoryOptions(keyword, signal),
    ...queryConfig.list,
  })
}

export function useImportJintanPartsInventory() {
  return useMutationWithInvalidation({
    mutationFn: createJintanPartsInventoryBatch,
    invalidateQueries: [jintanKeys.partsInventory.all],
  })
}
