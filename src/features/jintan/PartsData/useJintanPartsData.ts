import type { JintanItemType } from '@/services/jintanItemType'
import type { JintanPartCategory } from '@/services/jintanPartCategory'
import type { JintanSearchFilters } from '@/services/jintanSearchFields'

import { useMutationWithInvalidation } from '@hooks/useMutationWithInvalidation'
import {
  createJintanPartsData,
  createJintanPartsDataBatch,
  deleteJintanPartsData,
  getJintanPartsDataList,
  updateJintanPartsData,
} from '@services/apiJintanPartsData'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { jintanKeys } from '../queryKeys'

export function useJintanPartsDataList({
  page,
  pageSize,
  searchParams,
}: {
  page: number
  pageSize: number
  searchParams: {
    filters?: JintanSearchFilters
    partCategory?: JintanPartCategory
    itemType?: JintanItemType
  }
}) {
  return useQuery({
    queryKey: jintanKeys.partsData.list({
      page,
      pageSize,
      filters: searchParams.filters,
      partCategory: searchParams.partCategory,
      itemType: searchParams.itemType,
    }),
    queryFn: () =>
      getJintanPartsDataList({
        page,
        pageSize,
        filters: searchParams.filters,
        partCategory: searchParams.partCategory,
        itemType: searchParams.itemType,
      }),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}

export function useCreateJintanPartsData() {
  return useMutationWithInvalidation({
    mutationFn: createJintanPartsData,
    invalidateQueries: [
      jintanKeys.partsData.all,
      jintanKeys.partsInventory.all,
      jintanKeys.monthlyReport.all,
    ],
  })
}

export function useImportJintanPartsData() {
  return useMutationWithInvalidation({
    mutationFn: createJintanPartsDataBatch,
    invalidateQueries: [
      jintanKeys.partsData.all,
      jintanKeys.partsInventory.all,
      jintanKeys.monthlyReport.all,
    ],
  })
}

export function useUpdateJintanPartsData() {
  return useMutationWithInvalidation({
    mutationFn: updateJintanPartsData,
    invalidateQueries: [
      jintanKeys.partsData.all,
      jintanKeys.partsInventory.all,
      jintanKeys.monthlyReport.all,
    ],
  })
}

export function useDeleteJintanPartsData() {
  return useMutationWithInvalidation({
    mutationFn: deleteJintanPartsData,
    invalidateQueries: [
      jintanKeys.partsData.all,
      jintanKeys.partsInventory.all,
      jintanKeys.monthlyReport.all,
    ],
  })
}
