import { memo, useMemo } from 'react'
import { Table, Tag, type TableColumnsType } from 'antd'

import type { ToolingStockIn } from '@/services/apiToolingStockIn'

type FilterValue = string | number

function formatNumber(value: number | null | undefined, digits = 3) {
  return Number(value ?? 0).toFixed(digits)
}

function formatDateTime(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-'
}

function compareText(
  left: string | number | null | undefined,
  right: string | number | null | undefined,
) {
  return String(left ?? '').localeCompare(String(right ?? ''), 'zh-CN', {
    numeric: true,
  })
}

function compareNumber(
  left: number | null | undefined,
  right: number | null | undefined,
) {
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
) {
  return String(recordValue ?? '') === String(value)
}

interface Props {
  loading: boolean
  data: ToolingStockIn[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
}

function ToolingStockInTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
}: Props) {
  const columns: TableColumnsType<ToolingStockIn> = useMemo(() => {
    const getRowNumber = (record: ToolingStockIn) => {
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
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 110,
        fixed: 'left',
        sorter: (a, b) => compareText(a.status, b.status),
        filters: [
          { text: '待审核', value: '待审核' },
          { text: '已审核', value: '已审核' },
        ],
        onFilter: (value, record) => record.status === value,
        render: (value: ToolingStockIn['status']) => (
          <Tag color={value === '已审核' ? 'success' : 'default'}>{value}</Tag>
        ),
      },
      {
        title: '刀具编号',
        dataIndex: 'tool_code',
        key: 'tool_code',
        width: 160,
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
        width: 160,
        sorter: (a, b) => compareText(a.tool_name, b.tool_name),
        filters: uniqueFilters(data.map((record) => record.tool_name)),
        filterSearch: true,
        onFilter: (value, record) => matchesFilter(value, record.tool_name),
      },
      {
        title: '刀具规格',
        dataIndex: 'tool_spec',
        key: 'tool_spec',
        width: 160,
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
        title: '单价',
        dataIndex: 'unit_price',
        key: 'unit_price',
        width: 120,
        sorter: (a, b) => compareNumber(a.unit_price, b.unit_price),
        filters: uniqueFilters(
          data.map((record) => record.unit_price),
          (value) => Number(value ?? 0).toFixed(2),
        ),
        onFilter: (value, record) => matchesFilter(value, record.unit_price),
        render: (value: number) => Number(value ?? 0).toFixed(2),
      },
      {
        title: '入库数量',
        dataIndex: 'stock_in_quantity',
        key: 'stock_in_quantity',
        width: 120,
        sorter: (a, b) =>
          compareNumber(a.stock_in_quantity, b.stock_in_quantity),
        filters: uniqueFilters(
          data.map((record) => record.stock_in_quantity),
          (value) => formatNumber(Number(value)),
        ),
        onFilter: (value, record) =>
          matchesFilter(value, record.stock_in_quantity),
        render: (value: number) => formatNumber(value),
      },
      {
        title: '备注',
        dataIndex: 'remarks',
        key: 'remarks',
        width: 240,
        sorter: (a, b) => compareText(a.remarks, b.remarks),
        filters: uniqueFilters(data.map((record) => record.remarks)),
        filterSearch: true,
        onFilter: (value, record) => matchesFilter(value, record.remarks),
        render: (value: string | null | undefined) => value || '-',
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
    <Table<ToolingStockIn>
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      pagination={false}
      scroll={{ x: 1570, y: scrollY }}
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

export default memo(ToolingStockInTable)
