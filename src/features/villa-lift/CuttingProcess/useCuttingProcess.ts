import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  createVillaLiftCuttingBatch,
  deleteVillaLiftCuttingRecord,
  getVillaLiftCuttingRecords,
  getVillaLiftOrdersForSelect,
  updateVillaLiftCuttingRecord,
} from '@/services/apiVillaLiftCutting'

export const CUTTING_RECORDS_KEY = 'villa-lift-cutting-records' as const
export const ORDERS_FOR_SELECT_KEY = 'villa-lift-orders-for-select' as const

export function useVillaLiftOrdersForSelect() {
  return useQuery({
    queryKey: [ORDERS_FOR_SELECT_KEY],
    queryFn: getVillaLiftOrdersForSelect,
    ...queryConfig.list,
  })
}

export function useCuttingRecords({
  page,
  pageSize,
  orderId,
}: {
  page: number
  pageSize: number
  orderId?: string
}) {
  return useQuery({
    queryKey: [CUTTING_RECORDS_KEY, page, pageSize, orderId],
    queryFn: () => getVillaLiftCuttingRecords({ page, pageSize, orderId }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useCreateCuttingBatch() {
  return useMutationWithInvalidation({
    mutationFn: createVillaLiftCuttingBatch,
    invalidateQueries: [[CUTTING_RECORDS_KEY]],
  })
}

export function useUpdateCuttingRecord() {
  return useMutationWithInvalidation({
    mutationFn: updateVillaLiftCuttingRecord,
    invalidateQueries: [[CUTTING_RECORDS_KEY]],
  })
}

export function useDeleteCuttingRecord() {
  return useMutationWithInvalidation({
    mutationFn: deleteVillaLiftCuttingRecord,
    invalidateQueries: [[CUTTING_RECORDS_KEY]],
  })
}
