import type { JintanItemType } from '@/services/jintanItemType'
import type { JintanSearchFilters } from '@/services/jintanSearchFields'

import { useMutationWithInvalidation } from '@hooks/useMutationWithInvalidation'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryConfig } from '@/config/queryClient'
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
  filters,
  itemType,
}: {
  page: number
  pageSize: number
  filters?: JintanSearchFilters
  itemType?: JintanItemType
}) {
  return useQuery({
    queryKey: jintanKeys.profilesStockOut.list({
      page,
      pageSize,
      filters,
      itemType,
    }),
    queryFn: () => getJintanProfilesStockOutList({ page, pageSize, filters, itemType }),
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
