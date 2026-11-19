import type { WorkshopMiscMaterialsSearchFilters } from '@/services/workshopMiscMaterialsSearchFields'
import { useMutationWithInvalidation } from '@hooks/useMutationWithInvalidation'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import {
  createWorkshopMiscMaterialsData,
  createWorkshopMiscMaterialsDataBatch,
  deleteWorkshopMiscMaterialsData,
  getWorkshopMiscMaterialsDataList,
  updateWorkshopMiscMaterialsData,
} from '@/services/apiWorkshopMiscMaterialsData'
import { getWorkshopMiscMaterialsInventoryByDataId } from '@/services/apiWorkshopMiscMaterialsInventory'
import { workshopMiscMaterialsKeys } from '../queryKeys'

/** 资料变更会通过触发器同步库存行，同时可能新增/变更历史类别与月报 */
const DATA_INVALIDATION = [
  workshopMiscMaterialsKeys.data.all,
  workshopMiscMaterialsKeys.categories.all,
  workshopMiscMaterialsKeys.inventory.all,
  workshopMiscMaterialsKeys.monthlyReport.all,
]

export function useWorkshopMiscMaterialsDataList({
  page,
  pageSize,
  filters,
}: {
  page: number
  pageSize: number
  filters?: WorkshopMiscMaterialsSearchFilters
}) {
  return useQuery({
    queryKey: workshopMiscMaterialsKeys.data.list({ page, pageSize, filters }),
    queryFn: () => getWorkshopMiscMaterialsDataList({ page, pageSize, filters }),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}

export function useCreateWorkshopMiscMaterialsData() {
  return useMutationWithInvalidation({
    mutationFn: createWorkshopMiscMaterialsData,
    invalidateQueries: DATA_INVALIDATION,
  })
}

export function useImportWorkshopMiscMaterialsData() {
  return useMutationWithInvalidation({
    mutationFn: createWorkshopMiscMaterialsDataBatch,
    invalidateQueries: DATA_INVALIDATION,
  })
}

export function useUpdateWorkshopMiscMaterialsData() {
  return useMutationWithInvalidation({
    mutationFn: updateWorkshopMiscMaterialsData,
    invalidateQueries: DATA_INVALIDATION,
  })
}

export function useDeleteWorkshopMiscMaterialsData() {
  return useMutationWithInvalidation({
    mutationFn: deleteWorkshopMiscMaterialsData,
    invalidateQueries: DATA_INVALIDATION,
  })
}

/** 单个材料的库存摘要（详情抽屉） */
export function useWorkshopMiscMaterialsInventoryDetail(materialDataId?: string) {
  return useQuery({
    queryKey: workshopMiscMaterialsKeys.inventory.detail(materialDataId ?? ''),
    queryFn: ({ signal }) =>
      getWorkshopMiscMaterialsInventoryByDataId(materialDataId as string, signal),
    enabled: Boolean(materialDataId),
    throwOnError: false,
    ...queryConfig.list,
  })
}
