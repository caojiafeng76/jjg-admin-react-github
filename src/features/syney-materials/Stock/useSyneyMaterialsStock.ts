import type { SyneyMaterialsStockDirection, SyneyMaterialsStockFormValues } from '@/services/apiSyneyMaterialsStock'
import type { SyneyMaterialsSearchFilters } from '@/services/syneyMaterialsSearchFields'
import { useMutationWithInvalidation } from '@hooks/useMutationWithInvalidation'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import {
  createSyneyMaterialsStock,
  deleteSyneyMaterialsStock,
  getSyneyMaterialsStockList,
  updateSyneyMaterialsStockRemarks,
} from '@/services/apiSyneyMaterialsStock'
import { SYNEY_MATERIALS_DETAIL_RECORDS_PAGE_SIZE } from '../Inventory/useSyneyMaterialsInventory'
import { syneyMaterialsKeys } from '../queryKeys'

/** 出入库单会同事务改库存，并影响月报 */
function stockChangeInvalidation(direction: SyneyMaterialsStockDirection) {
  return [
    syneyMaterialsKeys.stock(direction).all,
    syneyMaterialsKeys.inventory.all,
    syneyMaterialsKeys.monthlyReport.all,
  ]
}

export function useSyneyMaterialsStockList(
  direction: SyneyMaterialsStockDirection,
  {
    page,
    pageSize,
    filters,
    keyword,
  }: {
    page: number
    pageSize: number
    filters?: SyneyMaterialsSearchFilters
    keyword?: string
  },
) {
  return useQuery({
    queryKey: syneyMaterialsKeys.stock(direction).list({ page, pageSize, filters, keyword }),
    queryFn: () =>
      getSyneyMaterialsStockList(direction, { page, pageSize, filters, keyword }),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}

/** 详情抽屉内单个库存行的出入库记录 */
export function useSyneyMaterialsStockRecords(
  direction: SyneyMaterialsStockDirection,
  {
    inventoryId,
    page,
    pageSize = SYNEY_MATERIALS_DETAIL_RECORDS_PAGE_SIZE,
  }: {
    inventoryId: string
    page: number
    pageSize?: number
  },
) {
  return useQuery({
    queryKey: syneyMaterialsKeys
      .stock(direction)
      .byInventory({ inventoryId, page, pageSize }),
    queryFn: ({ signal }) =>
      getSyneyMaterialsStockList(direction, {
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

export function useCreateSyneyMaterialsStock(
  direction: SyneyMaterialsStockDirection,
) {
  return useMutationWithInvalidation({
    mutationFn: (values: SyneyMaterialsStockFormValues) =>
      createSyneyMaterialsStock(direction, values),
    invalidateQueries: stockChangeInvalidation(direction),
  })
}

export function useDeleteSyneyMaterialsStock(
  direction: SyneyMaterialsStockDirection,
) {
  return useMutationWithInvalidation({
    mutationFn: (id: string) => deleteSyneyMaterialsStock(direction, id),
    invalidateQueries: stockChangeInvalidation(direction),
  })
}

export function useUpdateSyneyMaterialsStockRemarks(
  direction: SyneyMaterialsStockDirection,
) {
  return useMutationWithInvalidation({
    mutationFn: (params: { id: string, remarks: string }) =>
      updateSyneyMaterialsStockRemarks(direction, params),
    invalidateQueries: [syneyMaterialsKeys.stock(direction).all],
  })
}
