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
// 与 workshop StandardTimeList 共享同一查询键（queryFn 同为 getSalesOrdersProjectNos），避免同接口重复请求
const SALES_ORDERS_PROJECT_NOS_KEY = ['process-standards', 'project-nos'] as const

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
    queryKey: SALES_ORDERS_PROJECT_NOS_KEY,
    queryFn: getSalesOrdersProjectNos,
    // 生产号选项低变更，长 TTL 缓存；仅在表单打开挂载时刷新（refetchOnMount: 'always'），常驻页面不轮询
    ...queryConfig.static,
    refetchOnMount: 'always',
  })
}
