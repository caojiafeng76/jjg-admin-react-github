import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@hooks/useMutationWithInvalidation'
import {
  createJintanPartsData,
  deleteJintanPartsData,
  getJintanPartsDataList,
  updateJintanPartsData,
} from '@services/apiJintanPartsData'

import { jintanKeys } from '../queryKeys'

export function useJintanPartsDataList({
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
    queryKey: jintanKeys.partsData.list({
      page,
      pageSize,
      keyword: searchParams.keyword,
    }),
    queryFn: () =>
      getJintanPartsDataList({
        page,
        pageSize,
        keyword: searchParams.keyword,
      }),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}

export function useCreateJintanPartsData() {
  return useMutationWithInvalidation({
    mutationFn: createJintanPartsData,
    invalidateQueries: [jintanKeys.partsData.all],
  })
}

export function useUpdateJintanPartsData() {
  return useMutationWithInvalidation({
    mutationFn: updateJintanPartsData,
    invalidateQueries: [jintanKeys.partsData.all],
  })
}

export function useDeleteJintanPartsData() {
  return useMutationWithInvalidation({
    mutationFn: deleteJintanPartsData,
    invalidateQueries: [jintanKeys.partsData.all],
  })
}
