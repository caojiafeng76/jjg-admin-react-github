import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  createJintanPartsStockIn,
  deleteJintanPartsStockIn,
  getJintanPartsStockInList,
  updateJintanPartsStockInRemarks,
} from '@/services/apiJintanPartsStockIn'
import { jintanKeys } from '../queryKeys'

export function useJintanPartsStockInList({
  page,
  pageSize,
  keyword,
}: {
  page: number
  pageSize: number
  keyword?: string
}) {
  return useQuery({
    queryKey: jintanKeys.partsStockIn.list({ page, pageSize, keyword }),
    queryFn: () => getJintanPartsStockInList({ page, pageSize, keyword }),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}

export function useCreateJintanPartsStockIn() {
  return useMutationWithInvalidation({
    mutationFn: createJintanPartsStockIn,
    invalidateQueries: [
      jintanKeys.partsStockIn.all,
      jintanKeys.partsInventory.all,
    ],
  })
}

export function useDeleteJintanPartsStockIn() {
  return useMutationWithInvalidation({
    mutationFn: deleteJintanPartsStockIn,
    invalidateQueries: [
      jintanKeys.partsStockIn.all,
      jintanKeys.partsInventory.all,
    ],
  })
}

export function useUpdateJintanPartsStockInRemarks() {
  return useMutationWithInvalidation({
    mutationFn: updateJintanPartsStockInRemarks,
    invalidateQueries: [jintanKeys.partsStockIn.all],
  })
}
