import { describe, expect, it, vi } from 'vitest'

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
}))

vi.mock('./supabase', () => ({
  default: supabaseMock,
}))

import {
  buildPackagingWorkOrderCreatePayloads,
  buildPackagingWorkOrderPayload,
  createPackagingWorkOrder,
  getPackagingWorkOrderList,
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
  it('attaches one persisted input batch id to every split employee detail', () => {
    const payloads = buildPackagingWorkOrderCreatePayloads(
      {
        work_date: '2026-07-07',
        employee_ids: ['employee-1', 'employee-2'],
        project_no: '26070601-01',
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
      },
      '11111111-1111-4111-8111-111111111111',
    )

    expect(payloads.map((payload) => payload.input_batch_id)).toEqual([
      '11111111-1111-4111-8111-111111111111',
      '11111111-1111-4111-8111-111111111111',
    ])
  })

  it('splits quantity evenly with simple rounding and keeps entered totals', () => {
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
    expect(payloads.map((payload) => payload.total_quantity)).toEqual([
      100, 100, 100,
    ])
    expect(payloads.map((payload) => payload.total_defective_quantity)).toEqual(
      [9, 9, 9],
    )
  })

  it('keeps the entered total intact for display (3447 across 4 employees)', () => {
    const payloads = buildPackagingWorkOrderCreatePayloads({
      work_date: '2026-07-12',
      employee_ids: ['employee-1', 'employee-2', 'employee-3', 'employee-4'],
      project_no: null,
      product_model: '电梯料',
      color_name: '喷涂',
      process_name: null,
      length_mm: null,
      part_no: null,
      unit: '千克',
      quantity: 3447,
      defective_quantity: 0,
      standard_seconds: 0,
      remark: null,
    })

    expect(payloads.map((payload) => payload.quantity)).toEqual([
      861.8, 861.8, 861.8, 861.8,
    ])
    expect(payloads.map((payload) => payload.total_quantity)).toEqual([
      3447, 3447, 3447, 3447,
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
      total_quantity: 100,
      total_defective_quantity: 2,
    })
  })
})

describe('batch data access', () => {
  const values = {
    work_date: '2026-07-07',
    employee_ids: ['employee-1', 'employee-2'],
    project_no: '26070601-01',
    product_model: '105-308',
    color_name: null,
    process_name: null,
    length_mm: null,
    part_no: null,
    weight_per_meter_kg: 1.2345,
    unit: '支',
    quantity: 100,
    defective_quantity: 2,
    standard_seconds: 30,
    extra_qualified_hours: 0,
    remark: null,
  }

  it('saves a new work order through the atomic batch RPC', async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: '11111111-1111-4111-8111-111111111111',
      error: null,
    })

    await createPackagingWorkOrder(values)

    expect(supabaseMock.rpc).toHaveBeenCalledWith(
      'save_packaging_work_order_batch',
      expect.objectContaining({
        p_input_batch_id: null,
        p_values: expect.objectContaining({
          employee_ids: values.employee_ids,
        }),
      }),
    )
  })

  it('reads paginated work orders from the batch list RPC', async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          input_batch_id: '11111111-1111-4111-8111-111111111111',
          employee_ids: ['employee-1', 'employee-2'],
          employee_names: ['张三', '李四'],
          quantity: 100,
          defective_quantity: 2,
          total_count: 1,
        },
      ],
      error: null,
    })

    const result = await getPackagingWorkOrderList({
      page: 2,
      pageSize: 10,
      searchParams: { keyword: '张三' },
    })

    expect(supabaseMock.rpc).toHaveBeenCalledWith(
      'get_packaging_work_order_batches',
      {
        p_page: 2,
        p_page_size: 10,
        p_keyword: '张三',
        p_start_date: null,
        p_end_date: null,
        p_employee_id: null,
      },
    )
    expect(result).toMatchObject({
      total: 1,
      items: [
        {
          employee_ids: ['employee-1', 'employee-2'],
          employee_names: ['张三', '李四'],
        },
      ],
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
