import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  createPackagingEmployee,
  deletePackagingEmployee,
  getPackagingEmployeeList,
  updatePackagingEmployee,
} from '@/services/apiPackagingEmployees'
import { packagingProcessKeys } from '../queryKeys'

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
    queryKey: packagingProcessKeys.employees.list({
      page,
      pageSize,
      keyword: searchParams.keyword,
    }),
    queryFn: ({ signal }) =>
      getPackagingEmployeeList({
        page,
        pageSize,
        keyword: searchParams.keyword,
        signal,
      }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useCreatePackagingEmployee() {
  return useMutationWithInvalidation({
    mutationFn: createPackagingEmployee,
    invalidateQueries: [packagingProcessKeys.employees.all],
  })
}

export function useUpdatePackagingEmployee() {
  return useMutationWithInvalidation({
    mutationFn: updatePackagingEmployee,
    invalidateQueries: [packagingProcessKeys.employees.all],
  })
}

export function useDeletePackagingEmployee() {
  return useMutationWithInvalidation({
    mutationFn: deletePackagingEmployee,
    invalidateQueries: [packagingProcessKeys.employees.all],
  })
}
