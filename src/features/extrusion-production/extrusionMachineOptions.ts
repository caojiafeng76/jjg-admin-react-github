import type { MachineEquipmentOption } from '@/services/apiMachineEquipmentMaintenances'

const EXTRUSION_OPERATION = '挤压'

interface ExtrusionMachineSelectOption {
  label: string
  value: string
}

export function buildExtrusionMachineOptions(
  machines: MachineEquipmentOption[] | undefined,
): ExtrusionMachineSelectOption[] {
  return (machines || [])
    .filter((machine) => machine.operation.trim() === EXTRUSION_OPERATION)
    .map((machine) => ({
      label: machine.machine_name.trim(),
      value: machine.unified_device_no.trim(),
    }))
}
