export type ExtrusionTonnage = 680 | 1000 | 1400

export interface BilletDiameterPreset {
  defaultDiameterMm: number
  quickPickDiametersMm: number[]
}

const BILLET_DIAMETER_PRESETS: Record<ExtrusionTonnage, BilletDiameterPreset> = {
  680: { defaultDiameterMm: 90, quickPickDiametersMm: [90] },
  1000: { defaultDiameterMm: 120, quickPickDiametersMm: [120] },
  1400: { defaultDiameterMm: 150, quickPickDiametersMm: [150, 180] },
}

const TONNAGE_PATTERN = /(\d{3,4})\s*[Tt]/

export function extractExtrusionTonnage(
  machineName: string | null | undefined,
): ExtrusionTonnage | null {
  if (!machineName) {
    return null
  }
  const match = machineName.match(TONNAGE_PATTERN)
  if (!match) {
    return null
  }
  const numeric = Number(match[1])
  if (numeric === 680 || numeric === 1000 || numeric === 1400) {
    return numeric
  }
  return null
}

export function getBilletDiameterPreset(
  tonnage: ExtrusionTonnage | null,
): BilletDiameterPreset | null {
  if (!tonnage) {
    return null
  }
  return BILLET_DIAMETER_PRESETS[tonnage]
}

export function getBilletDiameterDefaultsByTonnage(): Record<
  ExtrusionTonnage,
  BilletDiameterPreset
> {
  return BILLET_DIAMETER_PRESETS
}
