import { useQuery, keepPreviousData } from '@tanstack/react-query'
import {
  getProductionSheets,
  getProductionSheetById,
  createProductionSheet,
  updateProductionSheet,
  deleteProductionSheets,
} from '@/services/apiProductionSheets'
import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'

const PRODUCTION_SHEETS_KEY = 'production-sheets' as const

export function useProductionSheetsList({
  page,
  pageSize,
  searchParams,
}: {
  page: number
  pageSize: number
  searchParams: {
    startDate?: string
    endDate?: string
  }
}) {
  return useQuery({
    queryKey: [PRODUCTION_SHEETS_KEY, page, pageSize, searchParams],
    queryFn: () => getProductionSheets({ page, pageSize, ...searchParams }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useProductionSheetById(id: string | null) {
  return useQuery({
    queryKey: [PRODUCTION_SHEETS_KEY, id],
    queryFn: () => (id ? getProductionSheetById(id) : null),
    enabled: !!id,
    ...queryConfig.detail,
  })
}

export function useCreateProductionSheet() {
  return useMutationWithInvalidation({
    mutationFn: createProductionSheet,
    invalidateQueries: [[PRODUCTION_SHEETS_KEY]],
  })
}

export function useUpdateProductionSheet() {
  return useMutationWithInvalidation({
    mutationFn: updateProductionSheet,
    invalidateQueries: [[PRODUCTION_SHEETS_KEY]],
  })
}

export function useDeleteProductionSheets() {
  return useMutationWithInvalidation({
    mutationFn: deleteProductionSheets,
    invalidateQueries: [[PRODUCTION_SHEETS_KEY]],
  })
}

