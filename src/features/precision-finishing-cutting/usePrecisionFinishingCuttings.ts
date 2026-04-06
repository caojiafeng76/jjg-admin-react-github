import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  batchUpdatePrecisionFinishingCuttings,
  createPrecisionFinishingCutting,
  deletePrecisionFinishingCuttings,
  getPrecisionFinishingCuttingById,
  getPrecisionFinishingCuttingQuantityStats,
  getPrecisionFinishingCuttings,
  updatePrecisionFinishingCutting,
  type PrecisionFinishingCuttingFilters,
} from '@/services/apiPrecisionFinishingCuttings'

const PRECISION_FINISHING_CUTTINGS_KEY =
  'precision-finishing-cuttings' as const

export function usePrecisionFinishingCuttings({
  page,
  pageSize,
  filters,
}: {
  page: number
  pageSize: number
  filters: PrecisionFinishingCuttingFilters
}) {
  return useQuery({
    queryKey: [PRECISION_FINISHING_CUTTINGS_KEY, page, pageSize, filters],
    queryFn: () => getPrecisionFinishingCuttings({ page, pageSize, ...filters }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function usePrecisionFinishingCutting(id: string | undefined) {
  return useQuery({
    queryKey: [PRECISION_FINISHING_CUTTINGS_KEY, id],
    queryFn: () => getPrecisionFinishingCuttingById(id!),
    enabled: !!id,
    ...queryConfig.detail,
  })
}

export function usePrecisionFinishingCuttingQuantityStats({
  ids,
  filters,
  enabled = true,
}: {
  ids?: string[]
  filters?: PrecisionFinishingCuttingFilters
  enabled?: boolean
}) {
  return useQuery({
    queryKey: [
      PRECISION_FINISHING_CUTTINGS_KEY,
      'quantity-stats',
      ids || null,
      filters || null,
    ],
    queryFn: () => getPrecisionFinishingCuttingQuantityStats({ ids, filters }),
    enabled,
    ...queryConfig.list,
  })
}

export function useCreatePrecisionFinishingCutting() {
  return useMutationWithInvalidation({
    mutationFn: createPrecisionFinishingCutting,
    invalidateQueries: [[PRECISION_FINISHING_CUTTINGS_KEY]],
  })
}

export function useUpdatePrecisionFinishingCutting() {
  return useMutationWithInvalidation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string
      values: Parameters<typeof updatePrecisionFinishingCutting>[0]['values']
    }) => updatePrecisionFinishingCutting({ id, values }),
    invalidateQueries: [[PRECISION_FINISHING_CUTTINGS_KEY]],
  })
}

export function useDeletePrecisionFinishingCuttings() {
  return useMutationWithInvalidation({
    mutationFn: deletePrecisionFinishingCuttings,
    invalidateQueries: [[PRECISION_FINISHING_CUTTINGS_KEY]],
  })
}

export function useBatchUpdatePrecisionFinishingCuttings() {
  return useMutationWithInvalidation({
    mutationFn: batchUpdatePrecisionFinishingCuttings,
    invalidateQueries: [[PRECISION_FINISHING_CUTTINGS_KEY]],
  })
}