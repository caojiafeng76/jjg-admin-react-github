function toPositiveNumber(value: number | null | undefined): number | null {
  const normalized = Number(value)

  if (!Number.isFinite(normalized) || normalized <= 0) {
    return null
  }

  return normalized
}

export interface CalculateTheoreticalOutputCountParams {
  actualLengthMm: number | null | undefined
  orderLengthMm: number | null | undefined
  actualQuantity: number | null | undefined
}

export function calculateTheoreticalOutputCount({
  actualLengthMm,
  orderLengthMm,
  actualQuantity,
}: CalculateTheoreticalOutputCountParams): number {
  const normalizedActualLengthMm = toPositiveNumber(actualLengthMm)
  const normalizedOrderLengthMm = toPositiveNumber(orderLengthMm)
  const normalizedActualQuantity = toPositiveNumber(actualQuantity)

  if (
    normalizedActualLengthMm === null ||
    normalizedOrderLengthMm === null ||
    normalizedActualQuantity === null
  ) {
    return 0
  }

  return Math.floor(
    (normalizedActualLengthMm / normalizedOrderLengthMm) *
      normalizedActualQuantity,
  )
}

export interface CalculateTheoreticalOutputWeightParams {
  theoreticalOutputCount: number | null | undefined
  orderLengthMm: number | null | undefined
  theoreticalUnitWeightKgPerMeter: number | null | undefined
}

export function calculateTheoreticalOutputWeight({
  theoreticalOutputCount,
  orderLengthMm,
  theoreticalUnitWeightKgPerMeter,
}: CalculateTheoreticalOutputWeightParams): number {
  const normalizedTheoreticalOutputCount = toPositiveNumber(theoreticalOutputCount)
  const normalizedOrderLengthMm = toPositiveNumber(orderLengthMm)
  const normalizedTheoreticalUnitWeightKgPerMeter = toPositiveNumber(
    theoreticalUnitWeightKgPerMeter,
  )

  if (
    normalizedTheoreticalOutputCount === null ||
    normalizedOrderLengthMm === null ||
    normalizedTheoreticalUnitWeightKgPerMeter === null
  ) {
    return 0
  }

  return (
    normalizedTheoreticalOutputCount *
    (normalizedOrderLengthMm / 1000) *
    normalizedTheoreticalUnitWeightKgPerMeter
  )
}

export interface CalculateActualOutputWeightParams {
  actualUnitWeightKg: number | null | undefined
  actualQuantity: number | null | undefined
}

export function calculateActualOutputWeight({
  actualUnitWeightKg,
  actualQuantity,
}: CalculateActualOutputWeightParams): number {
  const normalizedActualUnitWeightKg = toPositiveNumber(actualUnitWeightKg)
  const normalizedActualQuantity = toPositiveNumber(actualQuantity)

  if (
    normalizedActualUnitWeightKg === null ||
    normalizedActualQuantity === null
  ) {
    return 0
  }

  return normalizedActualUnitWeightKg * normalizedActualQuantity
}

export interface CalculateMaterialYieldParams {
  actualOutputWeightKg: number | null | undefined
  inputWeightKg: number | null | undefined
}

export function calculateMaterialYield({
  actualOutputWeightKg,
  inputWeightKg,
}: CalculateMaterialYieldParams): number {
  const normalizedActualOutputWeightKg = toPositiveNumber(actualOutputWeightKg)
  const normalizedInputWeightKg = toPositiveNumber(inputWeightKg)

  if (
    normalizedActualOutputWeightKg === null ||
    normalizedInputWeightKg === null
  ) {
    return 0
  }

  return (normalizedActualOutputWeightKg / normalizedInputWeightKg) * 100
}

const ALUMINUM_DENSITY_G_PER_CM3 = 2.7

export interface CalculateBilletInputWeightParams {
  billetDiameterMm: number | null | undefined
  billetLengthMm: number | null | undefined
  billetQuantity: number | null | undefined
}

export function calculateBilletInputWeight({
  billetDiameterMm,
  billetLengthMm,
  billetQuantity,
}: CalculateBilletInputWeightParams): number {
  const normalizedDiameter = toPositiveNumber(billetDiameterMm)
  const normalizedLength = toPositiveNumber(billetLengthMm)
  const normalizedQuantity = toPositiveNumber(billetQuantity)

  if (
    normalizedDiameter === null ||
    normalizedLength === null ||
    normalizedQuantity === null
  ) {
    return 0
  }

  const radiusMm = normalizedDiameter / 2
  const crossSectionAreaMm2 = Math.PI * radiusMm * radiusMm
  const volumeMm3 = crossSectionAreaMm2 * normalizedLength
  const volumeCm3 = volumeMm3 / 1000
  return (volumeCm3 * ALUMINUM_DENSITY_G_PER_CM3 * normalizedQuantity) / 1000
}
