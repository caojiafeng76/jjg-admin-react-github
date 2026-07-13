import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock, publicFromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  publicFromMock: vi.fn(),
}))

vi.mock('./supabase', () => ({
  default: { from: fromMock },
}))

vi.mock('./publicSupabase', () => ({
  default: { from: publicFromMock },
}))

import { getToolingDataOptions as getInventoryOptions } from './apiToolingInventory'
import { getToolingDataOptions as getStockInOptions } from './apiToolingStockIn'
import {
  getPublicToolingDataOptions,
  getToolingDataOptions as getStockOutOptions,
} from './apiToolingStockOut'

const TOOLING_OPTION_SELECT =
  'id, tool_code, tool_name, tool_spec, material, unit_price'

interface QueryBuilder {
  data: unknown[]
  error: null
  select: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  or: ReturnType<typeof vi.fn>
  limit: ReturnType<typeof vi.fn>
  abortSignal: ReturnType<typeof vi.fn>
}

type OptionsService = (
  keyword?: string,
  signal?: AbortSignal,
  limit?: number,
) => Promise<unknown>

function createQueryBuilder(): QueryBuilder {
  const builder = {
    data: [],
    error: null,
    select: vi.fn(),
    order: vi.fn(),
    or: vi.fn(),
    limit: vi.fn(),
    abortSignal: vi.fn(),
  } as QueryBuilder

  builder.select.mockReturnValue(builder)
  builder.order.mockReturnValue(builder)
  builder.or.mockReturnValue(builder)
  builder.limit.mockReturnValue(builder)
  builder.abortSignal.mockReturnValue(builder)

  return builder
}

const authenticatedServices: Array<[string, OptionsService]> = [
  ['库存', getInventoryOptions],
  ['入库', getStockInOptions],
  ['出库', getStockOutOptions],
]

describe.each(authenticatedServices)('%s刀具资料选项', (_label, service) => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses a trimmed server filter, minimal fields, stable order and a 50-row cap', async () => {
    const builder = createQueryBuilder()
    fromMock.mockReturnValue(builder)
    const signal = new AbortController().signal

    await service('  T-01  ', signal, 500)

    expect(fromMock).toHaveBeenCalledWith('tooling_data')
    expect(builder.select).toHaveBeenCalledWith(TOOLING_OPTION_SELECT)
    expect(builder.or).toHaveBeenCalledWith(
      'tool_code.ilike."%T-01%",tool_name.ilike."%T-01%",tool_spec.ilike."%T-01%",material.ilike."%T-01%"',
    )
    expect(builder.order.mock.calls).toEqual([
      ['tool_code', { ascending: true }],
      ['id', { ascending: true }],
    ])
    expect(builder.limit).toHaveBeenCalledWith(50)
    expect(builder.abortSignal).toHaveBeenCalledWith(signal)
  })

  it('skips an empty filter and clamps the lower bound to one row', async () => {
    const builder = createQueryBuilder()
    fromMock.mockReturnValue(builder)

    await service('   ', undefined, 0)

    expect(builder.or).not.toHaveBeenCalled()
    expect(builder.limit).toHaveBeenCalledWith(1)
    expect(builder.abortSignal).not.toHaveBeenCalled()
  })

  it('escapes PostgREST delimiters and LIKE wildcards in search terms', async () => {
    const builder = createQueryBuilder()
    fromMock.mockReturnValue(builder)

    await service('50%_,(")\\')

    expect(builder.or).toHaveBeenCalledWith(
      String.raw`tool_code.ilike."%50\\%\\_,(\")\\\\%",tool_name.ilike."%50\\%\\_,(\")\\\\%",tool_spec.ilike."%50\\%\\_,(\")\\\\%",material.ilike."%50\\%\\_,(\")\\\\%"`,
    )
  })

  it('defaults an omitted limit to 50 rows', async () => {
    const builder = createQueryBuilder()
    fromMock.mockReturnValue(builder)

    await service()

    expect(builder.limit).toHaveBeenCalledWith(50)
  })
})

describe('公开扫码刀具资料选项', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('keeps the public client isolated while applying the same safe query cap', async () => {
    const builder = createQueryBuilder()
    publicFromMock.mockReturnValue(builder)
    const signal = new AbortController().signal

    await getPublicToolingDataOptions('  公制  ', signal, Number.NaN)

    expect(publicFromMock).toHaveBeenCalledWith('tooling_data')
    expect(fromMock).not.toHaveBeenCalled()
    expect(builder.select).toHaveBeenCalledWith(TOOLING_OPTION_SELECT)
    expect(builder.or).toHaveBeenCalledWith(
      'tool_code.ilike."%公制%",tool_name.ilike."%公制%",tool_spec.ilike."%公制%",material.ilike."%公制%"',
    )
    expect(builder.order.mock.calls).toEqual([
      ['tool_code', { ascending: true }],
      ['id', { ascending: true }],
    ])
    expect(builder.limit).toHaveBeenCalledWith(50)
    expect(builder.abortSignal).toHaveBeenCalledWith(signal)
  })
})
