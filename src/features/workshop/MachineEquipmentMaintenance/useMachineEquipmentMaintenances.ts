import { useQuery, keepPreviousData } from '@tanstack/react-query'

import {
  createMachineEquipmentMaintenance,
  deleteMachineEquipmentMaintenances,
  getMachineEquipmentMaintenances,
  updateMachineEquipmentMaintenance,
} from '@/services/apiMachineEquipmentMaintenances'
import { queryConfig } from '@/config/queryClient'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'

const MACHINE_EQUIPMENT_MAINTENANCES_KEY =
  'machine-equipment-maintenances' as const

export function useMachineEquipmentMaintenancesList({
  page,
  pageSize,
  searchParams,
}: {
  page: number
  pageSize: number
  searchParams: {
    unifiedDeviceNo?: string
    operation?: string
    machineName?: string
  }
}) {
  return useQuery({
    queryKey: [MACHINE_EQUIPMENT_MAINTENANCES_KEY, page, pageSize, searchParams],
    queryFn: () =>
      getMachineEquipmentMaintenances({ page, pageSize, ...searchParams }),
    placeholderData: keepPreviousData,
    ...queryConfig.list,
  })
}

export function useCreateMachineEquipmentMaintenance() {
  return useMutationWithInvalidation({
    mutationFn: createMachineEquipmentMaintenance,
    invalidateQueries: [[MACHINE_EQUIPMENT_MAINTENANCES_KEY]],
  })
}

export function useUpdateMachineEquipmentMaintenance() {
  return useMutationWithInvalidation({
    mutationFn: updateMachineEquipmentMaintenance,
    invalidateQueries: [[MACHINE_EQUIPMENT_MAINTENANCES_KEY]],
  })
}

export function useDeleteMachineEquipmentMaintenances() {
  return useMutationWithInvalidation({
    mutationFn: deleteMachineEquipmentMaintenances,
    invalidateQueries: [[MACHINE_EQUIPMENT_MAINTENANCES_KEY]],
  })
}