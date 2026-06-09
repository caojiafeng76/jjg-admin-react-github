import { describe, expect, it } from 'vitest'

import {
  calculateActualOutputWeight,
  calculateMaterialYield,
  calculateTheoreticalOutputCount,
  calculateTheoreticalOutputWeight,
} from './extrusionCalculations'

describe('extrusion calculations', () => {
  it('floors theoretical output count only at the final step', () => {
    expect(
      calculateTheoreticalOutputCount({
        actualLengthMm: 5275,
        orderLengthMm: 200,
        actualQuantity: 158,
      }),
    ).toBe(4167)
  })

  it('converts millimeters to meters when calculating theoretical output weight', () => {
    expect(
      calculateTheoreticalOutputWeight({
        theoreticalOutputCount: 151,
        orderLengthMm: 200,
        theoreticalUnitWeightKgPerMeter: 5.23,
      }),
    ).toBeCloseTo(157.95, 2)
  })

  it('calculates actual output weight from actual unit weight and quantity', () => {
    expect(
      calculateActualOutputWeight({
        actualUnitWeightKg: 5.23,
        actualQuantity: 158,
      }),
    ).toBeCloseTo(826.34, 2)
  })

  it('calculates material yield as a percentage', () => {
    expect(
      calculateMaterialYield({
        actualOutputWeightKg: 826.34,
        inputWeightKg: 970.56,
      }),
    ).toBeCloseTo(85.14, 2)
  })

  it('returns 0 for zero quantity or invalid lengths in theoretical output count', () => {
    expect(
      calculateTheoreticalOutputCount({
        actualLengthMm: 5275,
        orderLengthMm: 200,
        actualQuantity: 0,
      }),
    ).toBe(0)

    expect(
      calculateTheoreticalOutputCount({
        actualLengthMm: null,
        orderLengthMm: 200,
        actualQuantity: 158,
      }),
    ).toBe(0)

    expect(
      calculateTheoreticalOutputCount({
        actualLengthMm: 5275,
        orderLengthMm: 0,
        actualQuantity: 158,
      }),
    ).toBe(0)
  })

  it('returns 0 for invalid denominators and empty inputs in derived weight and yield calculations', () => {
    expect(
      calculateTheoreticalOutputWeight({
        theoreticalOutputCount: 151,
        orderLengthMm: undefined,
        theoreticalUnitWeightKgPerMeter: 5.23,
      }),
    ).toBe(0)

    expect(
      calculateActualOutputWeight({
        actualUnitWeightKg: Number.NaN,
        actualQuantity: 158,
      }),
    ).toBe(0)

    expect(
      calculateMaterialYield({
        actualOutputWeightKg: 826.34,
        inputWeightKg: 0,
      }),
    ).toBe(0)
  })
})
