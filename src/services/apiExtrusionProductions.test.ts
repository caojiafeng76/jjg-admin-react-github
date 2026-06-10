import { beforeEach, describe, expect, it, vi } from 'vitest'

const orderBy = vi.fn(() => queryBuilder)
const range = vi.fn()
const eq = vi.fn(() => queryBuilder)
const single = vi.fn()
const insert = vi.fn(() => queryBuilder)
const update = vi.fn(() => queryBuilder)
const deleteFn = vi.fn(() => queryBuilder)
const rpc = vi.fn()
const select = vi.fn(() => queryBuilder)
const from = vi.fn(() => queryBuilder)

const queryBuilder = {
  delete: deleteFn,
  eq,
  from,
  insert,
  order: orderBy,
  range,
  rpc,
  select,
  single,
  update,
}

vi.mock('./supabase', () => ({
  default: {
    from,
    rpc,
  },
}))

vi.mock('@/utils/errorHandler', () => ({
  handleApiError: vi.fn((error: unknown, message: string) => {
    if (error instanceof Error) {
      return new Error(`${message}: ${error.message}`)
    }

    return new Error(message)
  }),
}))

describe('apiExtrusionProductions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    from.mockReturnValue(queryBuilder)
    select.mockReturnValue(queryBuilder)
    orderBy.mockReturnValue(queryBuilder)
    range.mockResolvedValue({ data: [], error: null, count: 0 })
    eq.mockReturnValue(queryBuilder)
    single.mockResolvedValue({ data: null, error: null })
    insert.mockReturnValue(queryBuilder)
    update.mockReturnValue(queryBuilder)
    deleteFn.mockReturnValue(queryBuilder)
    rpc.mockResolvedValue({ data: null, error: null })
  })

  it('gets project detail by project no', async () => {
    const salesOrder = {
      customer: '西尼',
      customer_model: 'XM-01',
      length_mm: 6000,
      material_code: '6063-T5',
      product_model: 'P-100',
      project_no: 'PRJ-001',
    }
    single.mockResolvedValueOnce({ data: salesOrder, error: null })

    const { getExtrusionSalesOrderByProjectNo } = await import(
      './apiExtrusionProductions'
    )

    const result = await getExtrusionSalesOrderByProjectNo('PRJ-001')

    expect(from).toHaveBeenCalledWith('sales_orders')
    expect(select).toHaveBeenCalledWith(
      'project_no, product_model, length_mm, material_code, customer, customer_model, weight_per_meter_kg',
    )
    expect(eq).toHaveBeenCalledWith('project_no', 'PRJ-001')
    expect(result).toEqual(salesOrder)
  })

  it('lists extrusion productions with pagination', async () => {
    const rows = [
      {
        id: 'ep-1',
        production_date: '2026-06-09',
      },
    ]
    range.mockResolvedValueOnce({ data: rows, error: null, count: 1 })

    const { getExtrusionProductions } = await import('./apiExtrusionProductions')

    const result = await getExtrusionProductions({
      filters: { shift: '白班' },
      page: 2,
      pageSize: 10,
    })

    expect(from).toHaveBeenCalledWith('extrusion_productions')
    expect(select).toHaveBeenCalledWith('*, extrusion_production_items(*)', {
      count: 'exact',
    })
    expect(orderBy).toHaveBeenNthCalledWith(1, 'production_date', {
      ascending: false,
    })
    expect(orderBy).toHaveBeenNthCalledWith(2, 'created_at', {
      ascending: false,
    })
    expect(eq).toHaveBeenCalledWith('shift', '白班')
    expect(range).toHaveBeenCalledWith(10, 19)
    expect(result).toEqual({ items: rows, total: 1 })
  })

  it('normalizes payload and calls rpc when creating extrusion production', async () => {
    rpc.mockResolvedValueOnce({ data: 'ep-1', error: null })

    const { createExtrusionProduction } = await import('./apiExtrusionProductions')

    const result = await createExtrusionProduction({
      header: {
        is_audited: false,
        machine_id: 'machine-1',
        production_date: '2026-06-09',
        remark: '  备注  ',
        shift: '白班',
        shift_leader_name: 'leader-1',
        uploaded_by_name: '  上传人  ',
      },
      items: [
        {
          actual_output_length_mm: 6500,
          actual_quantity: 100,
          actual_unit_weight_kg: 2.5,
          billet_diameter_mm: 120,
          billet_input_weight_kg: 320,
          billet_length_mm: 7000,
          billet_quantity: 4,
          customer: '  西尼  ',
          customer_model: '  XM-01  ',
          die_no: '  M-1  ',
          material_name: '  6063-T5  ',
          order_length_mm: 6000,
          product_model: '  P-100  ',
          project_no: '  PRJ-001  ',
          remark: '  明细备注  ',
          scrap_weight_kg: 12,
          sort_order: 1,
          tailing_weight_kg: 8,
          theoretical_output_count: 108,
          theoretical_output_weight_kg: 302.4,
          theoretical_unit_weight_kg_per_meter: 0.42,
        },
      ],
    })

    expect(rpc).toHaveBeenCalledWith('upsert_extrusion_production', {
      p_header: expect.objectContaining({
        is_audited: false,
        machine_id: 'machine-1',
        production_date: '2026-06-09',
        remark: '备注',
        shift: '白班',
        shift_leader_name: 'leader-1',
        uploaded_by_name: '上传人',
      }),
      p_items: [
        expect.objectContaining({
          actual_output_length_mm: 6500,
          actual_output_weight_kg: 250,
          actual_quantity: 100,
          actual_unit_weight_kg: 2.5,
          billet_diameter_mm: 120,
          billet_input_weight_kg: 320,
          billet_length_mm: 7000,
          billet_quantity: 4,
          customer: '西尼',
          customer_model: 'XM-01',
          die_no: 'M-1',
          material_name: '6063-T5',
          material_yield: 78.125,
          order_length_mm: 6000,
          product_model: 'P-100',
          project_no: 'PRJ-001',
          remark: '明细备注',
          scrap_weight_kg: 12,
          sort_order: 1,
          tailing_weight_kg: 8,
          theoretical_output_count: 108,
          theoretical_output_weight_kg: 302.4,
          theoretical_unit_weight_kg_per_meter: 0.42,
        }),
      ],
    })
    expect(result).toBe('ep-1')
  })
})
