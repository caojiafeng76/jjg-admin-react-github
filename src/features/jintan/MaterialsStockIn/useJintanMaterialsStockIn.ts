import type { JintanItemType } from '@/services/jintanItemType'

import { useMutationWithInvalidation } from '@hooks/useMutationWithInvalidation'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryConfig } from '@/config/queryClient'
import {
  createJintanMaterialsStockIn,
  deleteJintanMaterialsStockIn,
  getJintanMaterialsStockInList,
  updateJintanMaterialsStockInRemarks,
} from '@/services/apiJintanMaterialsStockIn'
import { jintanKeys } from '../queryKeys'

export function useJintanMaterialsStockInList({
  page,
  pageSize,
  keyword,
  itemType,
}: {
  page: number
  pageSize: number
  keyword?: string
  itemType?: JintanItemType
}) {
  return useQuery({
    queryKey: jintanKeys.materialsStockIn.list({
      page,
      pageSize,
      keyword,
      itemType,
    }),
    queryFn: () => getJintanMaterialsStockInList({ page, pageSize, keyword, itemType }),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}

export function useCreateJintanMaterialsStockIn() {
  return useMutationWithInvalidation({
    mutationFn: createJintanMaterialsStockIn,
    invalidateQueries: [
      jintanKeys.materialsStockIn.all,
      jintanKeys.materialsInventory.all,
    ],
  })
}

export function useDeleteJintanMaterialsStockIn() {
  return useMutationWithInvalidation({
    mutationFn: deleteJintanMaterialsStockIn,
    invalidateQueries: [
      jintanKeys.materialsStockIn.all,
      jintanKeys.materialsInventory.all,
    ],
  })
}

export function useUpdateJintanMaterialsStockInRemarks() {
  return useMutationWithInvalidation({
    mutationFn: updateJintanMaterialsStockInRemarks,
    invalidateQueries: [jintanKeys.materialsStockIn.all],
  })
}
