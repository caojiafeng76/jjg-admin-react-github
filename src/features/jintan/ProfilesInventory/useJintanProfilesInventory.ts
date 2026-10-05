import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@hooks/useMutationWithInvalidation'
import {
  createJintanProfilesInventoryBatch,
  getJintanProfilesInventoryList,
  getJintanProfilesInventoryOptions,
  updateJintanProfilesInventory,
} from '@services/apiJintanProfilesInventory'

import { jintanKeys } from '../queryKeys'

export function useJintanProfilesInventoryList({
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
    queryKey: jintanKeys.profilesInventory.list({
      page,
      pageSize,
      keyword: searchParams.keyword,
    }),
    queryFn: () =>
      getJintanProfilesInventoryList({
        page,
        pageSize,
        keyword: searchParams.keyword,
      }),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}

export function useUpdateJintanProfilesInventory() {
  return useMutationWithInvalidation({
    mutationFn: updateJintanProfilesInventory,
    invalidateQueries: [jintanKeys.profilesInventory.all],
  })
}

export function useJintanProfilesInventoryOptions(keyword?: string) {
  return useQuery({
    queryKey: jintanKeys.profilesInventory.options(keyword),
    queryFn: () => getJintanProfilesInventoryOptions(keyword),
    ...queryConfig.list,
  })
}

export function useImportJintanProfilesInventory() {
  return useMutationWithInvalidation({
    mutationFn: createJintanProfilesInventoryBatch,
    invalidateQueries: [jintanKeys.profilesInventory.all],
  })
}
