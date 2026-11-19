import type {
  WorkshopMiscMaterialsStockDirection,
  WorkshopMiscMaterialsStockFormValues,
} from '@/services/apiWorkshopMiscMaterialsStock'
import type { WorkshopMiscMaterialsSearchFilters } from '@/services/workshopMiscMaterialsSearchFields'
import { useMutationWithInvalidation } from '@hooks/useMutationWithInvalidation'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import {
  createWorkshopMiscMaterialsStock,
  deleteWorkshopMiscMaterialsStock,
  getWorkshopMiscMaterialsStockList,
  updateWorkshopMiscMaterialsStockRemarks,
} from '@/services/apiWorkshopMiscMaterialsStock'
import { WORKSHOP_MISC_MATERIALS_DETAIL_RECORDS_PAGE_SIZE } from '../Inventory/useWorkshopMiscMaterialsInventory'
import { workshopMiscMaterialsKeys } from '../queryKeys'

/** 出入库单会同事务改库存，并影响月报 */
function stockChangeInvalidation(direction: WorkshopMiscMaterialsStockDirection) {
  return [
    workshopMiscMaterialsKeys.stock(direction).all,
    workshopMiscMaterialsKeys.inventory.all,
    workshopMiscMaterialsKeys.monthlyReport.all,
  ]
}

export function useWorkshopMiscMaterialsStockList(
  direction: WorkshopMiscMaterialsStockDirection,
  {
    page,
    pageSize,
    filters,
    keyword,
  }: {
    page: number
    pageSize: number
    filters?: WorkshopMiscMaterialsSearchFilters
    keyword?: string
  },
) {
  return useQuery({
    queryKey: workshopMiscMaterialsKeys
      .stock(direction)
      .list({ page, pageSize, filters, keyword }),
    queryFn: () =>
      getWorkshopMiscMaterialsStockList(direction, {
        page,
        pageSize,
        filters,
        keyword,
      }),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}

/** 详情抽屉内单个库存行的出入库记录 */
export function useWorkshopMiscMaterialsStockRecords(
  direction: WorkshopMiscMaterialsStockDirection,
  {
    inventoryId,
    page,
    pageSize = WORKSHOP_MISC_MATERIALS_DETAIL_RECORDS_PAGE_SIZE,
  }: {
    inventoryId: string
    page: number
    pageSize?: number
  },
) {
  return useQuery({
    queryKey: workshopMiscMaterialsKeys
      .stock(direction)
      .byInventory({ inventoryId, page, pageSize }),
    queryFn: ({ signal }) =>
      getWorkshopMiscMaterialsStockList(direction, {
        page,
        pageSize,
        inventoryId,
        signal,
      }),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}

export function useCreateWorkshopMiscMaterialsStock(
  direction: WorkshopMiscMaterialsStockDirection,
) {
  return useMutationWithInvalidation({
    mutationFn: (values: WorkshopMiscMaterialsStockFormValues) =>
      createWorkshopMiscMaterialsStock(direction, values),
    invalidateQueries: stockChangeInvalidation(direction),
  })
}

export function useDeleteWorkshopMiscMaterialsStock(
  direction: WorkshopMiscMaterialsStockDirection,
) {
  return useMutationWithInvalidation({
    mutationFn: (id: string) => deleteWorkshopMiscMaterialsStock(direction, id),
    invalidateQueries: stockChangeInvalidation(direction),
  })
}

export function useUpdateWorkshopMiscMaterialsStockRemarks(
  direction: WorkshopMiscMaterialsStockDirection,
) {
  return useMutationWithInvalidation({
    mutationFn: (params: { id: string, remarks: string }) =>
      updateWorkshopMiscMaterialsStockRemarks(direction, params),
    invalidateQueries: [workshopMiscMaterialsKeys.stock(direction).all],
  })
}
