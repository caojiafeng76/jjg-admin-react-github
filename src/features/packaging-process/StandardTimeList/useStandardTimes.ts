import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  createPackagingStandardTime,
  deletePackagingStandardTime,
  getPackagingStandardTimeList,
  updatePackagingStandardTime,
} from '@/services/apiPackagingStandardTimes'
import { getSalesOrdersProjectNos } from '@/services/apiProcessStandards'

const PACKAGING_STANDARD_TIMES_KEY = 'packaging-standard-times' as const
const SALES_ORDERS_PROJECT_NOS_KEY = 'sales-orders-project-nos' as const

export function usePackagingStandardTimeList({
  page,
  pageSize,
  searchParams,
}: {
  page: number
  pageSize: number
  searchParams: {
    keyword?: string
  }
}) {
  return useQuery({
    queryKey: [PACKAGING_STANDARD_TIMES_KEY, page, pageSize, searchParams],
    queryFn: () =>
      getPackagingStandardTimeList({
        page,
        pageSize,
        keyword: searchParams.keyword,
      }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useCreatePackagingStandardTime() {
  return useMutationWithInvalidation({
    mutationFn: createPackagingStandardTime,
    invalidateQueries: [[PACKAGING_STANDARD_TIMES_KEY]],
  })
}

export function useUpdatePackagingStandardTime() {
  return useMutationWithInvalidation({
    mutationFn: updatePackagingStandardTime,
    invalidateQueries: [[PACKAGING_STANDARD_TIMES_KEY]],
  })
}

export function useDeletePackagingStandardTime() {
  return useMutationWithInvalidation({
    mutationFn: deletePackagingStandardTime,
    invalidateQueries: [[PACKAGING_STANDARD_TIMES_KEY]],
  })
}

export function usePackagingSalesOrdersProjectNos() {
  return useQuery({
    queryKey: [SALES_ORDERS_PROJECT_NOS_KEY],
    queryFn: getSalesOrdersProjectNos,
    ...queryConfig.realtime,
    refetchOnMount: 'always',
  })
}
