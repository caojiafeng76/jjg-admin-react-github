import { beforeEach, describe, expect, it, vi } from 'vitest'

type TableName =
  | 'youmai_finished_goods_stock_in'
  | 'youmai_finished_goods_inventory'
  | 'youmai_product_data'

interface QueryCall {
  table: TableName
  operation?: 'select' | 'update'
  filters: Record<string, unknown>
  payload?: unknown
  columns?: string
}

const calls: QueryCall[] = []
const mockResults: Partial<Record<TableName, unknown[]>> = {}

function createQueryBuilder(table: TableName) {
  const call: QueryCall = {
    table,
    filters: {},
  }
  calls.push(call)

  const builder = {
    eq(column: string, value: unknown) {
      call.filters[column] = value
      return builder
    },
    in(column: string, value: unknown[]) {
      call.filters[column] = value
      return builder
    },
    select(columns: string) {
      call.operation = 'select'
      call.columns = columns
      return builder
    },
    update(payload: unknown) {
      call.operation = 'update'
      call.payload = payload
      return builder
    },
    then(resolve: (value: { data: unknown[]; error: null }) => void) {
      return Promise.resolve({
        data: mockResults[table] || [],
        error: null,
      }).then(resolve)
    },
  }

  return builder
}

vi.mock('./supabase', () => ({
  default: {
    from: (table: TableName) => createQueryBuilder(table),
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

describe('apiYoumaiFinishedGoodsStockIn', () => {
  beforeEach(() => {
    calls.length = 0
    mockResults.youmai_finished_goods_stock_in = []
    mockResults.youmai_finished_goods_inventory = []
    mockResults.youmai_product_data = []
  })

  it('blocks batch reverse audit when current stock is not enough', async () => {
    mockResults.youmai_finished_goods_stock_in = [
      {
        id: 'stock-in-1',
        product_data_id: 'product-1',
        material_code: 'YM-001',
        material_name: '优迈踏板',
        stock_in_quantity: 10,
      },
    ]
    mockResults.youmai_finished_goods_inventory = [
      {
        product_data_id: 'product-1',
        current_stock: 6,
      },
    ]

    const { batchUpdateYoumaiFinishedGoodsStockInStatus } =
      await import('./apiYoumaiFinishedGoodsStockIn')

    await expect(
      batchUpdateYoumaiFinishedGoodsStockInStatus({
        ids: ['stock-in-1'],
        status: '待审核',
      }),
    ).rejects.toThrow(
      '库存不足，无法反审以下优迈成品入库：YM-001 优迈踏板（需扣 10，现有 6）',
    )

    expect(
      calls.some(
        (call) =>
          call.table === 'youmai_finished_goods_stock_in' &&
          call.operation === 'update',
      ),
    ).toBe(false)
  })

  it('updates status after reverse audit stock validation passes', async () => {
    mockResults.youmai_finished_goods_stock_in = [
      {
        id: 'stock-in-1',
        product_data_id: 'product-1',
        material_code: 'YM-001',
        material_name: '优迈踏板',
        stock_in_quantity: 10,
      },
    ]
    mockResults.youmai_finished_goods_inventory = [
      {
        product_data_id: 'product-1',
        current_stock: 12,
      },
    ]

    const { batchUpdateYoumaiFinishedGoodsStockInStatus } =
      await import('./apiYoumaiFinishedGoodsStockIn')

    await batchUpdateYoumaiFinishedGoodsStockInStatus({
      ids: ['stock-in-1'],
      status: '待审核',
    })

    const updateCall = calls.find(
      (call) =>
        call.table === 'youmai_finished_goods_stock_in' &&
        call.operation === 'update',
    )

    expect(updateCall?.payload).toEqual({ status: '待审核' })
    expect(updateCall?.filters.id).toEqual(['stock-in-1'])
  })
})
