import { beforeEach, describe, expect, it, vi } from 'vitest'

interface QueryCall {
  table: string
  operation?: 'select' | 'update' | 'insert'
  filters: Record<string, unknown>
  payload?: unknown
  columns?: string
}

const calls: QueryCall[] = []

function createQueryBuilder(table: string) {
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
    insert(payload: unknown) {
      call.operation = 'insert'
      call.payload = payload
      return builder
    },
    single() {
      return Promise.resolve({ data: { id: 1 }, error: null })
    },
    then(resolve: (value: { data: unknown[]; error: null }) => void) {
      return Promise.resolve({ data: [], error: null }).then(resolve)
    },
  }

  return builder
}

vi.mock('./supabase', () => ({
  default: {
    from: (table: string) => createQueryBuilder(table),
  },
}))

vi.mock('@utils/errorHandler', () => ({
  handleApiError: vi.fn((error: unknown, message: string) => {
    if (error instanceof Error) {
      return new Error(`${message}: ${error.message}`)
    }

    return new Error(message)
  }),
}))

describe('updatePoItems', () => {
  beforeEach(() => {
    calls.length = 0
  })

  it('does not clear fields omitted by the detail edit form', async () => {
    const { updatePoItems } = await import('./apiSyneyPo')

    await updatePoItems({
      ids: [101],
      values: {
        PartNo: 'XN2808EB',
        PartName: '前沿板',
        Spec: '1000型',
        ParamSpec: 'A=123',
        Remark: '备注',
      },
    })

    const updateCall = calls.find(
      (call) =>
        call.table === 'syney-po-items' && call.operation === 'update',
    )

    expect(updateCall?.payload).toEqual({
      ParamSpec: 'A=123',
      PartName: '前沿板',
      PartNo: 'XN2808EB',
      Remark: '备注',
      Spec: '1000型',
    })
  })
})
