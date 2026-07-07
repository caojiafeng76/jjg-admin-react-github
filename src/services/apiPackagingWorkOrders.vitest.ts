import { describe, expect, it, vi } from 'vitest'

vi.mock('./supabase', () => ({
  default: {},
}))

import { buildPackagingWorkOrderPayload } from './apiPackagingWorkOrders'

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
        unit: '千克',
        quantity: 12,
        standard_seconds: 30,
        extra_qualified_hours: 1.5,
        remark: null,
      }),
    ).toMatchObject({
      project_no: '26070601-01',
      unit: '千克',
      extra_qualified_hours: 1.5,
    })
  })

  it('defaults invalid unit to 支 and missing extra qualified hours to 0', () => {
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
      extra_qualified_hours: 0,
    })
  })
})
