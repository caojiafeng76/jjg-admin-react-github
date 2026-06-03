import { render } from '@testing-library/react'
import type { TableColumnsType } from 'antd'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ToolingData } from '@/services/apiToolingData'

import ToolingDataTable from './ToolingDataTable'

type CapturedColumn = Record<string, unknown>

const capturedTable = vi.hoisted(() => ({
  columns: [] as CapturedColumn[],
}))

vi.mock('antd', () => ({
  Table: (props: { columns: TableColumnsType<ToolingData> }) => {
    capturedTable.columns = props.columns as CapturedColumn[]
    return null
  },
}))

function createRecord(overrides: Partial<ToolingData> = {}): ToolingData {
  return {
    id: 'tooling-data-1',
    tool_code: 'T001',
    tool_name: '铣刀',
    tool_spec: 'D10',
    material: '合金',
    unit_price: 12.5,
    usage: '精加工',
    remarks: '首批',
    created_at: '2026-05-01T00:00:00.000Z',
    updated_at: '2026-05-02T00:00:00.000Z',
    ...overrides,
  }
}

function getColumn(key: string): CapturedColumn {
  const column = capturedTable.columns.find((item) => item.key === key)

  if (!column) {
    throw new Error(`Missing column: ${key}`)
  }

  return column
}

describe('ToolingDataTable', () => {
  beforeEach(() => {
    capturedTable.columns = []
  })

  it('adds filters and sorters to every visible column', () => {
    const data = [
      createRecord(),
      createRecord({
        id: 'tooling-data-2',
        tool_code: 'T002',
        tool_name: '钻头',
        tool_spec: 'D6',
        material: '高速钢',
        unit_price: 9.8,
        usage: '钻孔',
        remarks: '补库',
        updated_at: '2026-05-03T00:00:00.000Z',
      }),
    ]

    render(
      <ToolingDataTable
        loading={false}
        data={data}
        selectedRowKeys={[]}
        onSelect={vi.fn()}
        page={1}
        pageSize={10}
      />,
    )

    expect(capturedTable.columns.map((column) => column.key)).toEqual([
      '#',
      'tool_code',
      'tool_name',
      'tool_spec',
      'material',
      'unit_price',
      'usage',
      'remarks',
      'updated_at',
    ])

    capturedTable.columns.forEach((column) => {
      expect(column.sorter).toBeDefined()
      expect(column.filters).toBeDefined()
      expect(column.onFilter).toBeDefined()
    })

    expect(getColumn('tool_code').filters).toEqual([
      { text: 'T001', value: 'T001' },
      { text: 'T002', value: 'T002' },
    ])
    expect(getColumn('tool_name').filters).toEqual([
      { text: '铣刀', value: '铣刀' },
      { text: '钻头', value: '钻头' },
    ])

    const unitPriceSorter = getColumn('unit_price').sorter as (
      left: ToolingData,
      right: ToolingData,
    ) => number
    expect(unitPriceSorter(data[0], data[1])).toBeCloseTo(2.7)
  })
})
