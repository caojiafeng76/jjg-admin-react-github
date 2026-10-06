import { memo, useMemo } from 'react'
import { createKeyboardTableRowProps } from '@/utils/keyboardTableRow'
import { Table, type TableColumnsType } from 'antd'

import type { ToolingInventory } from '@/services/apiToolingInventory'
import { formatNumber } from '@/utils/format'
import { getFinalStockColorClass } from '../inventoryPresentation'

interface Props {
  loading: boolean
  data: ToolingInventory[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
}

function ToolingInventoryTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
}: Props) {
  const columns: TableColumnsType<ToolingInventory> = useMemo(
    () => [
      {
        title: '#',
        key: '#',
        width: 60,
        fixed: 'left',
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
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
        title: '待入库',
        dataIndex: 'pending_stock_in',
        key: 'pending_stock_in',
        width: 120,
        render: (value: number) => (
          <span className="text-slate-400 dark:text-slate-500">
            {formatNumber(value)}
          </span>
        ),
      },
      {
        title: '现有库存',
        dataIndex: 'current_stock',
        key: 'current_stock',
        width: 120,
        render: (value: number) => formatNumber(value),
      },
      {
        title: '待出库',
        dataIndex: 'pending_stock_out',
        key: 'pending_stock_out',
        width: 120,
        render: (value: number) => (
          <span className="text-slate-400 dark:text-slate-500">
            {formatNumber(value)}
          </span>
        ),
      },
      {
        title: '最终库存',
        dataIndex: 'final_stock',
        key: 'final_stock',
        width: 120,
        render: (value: number) => (
          <span className={`${getFinalStockColorClass(value)} font-medium`}>
            {formatNumber(value)}
          </span>
        ),
      },
      {
        title: '备注',
        dataIndex: 'remarks',
        key: 'remarks',
        width: 240,
        render: (value: string | null | undefined) => value || '-',
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 180,
        render: (value: string) =>
          value ? new Date(value).toLocaleString('zh-CN') : '-',
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
    <Table<ToolingInventory>
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      pagination={false}
      scroll={{ x: 1860, y: scrollY }}
      size="small"
      rowClassName={(_, index) =>
        index % 2 === 0
          ? 'bg-white dark:bg-slate-800'
          : 'bg-slate-50/60 dark:bg-slate-800/60'
      }
      onRow={(record) => ({
        ...createKeyboardTableRowProps(
          () => onSelect([record.id]),
          `选择刀具库存 ${record.tool_code || record.id}`,
        ),
        onClick: () => onSelect([record.id]),
        style: { cursor: 'pointer', height: rowHeight },
      })}
    />
  )
}

export default memo(ToolingInventoryTable)
