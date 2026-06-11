import { describe, expect, it } from 'vitest'

import { buildExtrusionMachineOptions } from './extrusionMachineOptions'

describe('buildExtrusionMachineOptions', () => {
  it('uses the machine unified_device_no as the option value', () => {
    expect(
      buildExtrusionMachineOptions([
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          unified_device_no: 'JY-1000T',
          operation: '挤压',
          machine_name: '1000T',
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440000',
          unified_device_no: 'CNC-C01',
          operation: 'CNC',
          machine_name: '2.5米',
        },
      ]),
    ).toEqual([
      {
        label: '1000T',
        value: 'JY-1000T',
      },
    ])
  })
})
