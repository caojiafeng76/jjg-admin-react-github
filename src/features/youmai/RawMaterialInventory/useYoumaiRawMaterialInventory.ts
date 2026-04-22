import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  createYoumaiRawMaterialInventory,
  deleteYoumaiRawMaterialInventory,
  getYoumaiRawMaterialInventoryList,
  updateYoumaiRawMaterialInventory,
} from '@/services/apiYoumaiRawMaterialInventory'

const RAW_MATERIAL_INVENTORY_KEY = 'youmai-raw-material-inventory' as const

export function useYoumaiRawMaterialInventoryList({
  page,
  pageSize,
  searchParams,
}: {
  page: number
  pageSize: number
  searchParams: { keyword?: string }
}) {
  return useQuery({
    queryKey: [RAW_MATERIAL_INVENTORY_KEY, page, pageSize, searchParams],
    queryFn: ({ signal }) =>
      getYoumaiRawMaterialInventoryList({
        page,
        pageSize,
        keyword: searchParams.keyword,
        signal,
      }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useCreateYoumaiRawMaterialInventory() {
  return useMutationWithInvalidation({
    mutationFn: createYoumaiRawMaterialInventory,
    invalidateQueries: [[RAW_MATERIAL_INVENTORY_KEY]],
  })
}

export function useUpdateYoumaiRawMaterialInventory() {
  return useMutationWithInvalidation({
    mutationFn: updateYoumaiRawMaterialInventory,
    invalidateQueries: [[RAW_MATERIAL_INVENTORY_KEY]],
  })
}

export function useDeleteYoumaiRawMaterialInventory() {
  return useMutationWithInvalidation({
    mutationFn: deleteYoumaiRawMaterialInventory,
    invalidateQueries: [[RAW_MATERIAL_INVENTORY_KEY]],
  })
}
