import { useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { getMachineEquipmentOptions } from '@/services/apiMachineEquipmentMaintenances'

export function useMachineEquipmentOptions() {
  return useQuery({
    queryKey: ['machine-equipment-options'],
    queryFn: getMachineEquipmentOptions,
    ...queryConfig.detail,
  })
}
