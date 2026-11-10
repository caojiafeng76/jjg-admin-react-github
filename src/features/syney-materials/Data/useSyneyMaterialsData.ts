import type { SyneyMaterialsSearchFilters } from '@/services/syneyMaterialsSearchFields'
import { useMutationWithInvalidation } from '@hooks/useMutationWithInvalidation'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import {
  createSyneyMaterialsData,
  createSyneyMaterialsDataBatch,
  deleteSyneyMaterialsData,
  getSyneyMaterialsDataList,
  updateSyneyMaterialsData,
} from '@/services/apiSyneyMaterialsData'
import { getSyneyMaterialsInventoryByDataId } from '@/services/apiSyneyMaterialsInventory'
import { syneyMaterialsKeys } from '../queryKeys'

/** 资料变更会通过触发器同步库存行（新建 / 改名 / 级联删除），一并刷新库存与月报 */
const DATA_INVALIDATION = [
  syneyMaterialsKeys.data.all,
  syneyMaterialsKeys.inventory.all,
  syneyMaterialsKeys.monthlyReport.all,
]

export function useSyneyMaterialsDataList({
  page,
  pageSize,
  filters,
}: {
  page: number
  pageSize: number
  filters?: SyneyMaterialsSearchFilters
}) {
  return useQuery({
    queryKey: syneyMaterialsKeys.data.list({ page, pageSize, filters }),
    queryFn: () => getSyneyMaterialsDataList({ page, pageSize, filters }),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}

export function useCreateSyneyMaterialsData() {
  return useMutationWithInvalidation({
    mutationFn: createSyneyMaterialsData,
    invalidateQueries: DATA_INVALIDATION,
  })
}

export function useImportSyneyMaterialsData() {
  return useMutationWithInvalidation({
    mutationFn: createSyneyMaterialsDataBatch,
    invalidateQueries: DATA_INVALIDATION,
  })
}

export function useUpdateSyneyMaterialsData() {
  return useMutationWithInvalidation({
    mutationFn: updateSyneyMaterialsData,
    invalidateQueries: DATA_INVALIDATION,
  })
}

export function useDeleteSyneyMaterialsData() {
  return useMutationWithInvalidation({
    mutationFn: deleteSyneyMaterialsData,
    invalidateQueries: DATA_INVALIDATION,
  })
}

/** 单个材料的库存摘要（详情抽屉） */
export function useSyneyMaterialsInventoryDetail(materialDataId?: string) {
  return useQuery({
    queryKey: syneyMaterialsKeys.inventory.detail(materialDataId ?? ''),
    queryFn: ({ signal }) =>
      getSyneyMaterialsInventoryByDataId(materialDataId as string, signal),
    enabled: Boolean(materialDataId),
    throwOnError: false,
    ...queryConfig.list,
  })
}
