import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@hooks/useMutationWithInvalidation'
import {
  createJintanMaterialsData,
  createJintanMaterialsDataBatch,
  deleteJintanMaterialsData,
  getJintanMaterialsDataList,
  updateJintanMaterialsData,
} from '@services/apiJintanMaterialsData'

import { jintanKeys } from '../queryKeys'

export function useJintanMaterialsDataList({
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
    queryKey: jintanKeys.materialsData.list({
      page,
      pageSize,
      keyword: searchParams.keyword,
    }),
    queryFn: () =>
      getJintanMaterialsDataList({
        page,
        pageSize,
        keyword: searchParams.keyword,
      }),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}

export function useCreateJintanMaterialsData() {
  return useMutationWithInvalidation({
    mutationFn: createJintanMaterialsData,
    invalidateQueries: [jintanKeys.materialsData.all],
  })
}

export function useImportJintanMaterialsData() {
  return useMutationWithInvalidation({
    mutationFn: createJintanMaterialsDataBatch,
    invalidateQueries: [jintanKeys.materialsData.all],
  })
}

export function useUpdateJintanMaterialsData() {
  return useMutationWithInvalidation({
    mutationFn: updateJintanMaterialsData,
    invalidateQueries: [jintanKeys.materialsData.all],
  })
}

export function useDeleteJintanMaterialsData() {
  return useMutationWithInvalidation({
    mutationFn: deleteJintanMaterialsData,
    invalidateQueries: [jintanKeys.materialsData.all],
  })
}
