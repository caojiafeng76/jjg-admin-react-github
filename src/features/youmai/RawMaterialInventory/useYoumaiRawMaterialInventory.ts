import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  createYoumaiRawMaterialInventory,
  deleteYoumaiRawMaterialInventory,
  getYoumaiRawMaterialInventoryOptionById,
  getYoumaiRawMaterialInventoryList,
  updateYoumaiRawMaterialInventory,
} from '@/services/apiYoumaiRawMaterialInventory'

import { youmaiKeys } from '../queryKeys'

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
    queryKey: youmaiKeys.rawMaterialInventory.list({
      page,
      pageSize,
      keyword: searchParams.keyword,
    }),
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

export function useYoumaiRawMaterialInventoryOption(id?: string) {
  const normalizedId = id?.trim() ?? ''

  return useQuery({
    queryKey: youmaiKeys.rawMaterialInventory.detail(normalizedId),
    queryFn: ({ signal }) =>
      getYoumaiRawMaterialInventoryOptionById(normalizedId, signal),
    enabled: normalizedId.length > 0,
    ...queryConfig.detail,
  })
}

export function useCreateYoumaiRawMaterialInventory() {
  return useMutationWithInvalidation({
    mutationFn: createYoumaiRawMaterialInventory,
    invalidateQueries: [youmaiKeys.rawMaterialInventory.all],
  })
}

export function useUpdateYoumaiRawMaterialInventory() {
  return useMutationWithInvalidation({
    mutationFn: updateYoumaiRawMaterialInventory,
    invalidateQueries: [youmaiKeys.rawMaterialInventory.all],
  })
}

export function useDeleteYoumaiRawMaterialInventory() {
  return useMutationWithInvalidation({
    mutationFn: deleteYoumaiRawMaterialInventory,
    invalidateQueries: [youmaiKeys.rawMaterialInventory.all],
  })
}
