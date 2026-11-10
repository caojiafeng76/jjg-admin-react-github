import type { TableColumnsType } from 'antd'
import type {
  SyneyMaterialsStockDirection,
  SyneyMaterialsStockRecord,
} from '@/services/apiSyneyMaterialsStock'
import { Table } from 'antd'
import { useMemo } from 'react'

import { SYNEY_MATERIALS_STOCK_LABELS } from '@/services/apiSyneyMaterialsStock'
import { TableEmpty } from '@/ui/TableState'
import { createKeyboardTableRowProps } from '@/utils/keyboardTableRow'
import { formatDateTime, renderText, zebraRowClassName } from '../display'

export interface SyneyMaterialsStockTableProps {
  direction: SyneyMaterialsStockDirection
  data: SyneyMaterialsStockRecord[]
  loading: boolean
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY: number
  rowHeight: number
  emptyAction?: React.ReactNode
}

export default function SyneyMaterialsStockTable({
  direction,
  data,
  loading,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
  scrollY,
  rowHeight,
  emptyAction,
}: SyneyMaterialsStockTableProps) {
  const label = SYNEY_MATERIALS_STOCK_LABELS[direction]

  const columns: TableColumnsType<SyneyMaterialsStockRecord> = useMemo(
    () => [
      {
        title: '#',
        key: '#',
        width: 60,
        fixed: 'left',
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '品名',
        dataIndex: 'material_name',
        width: 200,
        fixed: 'left',
      },
      {
        title: '规格',
        dataIndex: 'specification',
        width: 160,
        render: renderText,
      },
      {
        title: '单位',
        dataIndex: 'unit',
        width: 80,
        render: renderText,
      },
      {
        title: `${label}数量`,
        dataIndex: 'quantity',
        width: 110,
        align: 'right',
        render: (value: number) =>
          direction === 'in'
            ? <span className="font-medium text-green-600 tabular-nums">+{value}</span>
            : <span className="font-medium text-red-500 tabular-nums">-{value}</span>,
      },
      {
        title: '备注',
        dataIndex: 'remarks',
        width: 240,
        ellipsis: true,
        render: renderText,
      },
      {
        title: `${label}时间`,
        dataIndex: 'created_at',
        width: 180,
        render: formatDateTime,
      },
    ],
    [direction, label, page, pageSize],
  )

  return (
    <Table<SyneyMaterialsStockRecord>
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={{ type: 'radio', selectedRowKeys, onChange: onSelect }}
      pagination={false}
      scroll={{ x: 1030, y: scrollY }}
      size="small"
      locale={{
        emptyText: (
          <TableEmpty
            title={`暂无材料${label}记录`}
            description={`点击下方按钮创建第一条材料${label}`}
            action={emptyAction}
          />
        ),
      }}
      rowClassName={zebraRowClassName}
      onRow={record => ({
        ...createKeyboardTableRowProps(
          () => onSelect([record.id]),
          `选择${label}记录 ${record.material_name}`,
        ),
        onClick: () => onSelect([record.id]),
        style: { cursor: 'pointer', height: rowHeight },
      })}
    />
  )
}
