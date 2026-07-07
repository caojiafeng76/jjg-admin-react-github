import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  createPackagingWorkOrder,
  deletePackagingWorkOrder,
  getPackagingWorkOrderList,
  updatePackagingWorkOrder,
  type PackagingWorkOrderSearchParams,
} from '@/services/apiPackagingWorkOrders'
import { getSalesOrdersProjectNos } from '@/services/apiProcessStandards'
import { getPackagingEmployeeList } from '@/services/apiPackagingEmployees'

const PACKAGING_WORK_ORDERS_KEY = 'packaging-work-orders-v3' as const
const SALES_ORDERS_PROJECT_NOS_KEY = 'sales-orders-project-nos' as const
const PACKAGING_EMPLOYEES_OPTIONS_KEY = 'packaging-employees-options' as const

export function usePackagingWorkOrderList({
  page,
  pageSize,
  searchParams,
}: {
  page: number
  pageSize: number
  searchParams: PackagingWorkOrderSearchParams
}) {
  return useQuery({
    queryKey: [PACKAGING_WORK_ORDERS_KEY, page, pageSize, searchParams],
    queryFn: () =>
      getPackagingWorkOrderList({
        page,
        pageSize,
        searchParams,
      }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useCreatePackagingWorkOrder() {
  return useMutationWithInvalidation({
    mutationFn: createPackagingWorkOrder,
    invalidateQueries: [[PACKAGING_WORK_ORDERS_KEY]],
  })
}

export function useUpdatePackagingWorkOrder() {
  return useMutationWithInvalidation({
    mutationFn: updatePackagingWorkOrder,
    invalidateQueries: [[PACKAGING_WORK_ORDERS_KEY]],
  })
}

export function useDeletePackagingWorkOrder() {
  return useMutationWithInvalidation({
    mutationFn: deletePackagingWorkOrder,
    invalidateQueries: [[PACKAGING_WORK_ORDERS_KEY]],
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

export function usePackagingEmployeeOptions() {
  return useQuery({
    queryKey: [PACKAGING_EMPLOYEES_OPTIONS_KEY],
    queryFn: () =>
      getPackagingEmployeeList({ page: 1, pageSize: 1000, keyword: undefined }),
    ...queryConfig.list,
  })
}
