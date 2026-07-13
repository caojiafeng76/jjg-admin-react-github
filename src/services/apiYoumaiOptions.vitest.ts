import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}))

vi.mock('./supabase', () => ({
  default: { from: fromMock },
}))

import { getYoumaiProductDataOptions as getInventoryProductOptions } from './apiYoumaiFinishedGoodsInventory'
import { getYoumaiProductDataOptions as getStockInProductOptions } from './apiYoumaiFinishedGoodsStockIn'
import { getYoumaiProductDataOptions as getStockOutProductOptions } from './apiYoumaiFinishedGoodsStockOut'
import {
  getYoumaiRawMaterialInventoryOptionById,
  getYoumaiRawMaterialInventoryOptions,
} from './apiYoumaiRawMaterialInventory'

const PRODUCT_OPTION_SELECT =
  'id, material_code, material_name, model, specification, specific_gravity'
const RAW_MATERIAL_OPTION_SELECT = 'id, model, specification, quantity'

interface QueryBuilder {
  data: unknown[]
  error: null
  select: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  or: ReturnType<typeof vi.fn>
  limit: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
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
    eq: vi.fn(),
    maybeSingle: vi.fn(),
    abortSignal: vi.fn(),
  } as QueryBuilder

  builder.select.mockReturnValue(builder)
  builder.order.mockReturnValue(builder)
  builder.or.mockReturnValue(builder)
  builder.limit.mockReturnValue(builder)
  builder.eq.mockReturnValue(builder)
  builder.maybeSingle.mockReturnValue(builder)
  builder.abortSignal.mockReturnValue(builder)

  return builder
}

const productOptionsServices: Array<[string, OptionsService]> = [
  ['成品库存', getInventoryProductOptions],
  ['成品入库', getStockInProductOptions],
  ['成品出库', getStockOutProductOptions],
]

describe.each(productOptionsServices)('%s货品资料选项', (_label, service) => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses a trimmed server filter, minimal fields, stable order and a 50-row cap', async () => {
    const builder = createQueryBuilder()
    const signal = new AbortController().signal
    fromMock.mockReturnValue(builder)

    await service('  YM-01  ', signal, 500)

    expect(fromMock).toHaveBeenCalledWith('youmai_product_data')
    expect(builder.select).toHaveBeenCalledWith(PRODUCT_OPTION_SELECT)
    expect(builder.or).toHaveBeenCalledWith(
      'material_code.ilike."%YM-01%",material_name.ilike."%YM-01%",model.ilike."%YM-01%",specification.ilike."%YM-01%"',
    )
    expect(builder.order.mock.calls).toEqual([
      ['material_code', { ascending: true }],
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
      String.raw`material_code.ilike."%50\\%\\_,(\")\\\\%",material_name.ilike."%50\\%\\_,(\")\\\\%",model.ilike."%50\\%\\_,(\")\\\\%",specification.ilike."%50\\%\\_,(\")\\\\%"`,
    )
  })

  it('defaults an omitted or non-finite limit to 50 rows', async () => {
    const defaultBuilder = createQueryBuilder()
    fromMock.mockReturnValueOnce(defaultBuilder)

    await service()

    expect(defaultBuilder.limit).toHaveBeenCalledWith(50)

    const invalidBuilder = createQueryBuilder()
    fromMock.mockReturnValueOnce(invalidBuilder)

    await service(undefined, undefined, Number.NaN)

    expect(invalidBuilder.limit).toHaveBeenCalledWith(50)
  })
})

describe('原料库存选项', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('searches model/specification with stable ordering and a 50-row cap', async () => {
    const builder = createQueryBuilder()
    const signal = new AbortController().signal
    fromMock.mockReturnValue(builder)

    await getYoumaiRawMaterialInventoryOptions('  M8  ', signal, 100)

    expect(fromMock).toHaveBeenCalledWith('youmai_raw_material_inventory')
    expect(builder.select).toHaveBeenCalledWith(RAW_MATERIAL_OPTION_SELECT)
    expect(builder.or).toHaveBeenCalledWith(
      'model.ilike."%M8%",specification.ilike."%M8%"',
    )
    expect(builder.order.mock.calls).toEqual([
      ['model', { ascending: true }],
      ['specification', { ascending: true }],
      ['id', { ascending: true }],
    ])
    expect(builder.limit).toHaveBeenCalledWith(50)
    expect(builder.abortSignal).toHaveBeenCalledWith(signal)
  })

  it('escapes PostgREST delimiters and LIKE wildcards in raw material searches', async () => {
    const builder = createQueryBuilder()
    fromMock.mockReturnValue(builder)

    await getYoumaiRawMaterialInventoryOptions('50%_,(")\\')

    expect(builder.or).toHaveBeenCalledWith(
      String.raw`model.ilike."%50\\%\\_,(\")\\\\%",specification.ilike."%50\\%\\_,(\")\\\\%"`,
    )
  })

  it('skips a blank filter and clamps requested limits into the safe range', async () => {
    const lowerBuilder = createQueryBuilder()
    fromMock.mockReturnValueOnce(lowerBuilder)

    await getYoumaiRawMaterialInventoryOptions('   ', undefined, -10)

    expect(lowerBuilder.or).not.toHaveBeenCalled()
    expect(lowerBuilder.limit).toHaveBeenCalledWith(1)

    const defaultBuilder = createQueryBuilder()
    fromMock.mockReturnValueOnce(defaultBuilder)

    await getYoumaiRawMaterialInventoryOptions()

    expect(defaultBuilder.limit).toHaveBeenCalledWith(50)
  })

  it('loads an exact full inventory option by id with cancellation', async () => {
    const builder = createQueryBuilder()
    const signal = new AbortController().signal
    const exactOption = {
      id: 'raw-over-1000',
      model: 'M1001',
      specification: '12mm',
      quantity: 321,
    }
    builder.maybeSingle.mockResolvedValue({ data: exactOption, error: null })
    fromMock.mockReturnValue(builder)

    await expect(
      getYoumaiRawMaterialInventoryOptionById(exactOption.id, signal),
    ).resolves.toEqual(exactOption)

    expect(fromMock).toHaveBeenCalledWith('youmai_raw_material_inventory')
    expect(builder.select).toHaveBeenCalledWith(RAW_MATERIAL_OPTION_SELECT)
    expect(builder.eq).toHaveBeenCalledWith('id', exactOption.id)
    expect(builder.abortSignal).toHaveBeenCalledWith(signal)
    expect(builder.maybeSingle).toHaveBeenCalledOnce()
  })
})
