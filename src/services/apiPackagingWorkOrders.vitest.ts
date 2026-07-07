import { describe, expect, it, vi } from 'vitest'

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
}))

vi.mock('./supabase', () => ({
  default: supabaseMock,
}))

import {
  buildPackagingWorkOrderCreatePayloads,
  buildPackagingWorkOrderPayload,
  getStandardSecondsByPartNo,
} from './apiPackagingWorkOrders'

function mockStandardTimeQuery(
  responses: Array<{ data: unknown; error: unknown }>,
) {
  let index = 0

  supabaseMock.from.mockImplementation(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => responses[index++]),
  }))
}

describe('buildPackagingWorkOrderPayload', () => {
  it('normalizes selectable unit and extra qualified hours', () => {
    expect(
      buildPackagingWorkOrderPayload({
        work_date: '2026-07-07',
        employee_id: 'employee-1',
        project_no: ' 26070601-01 ',
        product_model: '105-308',
        color_name: null,
        process_name: null,
        length_mm: null,
        part_no: null,
        weight_per_meter_kg: 1.2345,
        unit: '千克',
        quantity: 12,
        defective_quantity: 2,
        defect_reason: ' 划伤 ',
        standard_seconds: 30,
        extra_qualified_hours: 1.5,
        remark: null,
      }),
    ).toMatchObject({
      project_no: '26070601-01',
      unit: '千克',
      weight_per_meter_kg: 1.2345,
      defective_quantity: 2,
      defect_reason: '划伤',
      extra_qualified_hours: 1.5,
    })
  })

  it('defaults invalid unit and missing numeric fields to 0', () => {
    expect(
      buildPackagingWorkOrderPayload({
        work_date: '2026-07-07',
        employee_id: null,
        project_no: null,
        product_model: '105-308',
        color_name: null,
        process_name: null,
        length_mm: null,
        part_no: null,
        unit: '件',
        quantity: 0,
        standard_seconds: 0,
        remark: null,
      }),
    ).toMatchObject({
      unit: '支',
      weight_per_meter_kg: 0,
      defective_quantity: 0,
      defect_reason: null,
      extra_qualified_hours: 0,
    })
  })
})

describe('buildPackagingWorkOrderCreatePayloads', () => {
  it('splits quantity evenly across selected employees with one decimal place', () => {
    const payloads = buildPackagingWorkOrderCreatePayloads({
      work_date: '2026-07-07',
      employee_ids: ['employee-1', 'employee-2', 'employee-3'],
      project_no: '26070601-01',
      product_model: '105-308',
      color_name: null,
      process_name: null,
      length_mm: null,
      part_no: null,
      unit: '支',
      quantity: 100,
      defective_quantity: 9,
      standard_seconds: 30,
      remark: null,
    })

    expect(payloads).toHaveLength(3)
    expect(payloads.map((payload) => payload.employee_id)).toEqual([
      'employee-1',
      'employee-2',
      'employee-3',
    ])
    expect(payloads.map((payload) => payload.quantity)).toEqual([
      33.3, 33.3, 33.3,
    ])
    expect(payloads.map((payload) => payload.defective_quantity)).toEqual([
      3, 3, 3,
    ])
  })

  it('uses the single employee field as a fallback for edit-compatible values', () => {
    const payloads = buildPackagingWorkOrderCreatePayloads({
      work_date: '2026-07-07',
      employee_id: 'employee-1',
      project_no: null,
      product_model: '105-308',
      color_name: null,
      process_name: null,
      length_mm: null,
      part_no: null,
      unit: '支',
      quantity: 100,
      defective_quantity: 2,
      standard_seconds: 30,
      remark: null,
    })

    expect(payloads).toHaveLength(1)
    expect(payloads[0]).toMatchObject({
      employee_id: 'employee-1',
      quantity: 100,
      defective_quantity: 2,
    })
  })
})

describe('getStandardSecondsByPartNo', () => {
  it('falls back to matching product model when part number has no standard time', async () => {
    mockStandardTimeQuery([
      { data: null, error: null },
      { data: { standard_seconds: 45 }, error: null },
    ])

    await expect(getStandardSecondsByPartNo('PN-1', 'M-1')).resolves.toBe(45)
  })
})
