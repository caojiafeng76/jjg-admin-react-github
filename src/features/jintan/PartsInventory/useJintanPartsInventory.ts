import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@hooks/useMutationWithInvalidation'
import {
  createJintanPartsInventoryBatch,
  getJintanPartsInventoryList,
  getJintanPartsInventoryOptions,
  getPublicJintanPartsInventoryOptions,
  updateJintanPartsInventory,
} from '@services/apiJintanPartsInventory'

import { jintanKeys } from '../queryKeys'

export function useJintanPartsInventoryList({
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
    queryKey: jintanKeys.partsInventory.list({
      page,
      pageSize,
      keyword: searchParams.keyword,
    }),
    queryFn: () =>
      getJintanPartsInventoryList({
        page,
        pageSize,
        keyword: searchParams.keyword,
      }),
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
