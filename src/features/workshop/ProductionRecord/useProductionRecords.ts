import { useQuery, keepPreviousData } from '@tanstack/react-query'

import {
  getProductionRecords,
  createProductionRecord,
  updateProductionRecord,
  deleteProductionRecords,
} from '@/services/apiProductionRecords'
import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'

const PRODUCTION_RECORDS_KEY = 'production-records' as const

export function useProductionRecordsList({
  page,
  pageSize,
  searchParams,
}: {
  page: number
  pageSize: number
  searchParams: {
    project_no?: string
    product_model?: string
    customer_model?: string
    startDate?: string
    endDate?: string
  }
}) {
  return useQuery({
    queryKey: [PRODUCTION_RECORDS_KEY, page, pageSize, searchParams],
    queryFn: () => getProductionRecords({ page, pageSize, ...searchParams }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useCreateProductionRecord() {
  return useMutationWithInvalidation({
    mutationFn: createProductionRecord,
    invalidateQueries: [[PRODUCTION_RECORDS_KEY]],
  })
}

export function useUpdateProductionRecord() {
  return useMutationWithInvalidation({
    mutationFn: updateProductionRecord,
    invalidateQueries: [[PRODUCTION_RECORDS_KEY]],
  })
}

export function useDeleteProductionRecords() {
  return useMutationWithInvalidation({
    mutationFn: deleteProductionRecords,
    invalidateQueries: [[PRODUCTION_RECORDS_KEY]],
  })
}
