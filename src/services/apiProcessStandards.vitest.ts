import { beforeEach, describe, expect, it, vi } from 'vitest'

interface QueryResult {
  data: unknown
  error: { message: string } | null
}

interface QueryCall {
  args: unknown[]
  method: string
  table: string
}

interface QueryBuilder extends PromiseLike<QueryResult> {
  eq: (...args: unknown[]) => QueryBuilder
  limit: (...args: unknown[]) => QueryBuilder
  maybeSingle: (...args: unknown[]) => QueryBuilder
  not: (...args: unknown[]) => QueryBuilder
  order: (...args: unknown[]) => QueryBuilder
  range: (...args: unknown[]) => QueryBuilder
  select: (...args: unknown[]) => QueryBuilder
  single: (...args: unknown[]) => QueryBuilder
}

const database = vi.hoisted(() => ({
  calls: [] as QueryCall[],
  responses: [] as QueryResult[],
}))

vi.mock('./supabase', () => ({
  default: {
    from: (table: string) => {
      const response = database.responses.shift() ?? {
        data: [],
        error: null,
      }
      const builder = {} as QueryBuilder
      const chain =
        (method: string) =>
        (...args: unknown[]): QueryBuilder => {
          database.calls.push({ args, method, table })
          return builder
        }

      builder.eq = chain('eq')
      builder.limit = chain('limit')
      builder.maybeSingle = chain('maybeSingle')
      builder.not = chain('not')
      builder.order = chain('order')
      builder.range = chain('range')
      builder.select = chain('select')
      builder.single = chain('single')
      builder.then = (resolve, reject) =>
        Promise.resolve(response).then(resolve, reject)

      return builder
    },
  },
}))

vi.mock('@/utils/errorHandler', () => ({
  handleApiError: (error: { message: string }, message: string) =>
    new Error(`${message}: ${error.message}`),
}))

import {
  getModels,
  getOperationsByModel,
  getSalesOrderByProjectNo,
  getSalesOrdersProjectNos,
  getStandardSeconds,
} from './apiProcessStandards'

function enqueue(...responses: QueryResult[]) {
  database.responses.push(...responses)
}

function callsFor(method: string) {
  return database.calls.filter((call) => call.method === method)
}

describe('apiProcessStandards', () => {
  beforeEach(() => {
    database.calls.length = 0
    database.responses.length = 0
  })

  it('returns no match without querying when the model is blank', async () => {
    await expect(
      getOperationsByModel({ model: '   ', length: 100, partNo: 'P-1' }),
    ).resolves.toEqual({ records: [], matchLevel: null })
    await expect(
      getStandardSeconds({ model: '', operation: '切割' }),
    ).resolves.toBe(0)

    expect(database.calls).toEqual([])
  })

  it('normalizes inputs and prefers an exact type A match', async () => {
    const exactRecord = {
      id: 'standard-a',
      model: 'M-1',
      operation: '切割',
      part_no: 'P-1',
      record_type: 'A',
      standard_seconds: 42,
    }
    enqueue({ data: [exactRecord], error: null })

    await expect(
      getOperationsByModel({
        model: ' M-1 ',
        length: 1200,
        partNo: ' P-1 ',
      }),
    ).resolves.toEqual({ records: [exactRecord], matchLevel: 'type-a' })

    expect(callsFor('eq').map((call) => call.args)).toEqual([
      ['model', 'M-1'],
      ['record_type', 'A'],
      ['part_no', 'P-1'],
      ['length', 1200],
    ])
  })

  it('falls back to a type B match when the exact query is empty', async () => {
    const fallbackRecord = {
      id: 'standard-b',
      model: 'M-2',
      operation: '包装',
      record_type: 'B',
      standard_seconds: 18,
    }
    enqueue({ data: [], error: null }, { data: [fallbackRecord], error: null })

    await expect(
      getOperationsByModel({ model: 'M-2', length: 900, partNo: 'P-2' }),
    ).resolves.toEqual({ records: [fallbackRecord], matchLevel: 'type-b' })

    expect(
      callsFor('eq').filter((call) => call.args[0] === 'record_type'),
    ).toEqual([
      expect.objectContaining({ args: ['record_type', 'A'] }),
      expect.objectContaining({ args: ['record_type', 'B'] }),
    ])
  })

  it('uses the normalized operation when loading standard seconds', async () => {
    enqueue({ data: [{ standard_seconds: 37 }], error: null })

    await expect(
      getStandardSeconds({
        model: 'M-3',
        operation: ' 组装 ',
        length: 600,
        partNo: 'P-3',
      }),
    ).resolves.toBe(37)

    expect(callsFor('select')[0]?.args).toEqual(['standard_seconds'])
    expect(callsFor('eq')).toContainEqual(
      expect.objectContaining({ args: ['operation', '组装'] }),
    )
  })

  it('returns zero when neither type A nor type B has a match', async () => {
    enqueue({ data: [], error: null }, { data: [], error: null })

    await expect(
      getStandardSeconds({
        model: 'M-4',
        operation: '检验',
        length: -1,
        partNo: '   ',
      }),
    ).resolves.toBe(0)

    expect(callsFor('eq').some((call) => call.args[0] === 'part_no')).toBe(
      false,
    )
  })

  it('deduplicates the model list and translates query errors', async () => {
    enqueue({
      data: [{ model: 'M-1' }, { model: 'M-2' }, { model: 'M-1' }],
      error: null,
    })
    await expect(getModels()).resolves.toEqual(['M-1', 'M-2'])

    enqueue({ data: null, error: { message: 'offline' } })
    await expect(getModels()).rejects.toThrow('获取型号列表失败: offline')
  })

  it('loads every production sales-order page without dropping valid rows', async () => {
    const firstPage = Array.from({ length: 1000 }, (_, index) => ({
      created_at: `2026-07-13T00:${String(index % 60).padStart(2, '0')}:00Z`,
      customer: '客户',
      customer_model: null,
      length_mm: 1000,
      material_code: `MAT-${index}`,
      product_model: 'M-1',
      project_no:
        index === 500 ? null : index === 999 ? 'P-0' : `P-${index}`,
    }))
    const finalRow = {
      created_at: '2026-07-12T00:00:00Z',
      customer: '客户',
      customer_model: 'C-1',
      length_mm: 900,
      material_code: 'MAT-1000',
      product_model: 'M-2',
      project_no: 'P-1000',
    }
    enqueue({ data: firstPage, error: null }, { data: [finalRow], error: null })

    const result = await getSalesOrdersProjectNos()

    expect(result).toHaveLength(999)
    expect(result).not.toContainEqual(
      expect.objectContaining({ project_no: null }),
    )
    expect(result.at(-1)).toEqual(finalRow)
    expect(result.filter((item) => item.project_no === 'P-0')).toHaveLength(1)
    expect(callsFor('range').map((call) => call.args)).toEqual([
      [0, 999],
      [1000, 1999],
    ])
    expect(callsFor('eq')[0]?.args).toEqual(['status', '生产中'])
    expect(callsFor('not')[0]?.args).toEqual(['project_no', 'is', null])
  })

  it('returns a sales order by project number and rejects missing data', async () => {
    const detail = {
      customer: '客户',
      customer_model: null,
      length_mm: 1000,
      material_code: 'MAT-1',
      product_model: 'M-1',
      project_no: 'P-1',
    }
    enqueue({ data: detail, error: null })

    await expect(getSalesOrderByProjectNo('P-1')).resolves.toEqual(detail)
    expect(callsFor('eq').at(-1)?.args).toEqual(['project_no', 'P-1'])
    expect(callsFor('order')).toContainEqual(
      expect.objectContaining({
        args: ['created_at', { ascending: false }],
      }),
    )
    expect(callsFor('limit')).toContainEqual(
      expect.objectContaining({ args: [1] }),
    )
    expect(callsFor('maybeSingle')).toHaveLength(1)

    enqueue({ data: null, error: null })
    await expect(getSalesOrderByProjectNo('missing')).rejects.toThrow(
      '销售订单项目号不存在',
    )
  })

  it('surfaces matching and pagination query failures', async () => {
    enqueue({ data: null, error: { message: 'match failed' } })
    await expect(
      getOperationsByModel({ model: 'M-5', length: 100, partNo: 'P-5' }),
    ).rejects.toThrow('获取成本核算匹配数据失败: match failed')

    enqueue({ data: null, error: { message: 'sales failed' } })
    await expect(getSalesOrdersProjectNos()).rejects.toThrow(
      '获取项目号列表失败: sales failed',
    )
  })
})
