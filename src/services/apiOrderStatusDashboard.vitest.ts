import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockFrom, mockRpc } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
}))

vi.mock('./supabase', () => ({
  default: {
    from: mockFrom,
    rpc: mockRpc,
  },
}))

import {
  buildJobColumns,
  buildPackagingProductionDetailsForDashboard,
  getOrderStatusDashboard,
} from './apiOrderStatusDashboard'

function createQuery<T>(data: T[]) {
  const query = {
    in: vi.fn(),
    not: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    select: vi.fn(),
  }

  query.in.mockReturnValue(query)
  query.not.mockReturnValue(query)
  query.order.mockReturnValue(query)
  query.select.mockReturnValue(query)
  query.range.mockResolvedValue({ data, error: null })

  return query
}

beforeEach(() => {
  mockFrom.mockReset()
  mockRpc.mockReset()
})

describe('buildJobColumns', () => {
  it('always includes the packaging process column', () => {
    expect(
      buildJobColumns({
        lastProcessJobNames: [],
        lastProcessJobOperations: new Map(),
      }),
    ).toEqual([{ key: '包装', title: '包装', operations: [] }])
  })
})

describe('getOrderStatusDashboard', () => {
  it('keeps a specific last CNC operation when a generic CNC standard is not last', async () => {
    mockRpc.mockResolvedValue({
      data: {
        items: [
          {
            id: 'order-1',
            length_mm: 645,
            material_code: '02.105.304.2.263',
            project_no: '26063003-02',
            productionRows: [
              {
                created_at: '2026-07-04T00:00:00.000Z',
                data_category: 'A',
                id: 'old-cnc',
                operation: 'CNC（四轴工装.2台同步）',
                product_model: '105-304',
                qualified_quantity: 1114,
              },
              {
                created_at: '2026-07-16T00:00:00.000Z',
                data_category: 'A',
                id: 'new-cnc',
                operation: 'CNC（四轴工装）2台同步',
                product_model: '105-304',
                qualified_quantity: 280,
              },
            ],
          },
        ],
        materialTransferCount: 0,
        productionItemCount: 2,
        total: 1,
      },
      error: null,
    })

    const processStandardsQuery = createQuery([
      {
        is_last_process: false,
        job_name: 'CNC',
        length: 646.1,
        model: '105-304',
        operation: 'CNC',
        part_no: null,
        record_type: 'B',
      },
      {
        is_last_process: true,
        job_name: 'CNC',
        length: 645,
        model: '105-304',
        operation: 'CNC（四轴工装.2台同步）',
        part_no: '02.105.304.1.263',
        record_type: 'A',
      },
      {
        is_last_process: true,
        job_name: 'CNC',
        length: 645,
        model: '105-304',
        operation: 'CNC（四轴工装）2台同步',
        part_no: '02.105.304.2.263',
        record_type: 'A',
      },
    ])
    const packagingWorkOrdersQuery = createQuery([])

    mockFrom.mockImplementation((table: string) =>
      table === 'process_standards'
        ? processStandardsQuery
        : packagingWorkOrdersQuery,
    )

    const result = await getOrderStatusDashboard({
      page: 1,
      pageSize: 20,
    })

    expect(result.items[0]?.jobOutputs.CNC).toBe(1394)
  })
})

describe('buildPackagingProductionDetailsForDashboard', () => {
  it('groups packaging work orders with the daily report dimensions', () => {
    const details = buildPackagingProductionDetailsForDashboard([
      {
        id: 'wo-1',
        work_date: '2026-07-07',
        employee_name: '张三',
        project_no: '26070701-01',
        product_model: 'M-1',
        color_name: '银色',
        process_name: '氧化',
        length_mm: 1200,
        part_no: 'PN-1',
        weight_per_meter_kg: 1.25,
        quantity: 10.2,
        defective_quantity: 1,
        defective_weight_kg: 1.5,
        defect_reason: '划伤',
        standard_seconds: 30,
        work_hours: 0.08,
        extra_qualified_hours: 0.25,
        remark: null,
      },
      {
        id: 'wo-2',
        work_date: '2026-07-07',
        employee_name: '李四',
        project_no: '26070701-01',
        product_model: 'M-1',
        color_name: '银色',
        process_name: '氧化',
        length_mm: 1200,
        part_no: 'PN-1',
        weight_per_meter_kg: 1.25,
        quantity: 20.4,
        defective_quantity: 2,
        defective_weight_kg: 3,
        defect_reason: '碰伤',
        standard_seconds: 30,
        work_hours: 0.17,
        extra_qualified_hours: 0,
        remark: '加急',
      },
      {
        id: 'wo-3',
        work_date: '2026-07-07',
        employee_name: '王五',
        project_no: '26070701-01',
        product_model: 'M-1',
        color_name: '银色',
        process_name: '喷砂',
        length_mm: 1200,
        part_no: 'PN-1',
        weight_per_meter_kg: 1.25,
        quantity: 5,
        defective_quantity: 0,
        defective_weight_kg: 0,
        defect_reason: null,
        standard_seconds: 20,
        work_hours: 0.03,
        extra_qualified_hours: 0,
        remark: null,
      },
    ])

    expect(details).toHaveLength(2)
    expect(details[0]).toMatchObject({
      jobName: '包装',
      operation: '氧化',
      operatorName: '张三、李四',
      orderDate: '2026-07-07',
      projectNo: '26070701-01',
      productModel: 'M-1',
      lengthMm: 1200,
      qualifiedQuantity: 31,
      defectQuantity: 3,
      defectQuantity1: 3,
      defectReason1: '划伤\n碰伤',
      qualifiedHours: 0.5,
      workHours: 0.5,
      remark: '加急',
    })
    expect(details[1]).toMatchObject({
      operation: '喷砂',
      operatorName: '王五',
      qualifiedQuantity: 5,
    })
  })
})
