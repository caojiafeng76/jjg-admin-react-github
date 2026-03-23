import { useQuery, keepPreviousData } from '@tanstack/react-query'

import {
  getMaterialTransfers,
  getMaterialTransferById,
  createMaterialTransfer,
  updateMaterialTransfer,
  deleteMaterialTransfers,
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
  filters: {
    projectNo?: string
    employeeId?: string
    targetWorkshop?: string
    recipientName?: string
  }
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
