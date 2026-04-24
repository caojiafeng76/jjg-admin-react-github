import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import { getVillaLiftOrdersForSelect } from '@/services/apiVillaLiftCutting'
import {
  batchDeleteVillaLiftFinishingRecords,
  createVillaLiftFinishingBatch,
  deleteVillaLiftFinishingRecord,
  getProcessOperationsByModels,
  getVillaLiftFinishingRecords,
  updateVillaLiftFinishingRecord,
} from '@/services/apiVillaLiftFinishing'

export const FINISHING_RECORDS_KEY = 'villa-lift-finishing-records' as const
export const ORDERS_FOR_SELECT_KEY = 'villa-lift-orders-for-select' as const

export function useVillaLiftOrdersForSelect() {
  return useQuery({
    queryKey: [ORDERS_FOR_SELECT_KEY],
    queryFn: getVillaLiftOrdersForSelect,
    ...queryConfig.list,
  })
}

export function useFinishingRecords({
  page,
  pageSize,
  orderId,
}: {
  page: number
  pageSize: number
  orderId?: string
}) {
  return useQuery({
    queryKey: [FINISHING_RECORDS_KEY, page, pageSize, orderId],
    queryFn: () => getVillaLiftFinishingRecords({ page, pageSize, orderId }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useProcessOperationsByModels(models: string[]) {
  return useQuery({
    queryKey: ['process-operations-by-models', models],
    queryFn: () => getProcessOperationsByModels(models),
    enabled: models.length > 0,
    ...queryConfig.detail,
  })
}

export function useCreateFinishingBatch() {
  return useMutationWithInvalidation({
    mutationFn: createVillaLiftFinishingBatch,
    invalidateQueries: [[FINISHING_RECORDS_KEY]],
  })
}

export function useUpdateFinishingRecord() {
  return useMutationWithInvalidation({
    mutationFn: updateVillaLiftFinishingRecord,
    invalidateQueries: [[FINISHING_RECORDS_KEY]],
  })
}

export function useDeleteFinishingRecord() {
  return useMutationWithInvalidation({
    mutationFn: deleteVillaLiftFinishingRecord,
    invalidateQueries: [[FINISHING_RECORDS_KEY]],
  })
}

export function useBatchDeleteFinishingRecords() {
  return useMutationWithInvalidation({
    mutationFn: batchDeleteVillaLiftFinishingRecords,
    invalidateQueries: [[FINISHING_RECORDS_KEY]],
  })
}
