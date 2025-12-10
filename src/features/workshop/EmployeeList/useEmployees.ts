import { useQuery, keepPreviousData } from '@tanstack/react-query'

import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployees,
} from '@/services/apiEmployees'
import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'

const EMPLOYEES_KEY = 'employees' as const

export function useEmployeesList({
  page,
  pageSize,
  searchParams,
}: {
  page: number
  pageSize: number
  searchParams: { name?: string }
}) {
  return useQuery({
    queryKey: [EMPLOYEES_KEY, page, pageSize, searchParams],
    queryFn: () => getEmployees({ page, pageSize, ...searchParams }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useCreateEmployee() {
  return useMutationWithInvalidation({
    mutationFn: createEmployee,
    invalidateQueries: [[EMPLOYEES_KEY]],
  })
}

export function useUpdateEmployee() {
  return useMutationWithInvalidation({
    mutationFn: updateEmployee,
    invalidateQueries: [[EMPLOYEES_KEY]],
  })
}

export function useDeleteEmployees() {
  return useMutationWithInvalidation({
    mutationFn: deleteEmployees,
    invalidateQueries: [[EMPLOYEES_KEY]],
  })
}
