import { describe, expect, it } from 'vitest'

import { buildExtrusionMachineOptions } from './extrusionMachineOptions'

describe('buildExtrusionMachineOptions', () => {
  it('uses the machine unified_device_no as the option value and appends the recommended diameter', () => {
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
        label: '1000T（推荐直径：120mm）',
        value: 'JY-1000T',
        recommendedDiametersMm: [120],
      },
    ])
  })

  it('annotates 680T / 1400T with the corresponding recommended diameters', () => {
    expect(
      buildExtrusionMachineOptions([
        {
          id: '1',
          unified_device_no: 'JY-680T',
          operation: '挤压',
          machine_name: '680T',
        },
        {
          id: '2',
          unified_device_no: 'JY-1400T',
          operation: '挤压',
          machine_name: '1400T',
        },
      ]),
    ).toEqual([
      {
        label: '680T（推荐直径：90mm）',
        value: 'JY-680T',
        recommendedDiametersMm: [90],
      },
      {
        label: '1400T（推荐直径：150mm/180mm）',
        value: 'JY-1400T',
        recommendedDiametersMm: [150, 180],
      },
    ])
  })

  it('falls back to the raw name when tonnage is not recognised', () => {
    expect(
      buildExtrusionMachineOptions([
        {
          id: '3',
          unified_device_no: 'JY-800T',
          operation: '挤压',
          machine_name: '800T',
        },
      ]),
    ).toEqual([
      {
        label: '800T',
        value: 'JY-800T',
        recommendedDiametersMm: [],
      },
    ])
  })

  it('returns an empty list when machines is undefined', () => {
    expect(buildExtrusionMachineOptions(undefined)).toEqual([])
  })
})
