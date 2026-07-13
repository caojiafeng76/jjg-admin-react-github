import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  createYoumaiRawMaterialStockIn,
  deleteYoumaiRawMaterialStockIn,
  getYoumaiRawMaterialStockInList,
  updateYoumaiRawMaterialStockIn,
} from '@/services/apiYoumaiRawMaterialStockIn'
import { getYoumaiRawMaterialInventoryOptions } from '@/services/apiYoumaiRawMaterialInventory'

import { youmaiKeys } from '../queryKeys'

const RAW_MATERIAL_STOCK_IN_KEY = 'youmai-raw-material-stock-in' as const

export function useYoumaiRawMaterialStockInList({
  page,
  pageSize,
  searchParams,
}: {
  page: number
  pageSize: number
  searchParams: { keyword?: string }
}) {
  return useQuery({
    queryKey: [RAW_MATERIAL_STOCK_IN_KEY, page, pageSize, searchParams],
    queryFn: ({ signal }) =>
      getYoumaiRawMaterialStockInList({
        page,
        pageSize,
        keyword: searchParams.keyword,
        signal,
      }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useYoumaiRawMaterialInventoryOptions(keyword?: string) {
  const normalizedKeyword = keyword?.trim()

  return useQuery({
    queryKey: youmaiKeys.rawMaterialInventory.options(normalizedKeyword),
    queryFn: ({ signal }) =>
      getYoumaiRawMaterialInventoryOptions(normalizedKeyword, signal),
    ...queryConfig.list,
  })
}

export function useCreateYoumaiRawMaterialStockIn() {
  return useMutationWithInvalidation({
    mutationFn: createYoumaiRawMaterialStockIn,
    invalidateQueries: [
      [RAW_MATERIAL_STOCK_IN_KEY],
      youmaiKeys.rawMaterialInventory.all,
    ],
  })
}

export function useDeleteYoumaiRawMaterialStockIn() {
  return useMutationWithInvalidation({
    mutationFn: deleteYoumaiRawMaterialStockIn,
    invalidateQueries: [
      [RAW_MATERIAL_STOCK_IN_KEY],
      youmaiKeys.rawMaterialInventory.all,
    ],
  })
}

export function useUpdateYoumaiRawMaterialStockIn() {
  return useMutationWithInvalidation({
    mutationFn: updateYoumaiRawMaterialStockIn,
    invalidateQueries: [[RAW_MATERIAL_STOCK_IN_KEY]],
  })
}
