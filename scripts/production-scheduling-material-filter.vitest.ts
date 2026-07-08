import { describe, expect, test } from 'vitest'

import {
  PRODUCTION_SCHEDULING_MATERIAL_CODE_OR_FILTER,
  isProductionSchedulingMaterialCode,
} from '../src/services/productionSchedulingMaterialFilter'

describe('isProductionSchedulingMaterialCode', () => {
  test('accepts material codes that start with 01., 02., or 03.', () => {
    expect(isProductionSchedulingMaterialCode('01.ABC')).toBe(true)
    expect(isProductionSchedulingMaterialCode('02.ABC')).toBe(true)
    expect(isProductionSchedulingMaterialCode('03.105.338.样品')).toBe(true)
    expect(isProductionSchedulingMaterialCode(' 01.123 ')).toBe(true)
    expect(isProductionSchedulingMaterialCode(' 02.123 ')).toBe(true)
    expect(isProductionSchedulingMaterialCode(' 03.123 ')).toBe(true)
  })

  test('rejects material codes outside the scheduling prefixes', () => {
    expect(isProductionSchedulingMaterialCode('1202.ABC')).toBe(false)
    expect(isProductionSchedulingMaterialCode('01ABC')).toBe(false)
    expect(isProductionSchedulingMaterialCode('02ABC')).toBe(false)
    expect(isProductionSchedulingMaterialCode('03ABC')).toBe(false)
    expect(isProductionSchedulingMaterialCode(null)).toBe(false)
  })

  test('builds a Supabase OR filter for scheduling material prefixes', () => {
    expect(PRODUCTION_SCHEDULING_MATERIAL_CODE_OR_FILTER).toBe(
      'material_code.ilike.01.%,material_code.ilike.02.%,material_code.ilike.03.%',
    )
  })
})
