import { beforeEach, describe, expect, it, vi } from 'vitest'

type TableName = 'youmai_finished_goods_inventory' | 'youmai_product_data'

interface QueryCall {
  table: TableName
  operation?: 'select' | 'update'
  filters: Record<string, unknown>
  payload?: unknown
  columns?: string
}

const calls: QueryCall[] = []
const mockResponses: {
  data: unknown
  error: unknown
} = {
  data: null,
  error: null,
}

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
    limit(value: number) {
      call.filters.limit = value
      return builder
    },
    abortSignal() {
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
    maybeSingle() {
      return Promise.resolve({
        data: mockResponses.data,
        error: mockResponses.error,
      })
    },
    then(resolve: (value: { data: unknown, error: unknown }) => void) {
      return Promise.resolve({
        data: mockResponses.data,
        error: mockResponses.error,
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

describe('apiYoumaiFinishedGoodsInventory', () => {
  beforeEach(() => {
    calls.length = 0
    mockResponses.data = null
    mockResponses.error = null
  })

  it('adjustYoumaiFinishedGoodsInventory only updates current_stock and trimmed remarks', async () => {
    const { adjustYoumaiFinishedGoodsInventory }
      = await import('./apiYoumaiFinishedGoodsInventory')

    await adjustYoumaiFinishedGoodsInventory({
      id: 'inv-1',
      current_stock: 42,
      remarks: '  月底盘点修正  ',
    })

    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({
      table: 'youmai_finished_goods_inventory',
      operation: 'update',
      filters: { id: 'inv-1' },
      payload: {
        current_stock: 42,
        remarks: '月底盘点修正',
      },
    })
  })

  it('rejects negative stock before sending an update request', async () => {
    const { adjustYoumaiFinishedGoodsInventory }
      = await import('./apiYoumaiFinishedGoodsInventory')

    await expect(
      adjustYoumaiFinishedGoodsInventory({
        id: 'inv-1',
        current_stock: -1,
        remarks: '',
      }),
    ).rejects.toThrow('调整后库存不能小于 0')

    expect(calls).toHaveLength(0)
  })

  it('fetches a single finished goods inventory row by product_data_id', async () => {
    const row = {
      id: 'inv-1',
      product_data_id: 'prod-1',
      current_stock: 20,
      pending_stock_in: 5,
      pending_stock_out: 3,
      final_stock: 22,
    }
    mockResponses.data = row

    const { getYoumaiFinishedGoodsInventoryByProductDataId }
      = await import('./apiYoumaiFinishedGoodsInventory')

    const result = await getYoumaiFinishedGoodsInventoryByProductDataId('prod-1')

    expect(result).toEqual(row)
    expect(calls[0]).toMatchObject({
      table: 'youmai_finished_goods_inventory',
      operation: 'select',
      filters: { product_data_id: 'prod-1', limit: 1 },
    })
  })
})
