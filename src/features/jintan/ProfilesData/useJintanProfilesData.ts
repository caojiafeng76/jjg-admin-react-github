import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@hooks/useMutationWithInvalidation'
import {
  createJintanProfilesData,
  createJintanProfilesDataBatch,
  deleteJintanProfilesData,
  getJintanProfilesDataList,
  updateJintanProfilesData,
} from '@services/apiJintanProfilesData'

import { jintanKeys } from '../queryKeys'

export function useJintanProfilesDataList({
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
    queryKey: jintanKeys.profilesData.list({
      page,
      pageSize,
      keyword: searchParams.keyword,
    }),
    queryFn: () =>
      getJintanProfilesDataList({
        page,
        pageSize,
        keyword: searchParams.keyword,
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
