import type { SyneyMaterialsSearchFilters } from '@/services/syneyMaterialsSearchFields'
import { useMutationWithInvalidation } from '@hooks/useMutationWithInvalidation'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import {
  getSyneyMaterialsInventoryList,
  getSyneyMaterialsInventoryOptions,
  updateSyneyMaterialsInventory,
  updateSyneyMaterialsInventoryBatch,
} from '@/services/apiSyneyMaterialsInventory'
import { getSyneyMaterialsAdjustmentList } from '@/services/apiSyneyMaterialsReport'
import { syneyMaterialsKeys } from '../queryKeys'

/** 直接改数会写调整流水并影响月报 */
const INVENTORY_INVALIDATION = [
  syneyMaterialsKeys.inventory.all,
  syneyMaterialsKeys.monthlyReport.all,
]

export function useSyneyMaterialsInventoryList({
  page,
  pageSize,
  filters,
}: {
  page: number
  pageSize: number
  filters?: SyneyMaterialsSearchFilters
}) {
  return useQuery({
    queryKey: syneyMaterialsKeys.inventory.list({ page, pageSize, filters }),
    queryFn: () => getSyneyMaterialsInventoryList({ page, pageSize, filters }),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}

export function useUpdateSyneyMaterialsInventory() {
  return useMutationWithInvalidation({
    mutationFn: updateSyneyMaterialsInventory,
    invalidateQueries: INVENTORY_INVALIDATION,
  })
}

export function useImportSyneyMaterialsInventory() {
  return useMutationWithInvalidation({
    mutationFn: updateSyneyMaterialsInventoryBatch,
    invalidateQueries: INVENTORY_INVALIDATION,
  })
}

export function useSyneyMaterialsInventoryOptions(keyword?: string) {
  return useQuery({
    queryKey: syneyMaterialsKeys.inventory.options(keyword),
    queryFn: () => getSyneyMaterialsInventoryOptions(keyword),
    ...queryConfig.list,
  })
}

export const SYNEY_MATERIALS_DETAIL_RECORDS_PAGE_SIZE = 10

export function useSyneyMaterialsAdjustments({
  inventoryId,
  page,
  pageSize = SYNEY_MATERIALS_DETAIL_RECORDS_PAGE_SIZE,
}: {
  inventoryId: string
  page: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: syneyMaterialsKeys.inventory.adjustments({ inventoryId, page, pageSize }),
    queryFn: ({ signal }) =>
      getSyneyMaterialsAdjustmentList({ inventoryId, page, pageSize, signal }),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}
