import type { MaterialTransferFilters, MaterialTransferOrderProgress } from '@/services/apiMaterialTransfers'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  batchUpdateMaterialTransfers,
  buildOrderProgressMap,
  createMaterialTransfer,
  deleteMaterialTransfers,
  getMaterialTransferById,
  getMaterialTransferLengths,
  getMaterialTransferModels,
  getMaterialTransferProjectNos,
  getMaterialTransferQuantityStats,
  getMaterialTransfers,
  getOrderQuantitiesByProjectNos,
  getTransferTotalByProjectNos,

  updateMaterialTransfer,
} from '@/services/apiMaterialTransfers'

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
    // 不抛错到 ErrorBoundary，让列表页用 TableState 展示错误态 + 重试
    throwOnError: false,
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
  return useMutationWithInvalidation({
    mutationFn: createMaterialTransfer,
    invalidateQueries: [[MATERIAL_TRANSFERS_KEY]],
  })
}

export function useUpdateMaterialTransfer() {
  return useMutationWithInvalidation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string
      values: Parameters<typeof updateMaterialTransfer>[0]['values']
    }) => updateMaterialTransfer({ id, values }),
    invalidateQueries: [[MATERIAL_TRANSFERS_KEY]],
  })
}

export function useDeleteMaterialTransfers() {
  return useMutationWithInvalidation({
    mutationFn: deleteMaterialTransfers,
    invalidateQueries: [[MATERIAL_TRANSFERS_KEY]],
  })
}

export function useBatchUpdateMaterialTransfers() {
  return useMutationWithInvalidation({
    mutationFn: batchUpdateMaterialTransfers,
    invalidateQueries: [[MATERIAL_TRANSFERS_KEY]],
  })
}
