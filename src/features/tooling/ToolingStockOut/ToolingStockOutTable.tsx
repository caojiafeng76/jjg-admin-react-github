import { useMemo } from 'react'
import { Table, Tag, type TableColumnsType } from 'antd'

import type { ToolingStockOut } from '@/services/apiToolingStockOut'

function formatNumber(value: number | null | undefined, digits = 3) {
  return Number(value ?? 0).toFixed(digits)
}

interface Props {
  loading: boolean
  data: ToolingStockOut[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
}

export default function ToolingStockOutTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
}: Props) {
  const columns: TableColumnsType<ToolingStockOut> = useMemo(
    () => [
      {
        title: '#',
        key: '#',
        width: 52,
        fixed: 'left',
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 90,
        fixed: 'left',
        render: (value: ToolingStockOut['status']) => (
          <Tag color={value === '已审核' ? 'success' : 'default'}>{value}</Tag>
        ),
      },
      {
        title: '出库日期',
        dataIndex: 'stock_out_date',
        key: 'stock_out_date',
        width: 118,
        fixed: 'left',
        render: (value: string) => value || '-',
      },
      {
        title: '领用人',
        dataIndex: 'recipient',
        key: 'recipient',
        width: 120,
      },
      {
        title: '用途',
        dataIndex: 'purpose',
        key: 'purpose',
        width: 180,
      },
      {
        title: '刀具编号',
        dataIndex: 'tool_code',
        key: 'tool_code',
        width: 150,
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
        width: 120,
      },
      {
        title: '出库数量',
        dataIndex: 'stock_out_quantity',
        key: 'stock_out_quantity',
        width: 110,
        render: (value: number) => formatNumber(value),
      },
      {
        title: '最终库存',
        dataIndex: 'final_stock',
        key: 'final_stock',
        width: 110,
        render: (value: number | null | undefined) =>
          value === null || value === undefined ? '-' : formatNumber(value),
      },
      {
        title: '备注',
        dataIndex: 'remarks',
        key: 'remarks',
        width: 220,
        render: (value: string | null | undefined) => value || '-',
      },
      {
        title: '更新时间',
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 170,
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
    <Table<ToolingStockOut>
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      pagination={false}
      scroll={{ x: 1860, y: scrollY }}
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
