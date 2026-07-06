import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  createPackagingEmployee,
  deletePackagingEmployee,
  getPackagingEmployeeList,
  updatePackagingEmployee,
} from '@/services/apiPackagingEmployees'

const PACKAGING_EMPLOYEES_KEY = 'packaging-employees' as const

export function usePackagingEmployeeList({
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
    queryKey: [PACKAGING_EMPLOYEES_KEY, page, pageSize, searchParams],
    queryFn: () =>
      getPackagingEmployeeList({
        page,
        pageSize,
        keyword: searchParams.keyword,
      }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useCreatePackagingEmployee() {
  return useMutationWithInvalidation({
    mutationFn: createPackagingEmployee,
    invalidateQueries: [[PACKAGING_EMPLOYEES_KEY]],
  })
}

export function useUpdatePackagingEmployee() {
  return useMutationWithInvalidation({
    mutationFn: updatePackagingEmployee,
    invalidateQueries: [[PACKAGING_EMPLOYEES_KEY]],
  })
}

export function useDeletePackagingEmployee() {
  return useMutationWithInvalidation({
    mutationFn: deletePackagingEmployee,
    invalidateQueries: [[PACKAGING_EMPLOYEES_KEY]],
  })
}
