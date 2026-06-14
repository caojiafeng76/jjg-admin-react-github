import type { MachineEquipmentOption } from '@/services/apiMachineEquipmentMaintenances'

import {
  extractExtrusionTonnage,
  getBilletDiameterPreset,
} from './extrusionMachineTonnage'

const EXTRUSION_OPERATION = '挤压'

export interface ExtrusionMachineSelectOption {
  label: string
  value: string
  recommendedDiametersMm: number[]
}

export function buildExtrusionMachineOptions(
  machines: MachineEquipmentOption[] | undefined,
): ExtrusionMachineSelectOption[] {
  return (machines || [])
    .filter((machine) => machine.operation.trim() === EXTRUSION_OPERATION)
    .map((machine) => {
      const machineName = machine.machine_name.trim()
      const tonnage = extractExtrusionTonnage(machineName)
      const preset = getBilletDiameterPreset(tonnage)
      const recommendedDiametersMm = preset?.quickPickDiametersMm ?? []

      return {
        label: buildMachineOptionLabel(machineName, recommendedDiametersMm),
        value: machine.unified_device_no.trim(),
        recommendedDiametersMm,
      }
    })
}

function buildMachineOptionLabel(
  machineName: string,
  recommendedDiametersMm: number[],
): string {
  if (recommendedDiametersMm.length === 0) {
    return machineName
  }
  return `${machineName}（推荐直径：${formatDiameters(
    recommendedDiametersMm,
  )}）`
}

function formatDiameters(diameters: number[]): string {
  return diameters.map((d) => `${d}mm`).join('/')
}
