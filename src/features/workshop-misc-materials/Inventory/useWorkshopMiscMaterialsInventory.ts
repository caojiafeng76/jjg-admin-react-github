import type { WorkshopMiscMaterialsSearchFilters } from '@/services/workshopMiscMaterialsSearchFields'
import { useMutationWithInvalidation } from '@hooks/useMutationWithInvalidation'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import {
  getWorkshopMiscMaterialsInventoryList,
  getWorkshopMiscMaterialsInventoryOptions,
  updateWorkshopMiscMaterialsInventory,
  updateWorkshopMiscMaterialsInventoryBatch,
} from '@/services/apiWorkshopMiscMaterialsInventory'
import { getWorkshopMiscMaterialsAdjustmentList } from '@/services/apiWorkshopMiscMaterialsReport'
import { workshopMiscMaterialsKeys } from '../queryKeys'

/** 直接改数会写调整流水并影响月报 */
const INVENTORY_INVALIDATION = [
  workshopMiscMaterialsKeys.inventory.all,
  workshopMiscMaterialsKeys.monthlyReport.all,
]

export function useWorkshopMiscMaterialsInventoryList({
  page,
  pageSize,
  filters,
  keyword,
}: {
  page: number
  pageSize: number
  filters?: WorkshopMiscMaterialsSearchFilters
  keyword?: string
}) {
  return useQuery({
    queryKey: workshopMiscMaterialsKeys.inventory.list({
      page,
      pageSize,
      filters,
      keyword,
    }),
    queryFn: () =>
      getWorkshopMiscMaterialsInventoryList({ page, pageSize, filters, keyword }),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}

export function useUpdateWorkshopMiscMaterialsInventory() {
  return useMutationWithInvalidation({
    mutationFn: updateWorkshopMiscMaterialsInventory,
    invalidateQueries: INVENTORY_INVALIDATION,
  })
}

export function useImportWorkshopMiscMaterialsInventory() {
  return useMutationWithInvalidation({
    mutationFn: updateWorkshopMiscMaterialsInventoryBatch,
    invalidateQueries: INVENTORY_INVALIDATION,
  })
}

export function useWorkshopMiscMaterialsInventoryOptions(keyword?: string) {
  return useQuery({
    queryKey: workshopMiscMaterialsKeys.inventory.options(keyword),
    queryFn: () => getWorkshopMiscMaterialsInventoryOptions(keyword),
    ...queryConfig.list,
  })
}

export const WORKSHOP_MISC_MATERIALS_DETAIL_RECORDS_PAGE_SIZE = 10

export function useWorkshopMiscMaterialsAdjustments({
  inventoryId,
  page,
  pageSize = WORKSHOP_MISC_MATERIALS_DETAIL_RECORDS_PAGE_SIZE,
}: {
  inventoryId: string
  page: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: workshopMiscMaterialsKeys.inventory.adjustments({
      inventoryId,
      page,
      pageSize,
    }),
    queryFn: ({ signal }) =>
      getWorkshopMiscMaterialsAdjustmentList({ inventoryId, page, pageSize, signal }),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}
