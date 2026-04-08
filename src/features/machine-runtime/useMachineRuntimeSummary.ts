import { useQuery, keepPreviousData } from '@tanstack/react-query'

import {
  getMachineRuntimeSummary,
  type MachineRuntimeFilters,
} from '@/services/apiMachineRuntime'
import { queryConfig } from '@/config/queryClient'

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
