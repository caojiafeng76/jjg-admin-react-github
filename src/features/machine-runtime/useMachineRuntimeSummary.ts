import type { MachineRuntimeFilters } from '@/services/apiMachineRuntime'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryConfig } from '@/config/queryClient'
import {
  getMachineRuntimeSummary,

} from '@/services/apiMachineRuntime'

export function useMachineRuntimeSummary(
  filters: Omit<MachineRuntimeFilters, 'page' | 'pageSize' | 'machineEquipmentId'>,
) {
  return useQuery({
    queryKey: ['machine-runtime-summary', filters],
    queryFn: () => getMachineRuntimeSummary(filters),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}
