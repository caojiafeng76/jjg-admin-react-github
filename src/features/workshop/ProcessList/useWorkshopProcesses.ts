import { useQuery, keepPreviousData } from '@tanstack/react-query'

import {
  getWorkshopProcesses,
  createWorkshopProcess,
  updateWorkshopProcess,
  deleteWorkshopProcesses,
} from '@/services/apiWorkshopProcesses'
import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'

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
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useCreateWorkshopProcess() {
  return useMutationWithInvalidation({
    mutationFn: createWorkshopProcess,
    invalidateQueries: [[WORKSHOP_PROCESSES_KEY]],
  })
}

export function useUpdateWorkshopProcess() {
  return useMutationWithInvalidation({
    mutationFn: updateWorkshopProcess,
    invalidateQueries: [[WORKSHOP_PROCESSES_KEY]],
  })
}

export function useDeleteWorkshopProcesses() {
  return useMutationWithInvalidation({
    mutationFn: deleteWorkshopProcesses,
    invalidateQueries: [[WORKSHOP_PROCESSES_KEY]],
  })
}
