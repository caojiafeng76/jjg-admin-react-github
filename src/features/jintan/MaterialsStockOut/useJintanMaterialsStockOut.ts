import { useMutationWithInvalidation } from '@hooks/useMutationWithInvalidation'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryConfig } from '@/config/queryClient'
import {
  createJintanMaterialsStockOut,
  deleteJintanMaterialsStockOut,
  getJintanMaterialsStockOutList,
  updateJintanMaterialsStockOutRemarks,
} from '@/services/apiJintanMaterialsStockOut'
import { jintanKeys } from '../queryKeys'

export function useJintanMaterialsStockOutList({
  page,
  pageSize,
  keyword,
}: {
  page: number
  pageSize: number
  keyword?: string
}) {
  return useQuery({
    queryKey: jintanKeys.materialsStockOut.list({ page, pageSize, keyword }),
    queryFn: () => getJintanMaterialsStockOutList({ page, pageSize, keyword }),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}

export function useCreateJintanMaterialsStockOut() {
  return useMutationWithInvalidation({
    mutationFn: createJintanMaterialsStockOut,
    invalidateQueries: [
      jintanKeys.materialsStockOut.all,
      jintanKeys.materialsInventory.all,
    ],
  })
}

export function useDeleteJintanMaterialsStockOut() {
  return useMutationWithInvalidation({
    mutationFn: deleteJintanMaterialsStockOut,
    invalidateQueries: [
      jintanKeys.materialsStockOut.all,
      jintanKeys.materialsInventory.all,
    ],
  })
}

export function useUpdateJintanMaterialsStockOutRemarks() {
  return useMutationWithInvalidation({
    mutationFn: updateJintanMaterialsStockOutRemarks,
    invalidateQueries: [jintanKeys.materialsStockOut.all],
  })
}
