import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const response = {
    current: { data: [] as unknown[], error: null as unknown, count: 0 },
    queue: [] as Array<{
      data: unknown[]
      error: unknown
      count: number
    }>,
  }
  const query = {
    select: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
    eq: vi.fn(),
    ilike: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    abortSignal: vi.fn(),
    then: vi.fn(),
  }

  for (const method of [
    'select',
    'gte',
    'lte',
    'eq',
    'ilike',
    'order',
    'range',
    'abortSignal',
  ] as const) {
    query[method].mockReturnValue(query)
  }

  query.then.mockImplementation((resolve, reject) => {
    const nextResponse = response.queue.shift() ?? response.current
    return Promise.resolve(nextResponse).then(resolve, reject)
  })

  return {
    from: vi.fn().mockReturnValue(query),
    query,
    response,
  }
})

vi.mock('./supabase', () => ({
  default: { from: mocks.from },
}))

import {
  getExtrusionProductionDailyReport,
  getExtrusionProductionDailyReportForExport,
} from './apiExtrusionProductionDailyReport'

const EXPECTED_ORDER_CALLS = [
  ['extrusion_productions(production_date)', { ascending: false }],
  ['extrusion_productions(id)', { ascending: true }],
  ['sort_order', { ascending: true }],
  ['id', { ascending: true }],
]

function createReportItem(index: number) {
  return {
    id: `item-${String(index).padStart(4, '0')}`,
    extrusion_production_id: `production-${String(
      Math.floor(index / 2),
    ).padStart(4, '0')}`,
    project_no: `P-${index}`,
    product_model: null,
    customer: null,
    customer_model: null,
    material_name: null,
    order_length_mm: index,
    theoretical_unit_weight_kg_per_meter: 1,
    die_no: null,
    billet_quantity: 1,
    billet_input_weight_kg: 1,
    actual_output_length_mm: 1,
    actual_unit_weight_kg: 1,
    actual_quantity: 1,
    theoretical_output_count: 1,
    theoretical_output_weight_kg: 1,
    actual_output_weight_kg: 1,
    scrap_weight_kg: 0,
    tailing_weight_kg: 0,
    material_yield: 1,
    remark: null,
    sort_order: index % 2,
    created_at: '2026-07-13T00:00:00Z',
    updated_at: '2026-07-13T00:00:00Z',
    extrusion_productions: {
      id: `production-${String(Math.floor(index / 2)).padStart(4, '0')}`,
      production_date: '2026-07-13',
      shift: '白班',
      shift_leader_name: '测试班长',
      is_audited: false,
      machine: {
        machine_name: '挤压机',
        unified_device_no: 'EX-01',
      },
    },
  }
}

describe('extrusion production daily report queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.response.current = { data: [], error: null, count: 0 }
    mocks.response.queue = []
  })

  it('uses a stable nested order before paginating and forwards cancellation', async () => {
    const signal = new AbortController().signal

    await getExtrusionProductionDailyReport({
      page: 2,
      pageSize: 10,
      signal,
    })

    const selectClause = mocks.query.select.mock.calls[0]?.[0]
    expect(selectClause).toContain(
      'extrusion_productions!extrusion_production_items_extrusion_production_id_fkey!inner(',
    )
    expect(mocks.query.order.mock.calls).toEqual(EXPECTED_ORDER_CALLS)
    expect(mocks.query.range).toHaveBeenCalledWith(10, 19)
    expect(mocks.query.abortSignal).toHaveBeenCalledWith(signal)
    expect(mocks.query.order.mock.invocationCallOrder.at(-1)).toBeLessThan(
      mocks.query.range.mock.invocationCallOrder[0],
    )
  })

  it('uses the same stable order and cancellation for exports', async () => {
    const signal = new AbortController().signal

    await getExtrusionProductionDailyReportForExport({}, signal)

    expect(mocks.query.order.mock.calls).toEqual(EXPECTED_ORDER_CALLS)
    expect(mocks.query.range).toHaveBeenCalledWith(0, 999)
    expect(mocks.query.abortSignal).toHaveBeenCalledWith(signal)
  })

  it('exports more than 1000 rows without gaps or duplicates using the same stable order', async () => {
    const firstPage = Array.from({ length: 1000 }, (_, index) =>
      createReportItem(index),
    )
    const secondPage = [createReportItem(1000), createReportItem(1001)]
    const signal = new AbortController().signal
    mocks.response.queue = [
      { data: firstPage, error: null, count: 0 },
      { data: secondPage, error: null, count: 0 },
    ]

    const rows = await getExtrusionProductionDailyReportForExport({}, signal)

    expect(rows.map(({ id }) => id)).toEqual(
      Array.from(
        { length: 1002 },
        (_, index) => `item-${String(index).padStart(4, '0')}`,
      ),
    )
    expect(new Set(rows.map(({ id }) => id)).size).toBe(1002)
    expect(mocks.query.range.mock.calls).toEqual([
      [0, 999],
      [1000, 1999],
    ])
    expect(mocks.query.order.mock.calls).toEqual([
      ...EXPECTED_ORDER_CALLS,
      ...EXPECTED_ORDER_CALLS,
    ])
    expect(mocks.query.abortSignal).toHaveBeenCalledTimes(2)
    expect(mocks.query.abortSignal).toHaveBeenNthCalledWith(1, signal)
    expect(mocks.query.abortSignal).toHaveBeenNthCalledWith(2, signal)
  })
})
