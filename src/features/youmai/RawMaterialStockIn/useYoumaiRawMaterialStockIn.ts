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

const RAW_MATERIAL_STOCK_IN_KEY = 'youmai-raw-material-stock-in' as const
const RAW_MATERIAL_INVENTORY_KEY = 'youmai-raw-material-inventory' as const
const RAW_MATERIAL_INVENTORY_OPTIONS_KEY =
  'youmai-raw-material-inventory-options' as const

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

export function useYoumaiRawMaterialInventoryOptions() {
  return useQuery({
    queryKey: [RAW_MATERIAL_INVENTORY_OPTIONS_KEY],
    queryFn: () => getYoumaiRawMaterialInventoryOptions(),
    ...queryConfig.list,
  })
}

export function useCreateYoumaiRawMaterialStockIn() {
  return useMutationWithInvalidation({
    mutationFn: createYoumaiRawMaterialStockIn,
    invalidateQueries: [
      [RAW_MATERIAL_STOCK_IN_KEY],
      [RAW_MATERIAL_INVENTORY_KEY],
      [RAW_MATERIAL_INVENTORY_OPTIONS_KEY],
    ],
  })
}

export function useDeleteYoumaiRawMaterialStockIn() {
  return useMutationWithInvalidation({
    mutationFn: deleteYoumaiRawMaterialStockIn,
    invalidateQueries: [
      [RAW_MATERIAL_STOCK_IN_KEY],
      [RAW_MATERIAL_INVENTORY_KEY],
      [RAW_MATERIAL_INVENTORY_OPTIONS_KEY],
    ],
  })
}

export function useUpdateYoumaiRawMaterialStockIn() {
  return useMutationWithInvalidation({
    mutationFn: updateYoumaiRawMaterialStockIn,
    invalidateQueries: [[RAW_MATERIAL_STOCK_IN_KEY]],
  })
}
