import { render } from '@testing-library/react'
import type { TableColumnsType } from 'antd'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ToolingStockIn } from '@/services/apiToolingStockIn'

import ToolingStockInTable from './ToolingStockInTable'

type CapturedColumn = Record<string, unknown>

const capturedTable = vi.hoisted(() => ({
  columns: [] as CapturedColumn[],
}))

vi.mock('antd', () => ({
  Table: (props: { columns: TableColumnsType<ToolingStockIn> }) => {
    capturedTable.columns = props.columns as CapturedColumn[]
    return null
  },
  Tag: () => null,
}))

function createRecord(overrides: Partial<ToolingStockIn> = {}): ToolingStockIn {
  return {
    id: 'stock-in-1',
    tooling_data_id: 'tooling-data-1',
    tool_code: 'T001',
    tool_name: '铣刀',
    tool_spec: 'D10',
    material: '合金',
    unit_price: 12.5,
    status: '待审核',
    stock_in_quantity: 3,
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

describe('ToolingStockInTable', () => {
  beforeEach(() => {
    capturedTable.columns = []
  })

  it('adds filters and sorters to every visible column', () => {
    const data = [
      createRecord(),
      createRecord({
        id: 'stock-in-2',
        tool_code: 'T002',
        tool_name: '钻头',
        tool_spec: 'D6',
        material: '高速钢',
        unit_price: 9.8,
        status: '已审核',
        stock_in_quantity: 1,
        remarks: '补库',
        updated_at: '2026-05-03T00:00:00.000Z',
      }),
    ]

    render(
      <ToolingStockInTable
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
      'status',
      'tool_code',
      'tool_name',
      'tool_spec',
      'material',
      'unit_price',
      'stock_in_quantity',
      'remarks',
      'updated_at',
    ])

    capturedTable.columns.forEach((column) => {
      expect(column.sorter).toBeDefined()
      expect(column.filters).toBeDefined()
      expect(column.onFilter).toBeDefined()
    })

    expect(getColumn('status').filters).toEqual([
      { text: '待审核', value: '待审核' },
      { text: '已审核', value: '已审核' },
    ])
    expect(getColumn('tool_code').filters).toEqual([
      { text: 'T001', value: 'T001' },
      { text: 'T002', value: 'T002' },
    ])

    const quantitySorter = getColumn('stock_in_quantity').sorter as (
      left: ToolingStockIn,
      right: ToolingStockIn,
    ) => number
    expect(quantitySorter(data[0], data[1])).toBe(2)
  })
})
