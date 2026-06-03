import { memo, useMemo } from 'react'
import { Table, type TableColumnsType } from 'antd'

import type { ToolingData } from '@/services/apiToolingData'

type FilterValue = string | number

function formatAmount(value: number | null | undefined): string {
  return Number(value || 0).toFixed(2)
}

function formatDateTime(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString('zh-CN') : '-'
}

function compareText(
  left: string | number | null | undefined,
  right: string | number | null | undefined,
): number {
  return String(left ?? '').localeCompare(String(right ?? ''), 'zh-CN', {
    numeric: true,
  })
}

function compareNumber(
  left: number | null | undefined,
  right: number | null | undefined,
): number {
  return Number(left ?? 0) - Number(right ?? 0)
}

function uniqueFilters(
  values: (string | number | null | undefined)[],
  formatText: (value: FilterValue) => string = (value) => String(value),
): { text: string; value: FilterValue }[] {
  const set = new Set<FilterValue>()

  values.forEach((value) => {
    if (value !== null && value !== undefined && value !== '') {
      set.add(typeof value === 'number' ? value : String(value))
    }
  })

  return Array.from(set)
    .sort((left, right) => compareText(left, right))
    .map((value) => ({
      text: formatText(value),
      value,
    }))
}

function matchesFilter(
  value: React.Key | boolean,
  recordValue: string | number | null | undefined,
): boolean {
  return String(recordValue ?? '') === String(value)
}

interface Props {
  loading: boolean
  data: ToolingData[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
}

function ToolingDataTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
}: Props) {
  const columns: TableColumnsType<ToolingData> = useMemo(() => {
    const getRowNumber = (record: ToolingData): number => {
      const index = data.findIndex((item) => item.id === record.id)

      return index === -1 ? 0 : (page - 1) * pageSize + index + 1
    }

    return [
      {
        title: '#',
        key: '#',
        width: 60,
        fixed: 'left',
        sorter: (a, b) => getRowNumber(a) - getRowNumber(b),
        filters: data.map((record) => {
          const rowNumber = getRowNumber(record)

          return {
            text: String(rowNumber),
            value: rowNumber,
          }
        }),
        onFilter: (value, record) => getRowNumber(record) === Number(value),
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '刀具编号',
        dataIndex: 'tool_code',
        key: 'tool_code',
        width: 140,
        fixed: 'left',
        sorter: (a, b) => compareText(a.tool_code, b.tool_code),
        filters: uniqueFilters(data.map((record) => record.tool_code)),
        filterSearch: true,
        onFilter: (value, record) => matchesFilter(value, record.tool_code),
      },
      {
        title: '刀具名称',
        dataIndex: 'tool_name',
        key: 'tool_name',
        width: 180,
        sorter: (a, b) => compareText(a.tool_name, b.tool_name),
        filters: uniqueFilters(data.map((record) => record.tool_name)),
        filterSearch: true,
        onFilter: (value, record) => matchesFilter(value, record.tool_name),
      },
      {
        title: '刀具规格',
        dataIndex: 'tool_spec',
        key: 'tool_spec',
        width: 180,
        sorter: (a, b) => compareText(a.tool_spec, b.tool_spec),
        filters: uniqueFilters(data.map((record) => record.tool_spec)),
        filterSearch: true,
        onFilter: (value, record) => matchesFilter(value, record.tool_spec),
      },
      {
        title: '材质',
        dataIndex: 'material',
        key: 'material',
        width: 140,
        sorter: (a, b) => compareText(a.material, b.material),
        filters: uniqueFilters(data.map((record) => record.material)),
        filterSearch: true,
        onFilter: (value, record) => matchesFilter(value, record.material),
      },
      {
        title: '单价（元）',
        dataIndex: 'unit_price',
        key: 'unit_price',
        width: 120,
        sorter: (a, b) => compareNumber(a.unit_price, b.unit_price),
        filters: uniqueFilters(
          data.map((record) => record.unit_price),
          (value) => formatAmount(Number(value)),
        ),
        onFilter: (value, record) => matchesFilter(value, record.unit_price),
        render: (value: number) => formatAmount(value),
      },
      {
        title: '用途',
        dataIndex: 'usage',
        key: 'usage',
        width: 220,
        sorter: (a, b) => compareText(a.usage, b.usage),
        filters: uniqueFilters(data.map((record) => record.usage)),
        filterSearch: true,
        onFilter: (value, record) => matchesFilter(value, record.usage),
      },
      {
        title: '备注',
        dataIndex: 'remarks',
        key: 'remarks',
        width: 260,
        sorter: (a, b) => compareText(a.remarks, b.remarks),
        filters: uniqueFilters(data.map((record) => record.remarks)),
        filterSearch: true,
        onFilter: (value, record) => matchesFilter(value, record.remarks),
      },
      {
        title: '更新时间',
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 180,
        sorter: (a, b) => compareText(a.updated_at, b.updated_at),
        filters: uniqueFilters(
          data.map((record) => record.updated_at),
          (value) => formatDateTime(String(value)),
        ),
        filterSearch: true,
        onFilter: (value, record) => matchesFilter(value, record.updated_at),
        render: (value: string) => formatDateTime(value),
      },
    ]
  }, [data, page, pageSize])

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: (keys: React.Key[]) => onSelect(keys),
    }),
    [onSelect, selectedRowKeys],
  )

  return (
    <Table<ToolingData>
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      pagination={false}
      scroll={{ x: 1480, y: scrollY }}
      size="small"
      rowClassName={(_, index) =>
        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
      }
      onRow={(record) => ({
        onClick: () => onSelect([record.id]),
        style: { cursor: 'pointer', height: rowHeight },
      })}
    />
  )
}

export default memo(ToolingDataTable)
