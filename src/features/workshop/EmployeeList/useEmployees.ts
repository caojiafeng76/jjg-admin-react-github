import { useQuery, keepPreviousData } from '@tanstack/react-query'

import type { AppRole } from '@/config/access'
import {
  getEmployees,
  getAllEmployees,
  getEmployeeAuthEmail,
  createEmployee,
  updateEmployee,
  deleteEmployees,
  createEmployeeAuthAccount,
  resetEmployeeAuthPassword,
  unbindEmployeeAuthAccount,
  rebindEmployeeAuthAccount,
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
  searchParams: {
    name?: string
    role?: AppRole
    is_active?: boolean
  }
}) {
  return useQuery({
    queryKey: [EMPLOYEES_KEY, page, pageSize, searchParams],
    queryFn: () => getEmployees({ page, pageSize, ...searchParams }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useAllEmployees(enabled = true) {
  return useQuery({
    queryKey: [EMPLOYEES_KEY, 'all'],
    queryFn: getAllEmployees,
    enabled,
    ...queryConfig.list,
  })
}

export function useEmployeeAuthEmail(
  employeeId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [EMPLOYEES_KEY, 'auth-email', employeeId],
    queryFn: () => getEmployeeAuthEmail(employeeId as string),
    enabled: enabled && !!employeeId,
    retry: false,
    throwOnError: false,
    ...queryConfig.detail,
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

export function useCreateEmployeeAuthAccount() {
  return useMutationWithInvalidation({
    mutationFn: createEmployeeAuthAccount,
    invalidateQueries: [[EMPLOYEES_KEY]],
  })
}

export function useResetEmployeeAuthPassword() {
  return useMutationWithInvalidation({
    mutationFn: resetEmployeeAuthPassword,
    invalidateQueries: [[EMPLOYEES_KEY]],
  })
}

export function useUnbindEmployeeAuthAccount() {
  return useMutationWithInvalidation({
    mutationFn: unbindEmployeeAuthAccount,
    invalidateQueries: [[EMPLOYEES_KEY]],
  })
}

export function useRebindEmployeeAuthAccount() {
  return useMutationWithInvalidation({
    mutationFn: rebindEmployeeAuthAccount,
    invalidateQueries: [[EMPLOYEES_KEY]],
  })
}
