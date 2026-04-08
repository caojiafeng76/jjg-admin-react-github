import { useQuery, keepPreviousData } from '@tanstack/react-query'

import {
  getMachineRuntimeItems,
  type MachineRuntimeFilters,
} from '@/services/apiMachineRuntime'
import { queryConfig } from '@/config/queryClient'

export function useMachineRuntimeDetail(filters: MachineRuntimeFilters) {
  return useQuery({
    queryKey: ['machine-runtime-detail', filters],
    queryFn: () => getMachineRuntimeItems(filters),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}
