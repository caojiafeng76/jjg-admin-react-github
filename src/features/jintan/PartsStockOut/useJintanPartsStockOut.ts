import type { JintanItemType } from '@/services/jintanItemType'
import type { JintanSearchFilters } from '@/services/jintanSearchFields'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  createJintanPartsStockOut,
  createPublicJintanPartsStockOut,
  deleteJintanPartsStockOut,
  getJintanPartsStockOutList,
  updateJintanPartsStockOutRemarks,
} from '@/services/apiJintanPartsStockOut'
import { jintanKeys } from '../queryKeys'

export function useJintanPartsStockOutList({
  page,
  pageSize,
  filters,
  itemType,
}: {
  page: number
  pageSize: number
  filters?: JintanSearchFilters
  itemType?: JintanItemType
}) {
  return useQuery({
    queryKey: jintanKeys.partsStockOut.list({
      page,
      pageSize,
      filters,
      itemType,
    }),
    queryFn: () => getJintanPartsStockOutList({ page, pageSize, filters, itemType }),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}

export function useCreateJintanPartsStockOut() {
  return useMutationWithInvalidation({
    mutationFn: createJintanPartsStockOut,
    invalidateQueries: [
      jintanKeys.partsStockOut.all,
      jintanKeys.partsInventory.all,
    ],
  })
}

export function useCreatePublicJintanPartsStockOut() {
  return useMutationWithInvalidation({
    mutationFn: createPublicJintanPartsStockOut,
  })
}

export function useDeleteJintanPartsStockOut() {
  return useMutationWithInvalidation({
    mutationFn: deleteJintanPartsStockOut,
    invalidateQueries: [
      jintanKeys.partsStockOut.all,
      jintanKeys.partsInventory.all,
    ],
  })
}

export function useUpdateJintanPartsStockOutRemarks() {
  return useMutationWithInvalidation({
    mutationFn: updateJintanPartsStockOutRemarks,
    invalidateQueries: [jintanKeys.partsStockOut.all],
  })
}
