import { memo, useMemo } from 'react'
import { Table, Tag, type TableColumnsType } from 'antd'

import type { ToolingStockIn } from '@/services/apiToolingStockIn'

function formatNumber(value: number | null | undefined, digits = 3) {
  return Number(value ?? 0).toFixed(digits)
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
  const columns: TableColumnsType<ToolingStockIn> = useMemo(
    () => [
      {
        title: '#',
        key: '#',
        width: 60,
        fixed: 'left',
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 110,
        fixed: 'left',
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
      },
      {
        title: '刀具名称',
        dataIndex: 'tool_name',
        key: 'tool_name',
        width: 160,
      },
      {
        title: '刀具规格',
        dataIndex: 'tool_spec',
        key: 'tool_spec',
        width: 160,
      },
      {
        title: '材质',
        dataIndex: 'material',
        key: 'material',
        width: 140,
      },
      {
        title: '单价',
        dataIndex: 'unit_price',
        key: 'unit_price',
        width: 120,
        render: (value: number) => Number(value ?? 0).toFixed(2),
      },
      {
        title: '入库数量',
        dataIndex: 'stock_in_quantity',
        key: 'stock_in_quantity',
        width: 120,
        render: (value: number) => formatNumber(value),
      },
      {
        title: '备注',
        dataIndex: 'remarks',
        key: 'remarks',
        width: 240,
        render: (value: string | null | undefined) => value || '-',
      },
      {
        title: '更新时间',
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 180,
        render: (value: string) =>
          value ? new Date(value).toLocaleString('zh-CN') : '-',
      },
    ],
    [page, pageSize],
  )

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
