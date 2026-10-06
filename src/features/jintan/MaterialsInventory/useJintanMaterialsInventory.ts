import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@hooks/useMutationWithInvalidation'
import {
  createJintanMaterialsInventoryBatch,
  getJintanMaterialsInventoryList,
  getJintanMaterialsInventoryOptions,
  updateJintanMaterialsInventory,
} from '@services/apiJintanMaterialsInventory'

import { jintanKeys } from '../queryKeys'

export function useJintanMaterialsInventoryList({
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
    queryKey: jintanKeys.materialsInventory.list({
      page,
      pageSize,
      keyword: searchParams.keyword,
    }),
    queryFn: () =>
      getJintanMaterialsInventoryList({
        page,
        pageSize,
        keyword: searchParams.keyword,
      }),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}

export function useUpdateJintanMaterialsInventory() {
  return useMutationWithInvalidation({
    mutationFn: updateJintanMaterialsInventory,
    invalidateQueries: [jintanKeys.materialsInventory.all],
  })
}

export function useJintanMaterialsInventoryOptions(keyword?: string) {
  return useQuery({
    queryKey: jintanKeys.materialsInventory.options(keyword),
    queryFn: () => getJintanMaterialsInventoryOptions(keyword),
    ...queryConfig.list,
  })
}

export function useImportJintanMaterialsInventory() {
  return useMutationWithInvalidation({
    mutationFn: createJintanMaterialsInventoryBatch,
    invalidateQueries: [jintanKeys.materialsInventory.all],
  })
}
