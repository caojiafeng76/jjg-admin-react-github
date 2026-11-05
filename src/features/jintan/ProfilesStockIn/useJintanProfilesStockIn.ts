import type { JintanItemType } from '@/services/jintanItemType'

import { useMutationWithInvalidation } from '@hooks/useMutationWithInvalidation'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryConfig } from '@/config/queryClient'
import {
  createJintanProfilesStockIn,
  deleteJintanProfilesStockIn,
  getJintanProfilesStockInList,
  updateJintanProfilesStockInRemarks,
} from '@/services/apiJintanProfilesStockIn'
import { jintanKeys } from '../queryKeys'

export function useJintanProfilesStockInList({
  page,
  pageSize,
  keyword,
  itemType,
}: {
  page: number
  pageSize: number
  keyword?: string
  itemType?: JintanItemType
}) {
  return useQuery({
    queryKey: jintanKeys.profilesStockIn.list({
      page,
      pageSize,
      keyword,
      itemType,
    }),
    queryFn: () => getJintanProfilesStockInList({ page, pageSize, keyword, itemType }),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })
}

export function useCreateJintanProfilesStockIn() {
  return useMutationWithInvalidation({
    mutationFn: createJintanProfilesStockIn,
    invalidateQueries: [
      jintanKeys.profilesStockIn.all,
      jintanKeys.profilesInventory.all,
    ],
  })
}

export function useDeleteJintanProfilesStockIn() {
  return useMutationWithInvalidation({
    mutationFn: deleteJintanProfilesStockIn,
    invalidateQueries: [
      jintanKeys.profilesStockIn.all,
      jintanKeys.profilesInventory.all,
    ],
  })
}

export function useUpdateJintanProfilesStockInRemarks() {
  return useMutationWithInvalidation({
    mutationFn: updateJintanProfilesStockInRemarks,
    invalidateQueries: [jintanKeys.profilesStockIn.all],
  })
}
