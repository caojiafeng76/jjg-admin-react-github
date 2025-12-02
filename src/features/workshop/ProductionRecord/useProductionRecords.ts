import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import {
  getProductionRecords,
  createProductionRecord,
  updateProductionRecord,
  deleteProductionRecords,
} from '@/services/apiProductionRecords'

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
    placeholderData: (previousData) => previousData,
  })
}

export function useCreateProductionRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProductionRecord,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTION_RECORDS_KEY] })
      return args
    },
  })
}

export function useUpdateProductionRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProductionRecord,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTION_RECORDS_KEY] })
      return args
    },
  })
}

export function useDeleteProductionRecords() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteProductionRecords,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTION_RECORDS_KEY] })
      return args
    },
  })
}
