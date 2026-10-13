import { beforeEach, describe, expect, it, vi } from 'vitest'

type ChainCall = [method: string, ...args: unknown[]]
type Resolver = (table: string, calls: ChainCall[]) => unknown

const supabaseMock = vi.hoisted(() => ({
  resolver: (() => ({ data: [], error: null })) as Resolver,
}))

vi.mock('./supabase', () => {
  function createChain(table: string) {
    const calls: ChainCall[] = []
    const chain: Record<string, unknown> = {}
    const record =
      (method: string) =>
      (...args: unknown[]) => {
        calls.push([method, ...args])
        return chain
      }

    for (const method of [
      'select',
      'order',
      'gte',
      'lte',
      'eq',
      'neq',
      'ilike',
      'in',
      'range',
    ]) {
      chain[method] = record(method)
    }

    chain.then = (resolve: (value: unknown) => unknown) =>
      resolve(supabaseMock.resolver(table, calls))

    return chain
  }

  return { default: { from: (table: string) => createChain(table) } }
})

vi.mock('./apiProductionOrderItems', () => ({
  resolveProductionOrderItemStandardSeconds: vi.fn(),
}))

import {
  getProductionItemsByProjectNo,
  getProductionOrders,
  getProductionOrdersForExportChunked,
} from './apiProductionOrders'

describe('apiProductionOrders', () => {
  beforeEach(() => {
    supabaseMock.resolver = () => ({ data: [], error: null })
  })

  it('列表按明细汇总正工时、合格工时、效率，并标记标准工时为 0 的合格明细', async () => {
    supabaseMock.resolver = () => ({
      data: [
        {
          id: 'o1',
          work_hours: 8,
          extra_qualified_hours: 1,
          items: [
            { qualified_hours: 5, defect_hours: 1, qualified_quantity: 10 },
            { qualified_hours: 0, defect_hours: 0, qualified_quantity: 3 },
          ],
        },
      ],
      count: 1,
      error: null,
    })

    const result = await getProductionOrders({ page: 1, pageSize: 10 })

    expect(result.total).toBe(1)
    expect(result.items[0]).toMatchObject({
      id: 'o1',
      positive_qualified_hours: 5,
      total_qualified_hours: 5,
      efficiency: 5 / 8,
      hasZeroStandardQualifiedItem: true,
    })
    expect(result.items[0]).not.toHaveProperty('items')
  })

  it('分批导出去重、按日期与创建时间排序并逐批回报进度', async () => {
    const rowsById: Record<string, object> = {
      a: { id: 'a', order_date: '2026-10-02', created_at: '1' },
      b: { id: 'b', order_date: '2026-10-01', created_at: '2' },
    }
    supabaseMock.resolver = (_table, calls) => {
      const inCall = calls.find(([method]) => method === 'in')
      const ids = (inCall?.[2] ?? []) as string[]
      return { data: ids.map((id) => rowsById[id]), error: null }
    }
    const onProgress = vi.fn()

    const rows = await getProductionOrdersForExportChunked(['a', 'b', 'a'], {
      chunkSize: 1,
      onProgress,
    })

    expect(rows.map((row) => row.id)).toEqual(['b', 'a'])
    expect(onProgress.mock.calls).toEqual([
      [{ loaded: 1, total: 2 }],
      [{ loaded: 2, total: 2 }],
    ])
  })

  it('按项目号查询明细时带出工单日期、班别与员工姓名', async () => {
    supabaseMock.resolver = () => ({
      data: [
        {
          id: 'i1',
          operation: '精切',
          order_id: 'o1',
          production_orders: {
            id: 'o1',
            order_date: '2026-10-01',
            shift: '夜班',
            employee: { name: '张三' },
          },
        },
        {
          id: 'i2',
          operation: '包装',
          order_id: 'o2',
          production_orders: null,
        },
      ],
      error: null,
    })

    const items = await getProductionItemsByProjectNo(' P001 ')

    expect(items[0]).toMatchObject({
      id: 'i1',
      order_date: '2026-10-01',
      shift: '夜班',
      employee_name: '张三',
    })
    expect(items[1]).toMatchObject({
      id: 'i2',
      order_date: '',
      shift: '',
      employee_name: null,
    })
  })
})
