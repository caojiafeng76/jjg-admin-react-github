import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import {
  getWorkshopProcesses,
  createWorkshopProcess,
  updateWorkshopProcess,
  deleteWorkshopProcesses,
} from '@/services/apiWorkshopProcesses'

const WORKSHOP_PROCESSES_KEY = 'workshop-processes' as const

export function useWorkshopProcessesList({
  page,
  pageSize,
  searchParams,
}: {
  page: number
  pageSize: number
  searchParams: { process_name?: string }
}) {
  return useQuery({
    queryKey: [WORKSHOP_PROCESSES_KEY, page, pageSize, searchParams],
    queryFn: () => getWorkshopProcesses({ page, pageSize, ...searchParams }),
    placeholderData: (previousData) => previousData,
  })
}

export function useCreateWorkshopProcess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWorkshopProcess,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [WORKSHOP_PROCESSES_KEY] })
      return args
    },
  })
}

export function useUpdateWorkshopProcess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateWorkshopProcess,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [WORKSHOP_PROCESSES_KEY] })
      return args
    },
  })
}

export function useDeleteWorkshopProcesses() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteWorkshopProcesses,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: [WORKSHOP_PROCESSES_KEY] })
      return args
    },
  })
}
