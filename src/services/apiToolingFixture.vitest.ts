import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}))

vi.mock('./supabase', () => ({
  default: { from: fromMock },
}))

import {
  createToolingFixturesBatch,
  getAllToolingFixtures,
  getToolingFixtureList,
  normalizeToolingFixtureFormValues,
} from './apiToolingFixture'

interface FixtureQueryBuilder {
  data: unknown[]
  error: null
  count: number
  select: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  or: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  gte: ReturnType<typeof vi.fn>
  lte: ReturnType<typeof vi.fn>
  lt: ReturnType<typeof vi.fn>
  abortSignal: ReturnType<typeof vi.fn>
  range: ReturnType<typeof vi.fn>
  in: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
}

function createFixtureQueryBuilder(): FixtureQueryBuilder {
  const builder = {
    data: [],
    error: null,
    count: 0,
    select: vi.fn(),
    order: vi.fn(),
    or: vi.fn(),
    eq: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
    lt: vi.fn(),
    abortSignal: vi.fn(),
    range: vi.fn(),
    in: vi.fn(),
    insert: vi.fn(),
  } as FixtureQueryBuilder

  builder.select.mockReturnValue(builder)
  builder.order.mockReturnValue(builder)
  builder.or.mockReturnValue(builder)
  builder.eq.mockReturnValue(builder)
  builder.gte.mockReturnValue(builder)
  builder.lte.mockReturnValue(builder)
  builder.lt.mockReturnValue(builder)
  builder.abortSignal.mockReturnValue(builder)
  builder.range.mockImplementation(() => ({
    data: builder.data,
    error: builder.error,
    count: builder.count,
  }))
  builder.in.mockImplementation(() => ({
    data: builder.data,
    error: builder.error,
  }))
  builder.insert.mockImplementation(() => ({
    data: null,
    error: builder.error,
  }))

  return builder
}

const completeValues = {
  fixture_no: '  JG-001  ',
  category: '  夹具 ',
  applicable_product_drawing_no: ' DWG-001 ',
  product_name: ' 扶梯踏板 ',
  applicable_equipment: ' 设备 A ',
  storage_location: ' 工装库 1 ',
  manufactured_date: '2026-08-01',
  manufacturer: ' 厂商 A ',
  lifecycle: '正常' as const,
  last_maintenance_date: '2026-08-02',
  maintenance_cycle_days: 30,
  responsible_person: ' 张三 ',
  remarks: ' 备注 ',
}

describe('normalizeToolingFixtureFormValues', () => {
  it('trims all fields and keeps the maintenance cycle in days', () => {
    expect(normalizeToolingFixtureFormValues(completeValues)).toEqual({
      fixture_no: 'JG-001',
      category: '夹具',
      applicable_product_drawing_no: 'DWG-001',
      product_name: '扶梯踏板',
      applicable_equipment: '设备 A',
      storage_location: '工装库 1',
      manufactured_date: '2026-08-01',
      manufacturer: '厂商 A',
      lifecycle: '正常',
      last_maintenance_date: '2026-08-02',
      maintenance_cycle_days: 30,
      responsible_person: '张三',
      remarks: '备注',
    })
  })

  it('rejects blank fixture numbers, invalid cycles, and invalid dates', () => {
    expect(() =>
      normalizeToolingFixtureFormValues({ ...completeValues, fixture_no: ' ' }),
    ).toThrow('请输入工装模具编号')
    expect(() =>
      normalizeToolingFixtureFormValues({
        ...completeValues,
        maintenance_cycle_days: 0,
      }),
    ).toThrow('保养周期必须是大于 0 的整数天数')
    expect(() =>
      normalizeToolingFixtureFormValues({
        ...completeValues,
        manufactured_date: 'bad-date',
      }),
    ).toThrow('制作日期格式无效')
  })
})

describe('getAllToolingFixtures', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches all fixtures across pages without filters', async () => {
    const builder = createFixtureQueryBuilder()
    fromMock.mockReturnValue(builder)
    builder.data = [
      {
        id: '1',
        qr_token: 'token-1',
        fixture_no: 'FIX-001',
        product_name: '产品一',
        status: '未使用',
        lifecycle: '正常',
      },
    ]
    builder.count = 1

    const items = await getAllToolingFixtures({})

    expect(fromMock).toHaveBeenCalledWith('tooling_fixtures')
    expect(builder.select).toHaveBeenCalledWith('*')
    expect(builder.or).not.toHaveBeenCalled()
    expect(builder.eq).not.toHaveBeenCalled()
    expect(builder.order.mock.calls).toEqual([
      ['updated_at', { ascending: false }],
      ['fixture_no', { ascending: true }],
    ])
    expect(builder.range).toHaveBeenCalledWith(0, 999)
    expect(items).toHaveLength(1)
    expect(items[0].fixture_no).toBe('FIX-001')
    expect(items[0].status).toBe('未使用')
  })

  it('applies keyword and status filters and forwards the abort signal', async () => {
    const builder = createFixtureQueryBuilder()
    fromMock.mockReturnValue(builder)
    builder.data = []
    builder.count = 0
    const signal = new AbortController().signal

    await getAllToolingFixtures({ keyword: '  FIX  ', status: '使用中', signal })

    expect(builder.or).toHaveBeenCalledWith(
      'fixture_no.ilike."%FIX%",category.ilike."%FIX%",applicable_product_drawing_no.ilike."%FIX%",product_name.ilike."%FIX%",applicable_equipment.ilike."%FIX%",storage_location.ilike."%FIX%",manufacturer.ilike."%FIX%",responsible_person.ilike."%FIX%"',
    )
    expect(builder.eq).toHaveBeenCalledWith('status', '使用中')
    expect(builder.abortSignal).toHaveBeenCalledWith(signal)
  })

  it('applies manufactured date range filters', async () => {
    const builder = createFixtureQueryBuilder()
    fromMock.mockReturnValue(builder)
    builder.data = []
    builder.count = 0

    await getAllToolingFixtures({
      manufacturedDateRange: { start: '2026-01-01', end: '2026-06-30' },
    })

    expect(builder.gte).toHaveBeenCalledWith('manufactured_date', '2026-01-01')
    expect(builder.lte).toHaveBeenCalledWith('manufactured_date', '2026-06-30')
  })

  it('applies updated date range filters', async () => {
    const builder = createFixtureQueryBuilder()
    fromMock.mockReturnValue(builder)
    builder.data = []
    builder.count = 0

    await getAllToolingFixtures({
      updatedDateRange: { start: '2026-07-01', end: '2026-07-31' },
    })

    expect(builder.gte).toHaveBeenCalledWith('updated_at', '2026-07-01')
    expect(builder.lt).toHaveBeenCalledWith('updated_at', '2026-08-01')
  })

  it('applies updated date range filters to paged fixture lists', async () => {
    const builder = createFixtureQueryBuilder()
    fromMock.mockReturnValue(builder)
    builder.data = []
    builder.count = 0

    await getToolingFixtureList({
      page: 1,
      pageSize: 10,
      updatedDateRange: { start: '2026-07-01', end: '2026-07-31' },
    })

    expect(builder.gte).toHaveBeenCalledWith('updated_at', '2026-07-01')
    expect(builder.lt).toHaveBeenCalledWith('updated_at', '2026-08-01')
  })

  it('keeps paginating until fewer than 1000 rows are returned', async () => {
    const builder = createFixtureQueryBuilder()
    fromMock.mockReturnValue(builder)
    const fullPage = Array.from({ length: 1000 }, (_, index) => ({
      id: String(index),
      qr_token: `token-${index}`,
      fixture_no: `FIX-${String(index).padStart(3, '0')}`,
      product_name: '产品',
      status: '未使用',
      lifecycle: '正常',
    }))
    // 第一页返回 1000 条（触发继续翻页），第二页返回 0 条（终止循环）
    builder.range.mockImplementation((from: number) => ({
      data: from === 0 ? fullPage : [],
      error: null,
      count: 1001,
    }))

    const items = await getAllToolingFixtures({})

    // 翻页两次：range(0,999) + range(1000,1999)
    expect(builder.range.mock.calls).toEqual([
      [0, 999],
      [1000, 1999],
    ])
    expect(items).toHaveLength(1000)
  })

  it('rejects rows with an invalid status or lifecycle', async () => {
    const builder = createFixtureQueryBuilder()
    fromMock.mockReturnValue(builder)
    builder.data = [
      {
        id: '1',
        fixture_no: 'FIX-001',
        status: '已作废',
        lifecycle: '正常',
      },
    ]
    builder.count = 1

    await expect(getAllToolingFixtures({})).rejects.toThrow(
      '工装状态无效，请联系管理员',
    )
  })
})

describe('createToolingFixturesBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('normalizes and inserts rows when no numbers already exist', async () => {
    const builder = createFixtureQueryBuilder()
    fromMock.mockReturnValue(builder)
    builder.data = []

    await createToolingFixturesBatch([
      completeValues,
      { ...completeValues, fixture_no: '  JG-002  ', manufactured_date: null },
    ])

    expect(fromMock).toHaveBeenCalledWith('tooling_fixtures')
    expect(builder.select).toHaveBeenCalledWith('fixture_no')
    expect(builder.in).toHaveBeenCalledWith('fixture_no', ['JG-001', 'JG-002'])
    expect(builder.insert).toHaveBeenCalledWith([
      expect.objectContaining({ fixture_no: 'JG-001' }),
      expect.objectContaining({ fixture_no: 'JG-002', manufactured_date: null }),
    ])
  })

  it('rejects duplicate numbers inside the batch', async () => {
    const builder = createFixtureQueryBuilder()
    fromMock.mockReturnValue(builder)

    await expect(
      createToolingFixturesBatch([
        completeValues,
        { ...completeValues, fixture_no: '  JG-001  ' },
      ]),
    ).rejects.toThrow('Excel 中存在重复工装模具编号“JG-001”')
    expect(builder.insert).not.toHaveBeenCalled()
  })

  it('rejects numbers that already exist in the database', async () => {
    const builder = createFixtureQueryBuilder()
    fromMock.mockReturnValue(builder)
    builder.data = [{ fixture_no: 'JG-001' }]

    await expect(
      createToolingFixturesBatch([completeValues]),
    ).rejects.toThrow('以下工装模具编号已存在，无法导入：JG-001')
    expect(builder.insert).not.toHaveBeenCalled()
  })

  it('rejects empty batches', async () => {
    await expect(createToolingFixturesBatch([])).rejects.toThrow(
      '请选择至少一条工装资料',
    )
  })
})
