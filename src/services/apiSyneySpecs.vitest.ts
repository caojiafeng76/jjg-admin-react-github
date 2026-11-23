import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getSyneySpecs, updateSyneySpec } from './apiSyneySpecs'

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
}))

vi.mock('./supabase', () => ({ default: supabaseMock }))

function createChainQuery() {
  const query = {
    select: vi.fn(),
    update: vi.fn(),
    ilike: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    abortSignal: vi.fn(),
    single: vi.fn(),
  }

  query.select.mockReturnValue(query)
  query.update.mockReturnValue(query)
  query.ilike.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.order.mockReturnValue(query)
  query.range.mockReturnValue(query)
  query.abortSignal.mockReturnValue(query)

  return query
}

describe('apiSyneySpecs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updateSyneySpec 优先按主键 id 更新并剔除 payload 中的 id', async () => {
    const query = createChainQuery()
    const updatedRow = {
      id: 7,
      PartNo: 'XN2808EB',
      PartName: '前沿板',
      Spec: '1000型',
      ParamSpec: '1525*550',
      Unit: '件',
    }
    query.single.mockResolvedValue({ data: updatedRow, error: null })
    supabaseMock.from.mockReturnValue(query)

    await expect(
      updateSyneySpec({
        id: 7,
        PartNo: 'XN2808EB',
        PartName: '前沿板',
        ParamSpec: '1525*550',
      }),
    ).resolves.toEqual(updatedRow)

    expect(query.update).toHaveBeenCalledWith({
      PartNo: 'XN2808EB',
      PartName: '前沿板',
      ParamSpec: '1525*550',
    })
    expect(query.eq).toHaveBeenCalledWith('id', 7)
  })

  it('updateSyneySpec 在未传 id 时兼容按 PartNo 更新', async () => {
    const query = createChainQuery()
    query.single.mockResolvedValue({ data: { PartNo: 'XN2808EB' }, error: null })
    supabaseMock.from.mockReturnValue(query)

    await updateSyneySpec({
      PartNo: 'XN2808EB',
      ParamSpec: '1600*550',
    })

    expect(query.update).toHaveBeenCalledWith({
      PartNo: 'XN2808EB',
      ParamSpec: '1600*550',
    })
    expect(query.eq).toHaveBeenCalledWith('PartNo', 'XN2808EB')
  })

  it('updateSyneySpec 缺少 id 与 PartNo 时抛出明确错误', async () => {
    await expect(updateSyneySpec({ ParamSpec: '1600*550' })).rejects.toThrow(
      '踏板规格更新缺少 id 或件号',
    )
    expect(supabaseMock.from).not.toHaveBeenCalled()
  })

  it('getSyneySpecs 在分页与全量模式下都传递 AbortSignal 且全量分支不预建多余查询', async () => {
    const pagedSignal = new AbortController().signal
    const pagedQuery = Object.assign(createChainQuery(), {
      then: (resolve: (value: unknown) => void) =>
        Promise.resolve({ data: [], count: 0, error: null }).then(resolve),
    })
    supabaseMock.from.mockReturnValueOnce(pagedQuery)

    await getSyneySpecs({
      PartNo: 'XN2808',
      page: 2,
      pageSize: 20,
      isAll: false,
      signal: pagedSignal,
    })

    expect(supabaseMock.from).toHaveBeenCalledTimes(1)
    expect(pagedQuery.ilike).toHaveBeenCalledWith('PartNo', '%XN2808%')
    expect(pagedQuery.range).toHaveBeenCalledWith(20, 39)
    expect(pagedQuery.abortSignal).toHaveBeenCalledWith(pagedSignal)

    vi.clearAllMocks()
    const allSignal = new AbortController().signal
    const allQuery = Object.assign(createChainQuery(), {
      then: (resolve: (value: unknown) => void) =>
        Promise.resolve({ data: [{ id: 1 }], count: 1, error: null }).then(resolve),
    })
    supabaseMock.from.mockReturnValueOnce(allQuery)

    const result = await getSyneySpecs({
      PartNo: '',
      page: 1,
      pageSize: 10,
      isAll: true,
      signal: allSignal,
    })

    expect(supabaseMock.from).toHaveBeenCalledTimes(1)
    expect(allQuery.range).toHaveBeenCalledWith(0, 999)
    expect(allQuery.abortSignal).toHaveBeenCalledWith(allSignal)
    expect(result).toEqual({ syneySpecs: [{ id: 1 }], count: 1 })
  })
})
