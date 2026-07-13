import { beforeEach, describe, expect, it, vi } from 'vitest'

interface SyneyPoFixture {
  BorderMaterial: string | null
  Brand: string | null
  created_at: string
  EndDate: string | null
  id: number
  No: string | null
  Qty: number | null
  Remark: string | null
  SerialNo: number | null
  SONo: string | null
  Spec: string | null
  Status: string | null
  Technique: string | null
}

const requests = vi.hoisted(() => ({
  urls: [] as string[],
  signals: [] as Array<AbortSignal | null | undefined>,
  sourceRows: [] as SyneyPoFixture[],
  sortRows: undefined as
    | ((rows: SyneyPoFixture[], order: string) => SyneyPoFixture[])
    | undefined,
}))

vi.mock('./supabase', async () => {
  const { createClient } = await import('@supabase/supabase-js')
  const client = createClient(
    'https://example.supabase.co',
    'sb_publishable_test',
    {
      global: {
        fetch: async (input, init) => {
          const url = new URL(String(input))
          const offset = Number(url.searchParams.get('offset') ?? 0)
          const limit = Number(url.searchParams.get('limit') ?? 1000)
          const statusFilter = url.searchParams
            .get('Status')
            ?.replace(/^eq\./, '')
          const endDateFilters = url.searchParams.getAll('EndDate')
          const sonoFilter = url.searchParams
            .get('SONo')
            ?.replace(/^ilike\.%/, '')
            .replace(/%$/, '')

          let rows = requests.sourceRows.filter((row) => {
            if (statusFilter && row.Status !== statusFilter) return false

            for (const filter of endDateFilters) {
              const [operator, date] = filter.split('.', 2)
              if (!row.EndDate) return false
              if (operator === 'gte' && row.EndDate < date) return false
              if (operator === 'lte' && row.EndDate > date) return false
            }

            return !sonoFilter || row.SONo?.includes(sonoFilter) === true
          })

          const order = url.searchParams.get('order') ?? ''
          rows = requests.sortRows?.([...rows], order) ?? rows
          const pageRows = rows.slice(offset, offset + limit)
          const contentRange = pageRows.length
            ? `${offset}-${offset + pageRows.length - 1}/${rows.length}`
            : `*/${rows.length}`

          requests.urls.push(url.toString())
          requests.signals.push(init?.signal)

          return new Response(JSON.stringify(pageRows), {
            status: 200,
            headers: {
              'content-range': contentRange,
              'content-type': 'application/json',
            },
          })
        },
      },
    },
  )

  return { default: client }
})

import { getSyneyPos } from './apiSyneyPos'

const EXPECTED_NATURAL_ORDER =
  'status_sort_weight.asc,end_date_sort_key.asc,' +
  'no_natural_sort_key.asc,sono_natural_sort_key.asc,id.asc'
const naturalCollator = new Intl.Collator('zh-CN', { numeric: true })

function createPo(
  id: number,
  overrides: Partial<SyneyPoFixture> = {},
): SyneyPoFixture {
  return {
    BorderMaterial: '标准',
    Brand: null,
    created_at: '2026-07-13T00:00:00Z',
    EndDate: '2026-08-01',
    id,
    No: `PO-${id}`,
    Qty: id,
    Remark: null,
    SerialNo: id,
    SONo: `SO-${id}`,
    Spec: null,
    Status: '已创建',
    Technique: null,
    ...overrides,
  }
}

function statusWeight(status: string | null): number {
  if (status === '已创建') return 1
  if (status === '部分入库' || status === '部分送货') return 2
  if (status === '已入库') return 3
  return 4
}

function endDateSortKey(row: SyneyPoFixture): number {
  if (!row.EndDate) {
    return row.Status === '已入库' ? 2147483647 : 0
  }

  const dateKey = Number(row.EndDate.replaceAll('-', ''))
  return row.Status === '已入库' ? -dateKey : dateKey
}

function compareNaturalRows(a: SyneyPoFixture, b: SyneyPoFixture): number {
  return (
    statusWeight(a.Status) - statusWeight(b.Status) ||
    endDateSortKey(a) - endDateSortKey(b) ||
    naturalCollator.compare(a.No ?? '', b.No ?? '') ||
    naturalCollator.compare(a.SONo ?? '', b.SONo ?? '') ||
    a.id - b.id
  )
}

function compareLexicalRows(a: SyneyPoFixture, b: SyneyPoFixture): number {
  return (
    statusWeight(a.Status) - statusWeight(b.Status) ||
    endDateSortKey(a) - endDateSortKey(b) ||
    (a.No ?? '').localeCompare(b.No ?? '', 'zh-CN') ||
    (a.SONo ?? '').localeCompare(b.SONo ?? '', 'zh-CN') ||
    a.id - b.id
  )
}

function createConflictingRows(count: number): SyneyPoFixture[] {
  const statuses = ['已创建', '部分送货', '已入库', '暂停']
  const dates = [null, '2026-07-01', '2026-07-02', '2026-08-10']
  const rows = Array.from({ length: count }, (_, index) =>
    createPo(index + 1, {
      EndDate: dates[Math.floor(index / statuses.length) % dates.length],
      No: index % 43 === 0 ? null : `PO-${(index % 24) + 1}`,
      SONo: index % 47 === 0 ? null : `SO-${(Math.floor(index / 6) % 18) + 1}`,
      Status: statuses[index % statuses.length],
    }),
  )

  for (let index = rows.length - 1; index > 0; index -= 1) {
    const swapIndex = (index * 37 + 17) % (index + 1)
    const current = rows[index]
    rows[index] = rows[swapIndex]
    rows[swapIndex] = current
  }

  return rows
}

describe('getSyneyPos', () => {
  beforeEach(() => {
    requests.urls.length = 0
    requests.signals.length = 0
    requests.sourceRows = []
    requests.sortRows = (rows, order) =>
      rows.sort(
        order === EXPECTED_NATURAL_ORDER
          ? compareNaturalRows
          : compareLexicalRows,
      )
  })

  it('queries page 21 with natural stable ordering, filters, count, and signal', async () => {
    const controller = new AbortController()
    requests.sourceRows = Array.from({ length: 1100 }, (_, index) =>
      createPo(index + 1, {
        EndDate: '2026-07-15',
        Status: '已创建',
      }),
    )

    const result = await getSyneyPos({
      page: 21,
      pageSize: 50,
      Status: '已创建',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      SONo: 'SO-',
      signal: controller.signal,
    })

    const url = new URL(requests.urls[0])
    expect(url.pathname).toBe('/rest/v1/syney_pos_sorted')
    expect(url.searchParams.get('select')).toBe(
      'id,No,SONo,Spec,EndDate,Status,Qty,Brand,Technique,SerialNo,Remark,BorderMaterial,created_at',
    )
    expect(url.searchParams.get('select')).not.toContain('natural_sort_key')
    expect(url.searchParams.get('order')).toBe(EXPECTED_NATURAL_ORDER)
    expect(url.searchParams.getAll('EndDate')).toEqual([
      'gte.2026-07-01',
      'lte.2026-07-31',
    ])
    expect(url.searchParams.get('Status')).toBe('eq.已创建')
    expect(url.searchParams.get('SONo')).toBe('ilike.%SO-%')
    expect(url.searchParams.get('offset')).toBe('1000')
    expect(url.searchParams.get('limit')).toBe('50')
    expect(requests.signals).toEqual([controller.signal])
    expect(result.count).toBe(1100)
    expect(result.syneyPos).toHaveLength(50)
  })

  it('sorts natural order so PO-2 precedes PO-10', async () => {
    requests.sourceRows = [
      createPo(10, { No: 'PO-10', SONo: 'SO-1' }),
      createPo(2, { No: 'PO-2', SONo: 'SO-1' }),
    ]

    const result = await getSyneyPos({
      page: 1,
      pageSize: 50,
      Status: '全部',
    })

    expect(result.syneyPos.map((po) => po.No)).toEqual(['PO-2', 'PO-10'])
  })

  it('paginates 1050 conflicting shuffled rows without duplicates or gaps', async () => {
    requests.sourceRows = createConflictingRows(1050)
    const expectedIds = [...requests.sourceRows]
      .sort(compareNaturalRows)
      .map((row) => row.id)

    expect(new Set(requests.sourceRows.map((row) => row.Status)).size).toBe(4)
    expect(new Set(requests.sourceRows.map((row) => row.EndDate)).size).toBe(4)
    expect(new Set(requests.sourceRows.map((row) => row.No)).size).toBeLessThan(
      1050,
    )
    expect(
      new Set(requests.sourceRows.map((row) => row.SONo)).size,
    ).toBeLessThan(1050)

    const pages = await Promise.all(
      Array.from({ length: 21 }, (_, index) =>
        getSyneyPos({
          page: index + 1,
          pageSize: 50,
          Status: '全部',
        }),
      ),
    )
    const actualIds = pages.flatMap(({ syneyPos }) =>
      syneyPos.map((row) => row.id),
    )

    expect(actualIds).toEqual(expectedIds)
    expect(actualIds).toHaveLength(1050)
    expect(new Set(actualIds)).toHaveLength(1050)
    expect(
      requests.urls.map((url) => new URL(url).searchParams.get('offset')),
    ).toEqual(Array.from({ length: 21 }, (_, index) => String(index * 50)))
  })
})
