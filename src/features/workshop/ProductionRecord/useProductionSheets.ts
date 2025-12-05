import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProductionSheets,
  getProductionSheetById,
  createProductionSheet,
  updateProductionSheet,
  deleteProductionSheets,
} from '@/services/apiProductionSheets'

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
    placeholderData: (previousData) => previousData,
  })
}

export function useProductionSheetById(id: string | null) {
  return useQuery({
    queryKey: [PRODUCTION_SHEETS_KEY, id],
    queryFn: () => (id ? getProductionSheetById(id) : null),
    enabled: !!id,
  })
}

export function useCreateProductionSheet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createProductionSheet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTION_SHEETS_KEY] })
    },
  })
}

export function useUpdateProductionSheet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateProductionSheet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTION_SHEETS_KEY] })
    },
  })
}

export function useDeleteProductionSheets() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteProductionSheets,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTION_SHEETS_KEY] })
    },
  })
}

