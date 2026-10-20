import type { MachineRuntimeFilters } from '@/services/apiMachineRuntime'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryConfig } from '@/config/queryClient'
import {
  getMachineRuntimeItems,

} from '@/services/apiMachineRuntime'

export function useMachineRuntimeDetail(filters: MachineRuntimeFilters) {
  return useQuery({
    queryKey: ['machine-runtime-detail', filters],
    queryFn: () => getMachineRuntimeItems(filters),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}
