import { useQuery, keepPreviousData } from '@tanstack/react-query'

import {
  batchUpdateMaterialTransfers,
  getMaterialTransferQuantityStats,
  getMaterialTransfers,
  getMaterialTransferById,
  getMaterialTransferProjectNos,
  getMaterialTransferModels,
  getMaterialTransferLengths,
  createMaterialTransfer,
  updateMaterialTransfer,
  deleteMaterialTransfers,
  type MaterialTransferFilters,
} from '@/services/apiMaterialTransfers'
import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'

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
