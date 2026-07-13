import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  createYoumaiRawMaterialStockOut,
  deleteYoumaiRawMaterialStockOut,
  getYoumaiRawMaterialStockOutList,
  updateYoumaiRawMaterialStockOut,
} from '@/services/apiYoumaiRawMaterialStockOut'
import { getYoumaiRawMaterialInventoryOptions } from '@/services/apiYoumaiRawMaterialInventory'

import { youmaiKeys } from '../queryKeys'

const RAW_MATERIAL_STOCK_OUT_KEY = 'youmai-raw-material-stock-out' as const

export function useYoumaiRawMaterialStockOutList({
  page,
  pageSize,
  searchParams,
}: {
  page: number
  pageSize: number
  searchParams: { keyword?: string }
}) {
  return useQuery({
    queryKey: [RAW_MATERIAL_STOCK_OUT_KEY, page, pageSize, searchParams],
    queryFn: ({ signal }) =>
      getYoumaiRawMaterialStockOutList({
        page,
        pageSize,
        keyword: searchParams.keyword,
        signal,
      }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useYoumaiRawMaterialInventoryOptionsForStockOut(
  keyword?: string,
) {
  const normalizedKeyword = keyword?.trim()

  return useQuery({
    queryKey: youmaiKeys.rawMaterialInventory.options(normalizedKeyword),
    queryFn: ({ signal }) =>
      getYoumaiRawMaterialInventoryOptions(normalizedKeyword, signal),
    ...queryConfig.list,
  })
}

export function useCreateYoumaiRawMaterialStockOut() {
  return useMutationWithInvalidation({
    mutationFn: createYoumaiRawMaterialStockOut,
    invalidateQueries: [
      [RAW_MATERIAL_STOCK_OUT_KEY],
      youmaiKeys.rawMaterialInventory.all,
    ],
  })
}

export function useDeleteYoumaiRawMaterialStockOut() {
  return useMutationWithInvalidation({
    mutationFn: deleteYoumaiRawMaterialStockOut,
    invalidateQueries: [
      [RAW_MATERIAL_STOCK_OUT_KEY],
      youmaiKeys.rawMaterialInventory.all,
    ],
  })
}

export function useUpdateYoumaiRawMaterialStockOut() {
  return useMutationWithInvalidation({
    mutationFn: updateYoumaiRawMaterialStockOut,
    invalidateQueries: [[RAW_MATERIAL_STOCK_OUT_KEY]],
  })
}
