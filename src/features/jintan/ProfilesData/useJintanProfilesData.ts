import type { JintanItemType } from '@/services/jintanItemType'
import type { JintanSearchFilters } from '@/services/jintanSearchFields'

import { useMutationWithInvalidation } from '@hooks/useMutationWithInvalidation'
import {
  createJintanProfilesData,
  createJintanProfilesDataBatch,
  deleteJintanProfilesData,
  getJintanProfilesDataList,
  updateJintanProfilesData,
} from '@services/apiJintanProfilesData'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { jintanKeys } from '../queryKeys'

export function useJintanProfilesDataList({
  page,
  pageSize,
  searchParams,
}: {
  page: number
  pageSize: number
  searchParams: {
    filters?: JintanSearchFilters
    itemType?: JintanItemType
  }
}) {
  return useQuery({
    queryKey: jintanKeys.profilesData.list({
      page,
      pageSize,
      filters: searchParams.filters,
      itemType: searchParams.itemType,
    }),
    queryFn: () =>
      getJintanProfilesDataList({
        page,
        pageSize,
        filters: searchParams.filters,
        itemType: searchParams.itemType,
      }),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}

export function useCreateJintanProfilesData() {
  return useMutationWithInvalidation({
    mutationFn: createJintanProfilesData,
    invalidateQueries: [jintanKeys.profilesData.all],
  })
}

export function useImportJintanProfilesData() {
  return useMutationWithInvalidation({
    mutationFn: createJintanProfilesDataBatch,
    invalidateQueries: [jintanKeys.profilesData.all],
  })
}

export function useUpdateJintanProfilesData() {
  return useMutationWithInvalidation({
    mutationFn: updateJintanProfilesData,
    invalidateQueries: [jintanKeys.profilesData.all],
  })
}

export function useDeleteJintanProfilesData() {
  return useMutationWithInvalidation({
    mutationFn: deleteJintanProfilesData,
    invalidateQueries: [jintanKeys.profilesData.all],
  })
}
