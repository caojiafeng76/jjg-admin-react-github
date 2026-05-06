import { describe, expect, test } from 'bun:test'

import { isProductionSchedulingMaterialCode } from '../src/services/productionSchedulingMaterialFilter'

describe('isProductionSchedulingMaterialCode', () => {
  test('accepts material codes that start with 02.', () => {
    expect(isProductionSchedulingMaterialCode('02.ABC')).toBe(true)
    expect(isProductionSchedulingMaterialCode(' 02.123 ')).toBe(true)
  })

  test('rejects material codes outside the 02. scheduling prefix', () => {
    expect(isProductionSchedulingMaterialCode('01.ABC')).toBe(false)
    expect(isProductionSchedulingMaterialCode('1202.ABC')).toBe(false)
    expect(isProductionSchedulingMaterialCode('02ABC')).toBe(false)
    expect(isProductionSchedulingMaterialCode(null)).toBe(false)
  })
})
