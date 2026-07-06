import { useQuery, keepPreviousData } from '@tanstack/react-query'

import {
  batchUpdateMaterialTransfers,
  buildOrderProgressMap,
  getMaterialTransferQuantityStats,
  getMaterialTransfers,
  getMaterialTransferById,
  getMaterialTransferProjectNos,
  getMaterialTransferModels,
  getMaterialTransferLengths,
  getOrderQuantitiesByProjectNos,
  getTransferTotalByProjectNos,
  createMaterialTransfer,
  updateMaterialTransfer,
  deleteMaterialTransfers,
  type MaterialTransferFilters,
  type MaterialTransferOrderProgress,
} from '@/services/apiMaterialTransfers'
import { queryConfig } from '@/config/queryClient'
import { useMutationWithMessage } from '@/hooks/useMutationWithMessage'

const MATERIAL_TRANSFERS_KEY = 'material-transfers' as const

export function useMaterialTransfers({
  page,
  pageSize,
  filters,
}: {
  page: number
  pageSize: number
  filters: MaterialTransferFilters
}) {
  return useQuery({
    queryKey: [MATERIAL_TRANSFERS_KEY, page, pageSize, filters],
    queryFn: () => getMaterialTransfers({ page, pageSize, ...filters }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useMaterialTransfer(id: string | undefined) {
  return useQuery({
    queryKey: [MATERIAL_TRANSFERS_KEY, id],
    queryFn: () => getMaterialTransferById(id!),
    enabled: !!id,
    ...queryConfig.detail,
  })
}

export function useMaterialTransferQuantityStats({
  ids,
  filters,
  enabled = true,
}: {
  ids?: string[]
  filters?: MaterialTransferFilters
  enabled?: boolean
}) {
  return useQuery({
    queryKey: [
      MATERIAL_TRANSFERS_KEY,
      'quantity-stats',
      ids || null,
      filters || null,
    ],
    queryFn: () => getMaterialTransferQuantityStats({ ids, filters }),
    enabled,
    ...queryConfig.list,
  })
}

export function useOrderProgressByProjectNos(
  projectNos: string[],
): Map<string, MaterialTransferOrderProgress> {
  const sortedKey = [...projectNos].sort().join('|')
  const { data } = useQuery({
    queryKey: [MATERIAL_TRANSFERS_KEY, 'order-progress', sortedKey],
    queryFn: async () => {
      const [orderQtyMap, transferTotalMap] = await Promise.all([
        getOrderQuantitiesByProjectNos(projectNos),
        getTransferTotalByProjectNos(projectNos),
      ])
      return buildOrderProgressMap(orderQtyMap, transferTotalMap)
    },
    enabled: projectNos.length > 0,
    ...queryConfig.list,
  })
  return data ?? new Map<string, MaterialTransferOrderProgress>()
}

export function useMaterialTransferProjectNos() {
  return useQuery({
    queryKey: [MATERIAL_TRANSFERS_KEY, 'project-no-options'],
    queryFn: getMaterialTransferProjectNos,
    ...queryConfig.list,
  })
}

export function useMaterialTransferModels() {
  return useQuery({
    queryKey: [MATERIAL_TRANSFERS_KEY, 'model-options'],
    queryFn: getMaterialTransferModels,
    ...queryConfig.list,
  })
}

export function useMaterialTransferLengths() {
  return useQuery({
    queryKey: [MATERIAL_TRANSFERS_KEY, 'length-options'],
    queryFn: getMaterialTransferLengths,
    ...queryConfig.list,
  })
}

export function useCreateMaterialTransfer() {
  return useMutationWithMessage({
    mutationFn: createMaterialTransfer,
    invalidateQueries: [[MATERIAL_TRANSFERS_KEY]],
    successMessage: '创建物料调拨单成功',
  })
}

export function useUpdateMaterialTransfer() {
  return useMutationWithMessage({
    mutationFn: ({
      id,
      values,
    }: {
      id: string
      values: Parameters<typeof updateMaterialTransfer>[0]['values']
    }) => updateMaterialTransfer({ id, values }),
    invalidateQueries: [[MATERIAL_TRANSFERS_KEY]],
    successMessage: '更新物料调拨单成功',
  })
}

export function useDeleteMaterialTransfers() {
  return useMutationWithMessage({
    mutationFn: deleteMaterialTransfers,
    invalidateQueries: [[MATERIAL_TRANSFERS_KEY]],
    successMessage: '删除物料调拨单成功',
  })
}

export function useBatchUpdateMaterialTransfers() {
  return useMutationWithMessage({
    mutationFn: batchUpdateMaterialTransfers,
    invalidateQueries: [[MATERIAL_TRANSFERS_KEY]],
    successMessage: '批量更新物料调拨单成功',
  })
}
