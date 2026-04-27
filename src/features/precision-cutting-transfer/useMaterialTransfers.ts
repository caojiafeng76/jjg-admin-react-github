import { useQuery, keepPreviousData } from '@tanstack/react-query'

import {
  batchUpdatePrecisionCuttingTransfers,
  createPrecisionCuttingTransfer,
  deletePrecisionCuttingTransfers,
  getPrecisionCuttingTransferById,
  getPrecisionCuttingTransferQuantityStats,
  getPrecisionCuttingTransfers,
  updatePrecisionCuttingTransfer,
  type PrecisionCuttingTransferFilters,
} from '@/services/apiPrecisionCuttingTransfers'
import { queryConfig } from '@/config/queryClient'
import { ORDER_STATUS_DASHBOARD_KEY } from '@/features/workshop/OrderStatusDashboard/useOrderStatusDashboard'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'

const PRECISION_CUTTING_TRANSFERS_KEY = 'precision-cutting-transfers' as const
const PRECISION_CUTTING_TRANSFER_INVALIDATE_KEYS = [
  [PRECISION_CUTTING_TRANSFERS_KEY],
  [ORDER_STATUS_DASHBOARD_KEY],
]

export function usePrecisionCuttingTransfers({
  page,
  pageSize,
  filters,
}: {
  page: number
  pageSize: number
  filters: PrecisionCuttingTransferFilters
}) {
  return useQuery({
    queryKey: [PRECISION_CUTTING_TRANSFERS_KEY, page, pageSize, filters],
    queryFn: () => getPrecisionCuttingTransfers({ page, pageSize, ...filters }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function usePrecisionCuttingTransfer(id: string | undefined) {
  return useQuery({
    queryKey: [PRECISION_CUTTING_TRANSFERS_KEY, id],
    queryFn: () => getPrecisionCuttingTransferById(id!),
    enabled: !!id,
    ...queryConfig.detail,
  })
}

export function usePrecisionCuttingTransferQuantityStats({
  ids,
  filters,
  enabled = true,
}: {
  ids?: string[]
  filters?: PrecisionCuttingTransferFilters
  enabled?: boolean
}) {
  return useQuery({
    queryKey: [
      PRECISION_CUTTING_TRANSFERS_KEY,
      'quantity-stats',
      ids || null,
      filters || null,
    ],
    queryFn: () => getPrecisionCuttingTransferQuantityStats({ ids, filters }),
    enabled,
    ...queryConfig.list,
  })
}

export function useCreatePrecisionCuttingTransfer() {
  return useMutationWithInvalidation({
    mutationFn: createPrecisionCuttingTransfer,
    invalidateQueries: PRECISION_CUTTING_TRANSFER_INVALIDATE_KEYS,
  })
}

export function useUpdatePrecisionCuttingTransfer() {
  return useMutationWithInvalidation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string
      values: Parameters<typeof updatePrecisionCuttingTransfer>[0]['values']
    }) => updatePrecisionCuttingTransfer({ id, values }),
    invalidateQueries: PRECISION_CUTTING_TRANSFER_INVALIDATE_KEYS,
  })
}

export function useDeletePrecisionCuttingTransfers() {
  return useMutationWithInvalidation({
    mutationFn: deletePrecisionCuttingTransfers,
    invalidateQueries: PRECISION_CUTTING_TRANSFER_INVALIDATE_KEYS,
  })
}

export function useBatchUpdatePrecisionCuttingTransfers() {
  return useMutationWithInvalidation({
    mutationFn: batchUpdatePrecisionCuttingTransfers,
    invalidateQueries: PRECISION_CUTTING_TRANSFER_INVALIDATE_KEYS,
  })
}
