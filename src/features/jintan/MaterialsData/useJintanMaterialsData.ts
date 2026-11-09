import type { JintanItemType } from '@/services/jintanItemType'
import type { JintanSearchFilters } from '@/services/jintanSearchFields'

import { useMutationWithInvalidation } from '@hooks/useMutationWithInvalidation'
import {
  createJintanMaterialsData,
  createJintanMaterialsDataBatch,
  deleteJintanMaterialsData,
  getJintanMaterialsDataList,
  updateJintanMaterialsData,
} from '@services/apiJintanMaterialsData'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { jintanKeys } from '../queryKeys'

export function useJintanMaterialsDataList({
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
    queryKey: jintanKeys.materialsData.list({
      page,
      pageSize,
      filters: searchParams.filters,
      itemType: searchParams.itemType,
    }),
    queryFn: () =>
      getJintanMaterialsDataList({
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
