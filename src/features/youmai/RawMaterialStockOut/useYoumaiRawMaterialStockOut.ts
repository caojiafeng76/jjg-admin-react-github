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

const RAW_MATERIAL_STOCK_OUT_KEY = 'youmai-raw-material-stock-out' as const
const RAW_MATERIAL_INVENTORY_KEY = 'youmai-raw-material-inventory' as const
const RAW_MATERIAL_INVENTORY_OPTIONS_KEY =
  'youmai-raw-material-inventory-options' as const

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

export function useYoumaiRawMaterialInventoryOptionsForStockOut() {
  return useQuery({
    queryKey: [RAW_MATERIAL_INVENTORY_OPTIONS_KEY],
    queryFn: () => getYoumaiRawMaterialInventoryOptions(),
    ...queryConfig.list,
  })
}

export function useCreateYoumaiRawMaterialStockOut() {
  return useMutationWithInvalidation({
    mutationFn: createYoumaiRawMaterialStockOut,
    invalidateQueries: [
      [RAW_MATERIAL_STOCK_OUT_KEY],
      [RAW_MATERIAL_INVENTORY_KEY],
      [RAW_MATERIAL_INVENTORY_OPTIONS_KEY],
    ],
  })
}

export function useDeleteYoumaiRawMaterialStockOut() {
  return useMutationWithInvalidation({
    mutationFn: deleteYoumaiRawMaterialStockOut,
    invalidateQueries: [
      [RAW_MATERIAL_STOCK_OUT_KEY],
      [RAW_MATERIAL_INVENTORY_KEY],
      [RAW_MATERIAL_INVENTORY_OPTIONS_KEY],
    ],
  })
}

export function useUpdateYoumaiRawMaterialStockOut() {
  return useMutationWithInvalidation({
    mutationFn: updateYoumaiRawMaterialStockOut,
    invalidateQueries: [[RAW_MATERIAL_STOCK_OUT_KEY]],
  })
}
