import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployees,
} from '@/services/apiEmployees'

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
    placeholderData: (previousData) => previousData,
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createEmployee,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [EMPLOYEES_KEY] })
      return args
    },
  })
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateEmployee,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [EMPLOYEES_KEY] })
      return args
    },
  })
}

export function useDeleteEmployees() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteEmployees,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [EMPLOYEES_KEY] })
      return args
    },
  })
}
