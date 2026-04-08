import { useQuery } from '@tanstack/react-query'

import { getMachineEquipmentOptions } from '@/services/apiMachineEquipmentMaintenances'
import { queryConfig } from '@/config/queryClient'

export function useMachineEquipmentOptions() {
  return useQuery({
    queryKey: ['machine-equipment-options'],
    queryFn: getMachineEquipmentOptions,
    ...queryConfig.detail,
  })
}
