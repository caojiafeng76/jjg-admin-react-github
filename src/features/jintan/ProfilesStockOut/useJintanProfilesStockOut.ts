import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@hooks/useMutationWithInvalidation'
import {
  createJintanProfilesStockOut,
  deleteJintanProfilesStockOut,
  getJintanProfilesStockOutList,
  updateJintanProfilesStockOutRemarks,
} from '@/services/apiJintanProfilesStockOut'
import { jintanKeys } from '../queryKeys'

export function useJintanProfilesStockOutList({
  page,
  pageSize,
  keyword,
}: {
  page: number
  pageSize: number
  keyword?: string
}) {
  return useQuery({
    queryKey: jintanKeys.profilesStockOut.list({ page, pageSize, keyword }),
    queryFn: () => getJintanProfilesStockOutList({ page, pageSize, keyword }),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}

export function useCreateJintanProfilesStockOut() {
  return useMutationWithInvalidation({
    mutationFn: createJintanProfilesStockOut,
    invalidateQueries: [
      jintanKeys.profilesStockOut.all,
      jintanKeys.profilesInventory.all,
    ],
  })
}

export function useDeleteJintanProfilesStockOut() {
  return useMutationWithInvalidation({
    mutationFn: deleteJintanProfilesStockOut,
    invalidateQueries: [
      jintanKeys.profilesStockOut.all,
      jintanKeys.profilesInventory.all,
    ],
  })
}

export function useUpdateJintanProfilesStockOutRemarks() {
  return useMutationWithInvalidation({
    mutationFn: updateJintanProfilesStockOutRemarks,
    invalidateQueries: [jintanKeys.profilesStockOut.all],
  })
}
