import type { TableColumnsType } from 'antd'
import type {
  WorkshopMiscMaterialsStockDirection,
  WorkshopMiscMaterialsStockRecord,
} from '@/services/apiWorkshopMiscMaterialsStock'
import { Table } from 'antd'
import { useMemo } from 'react'

import { WORKSHOP_MISC_MATERIALS_STOCK_LABELS } from '@/services/apiWorkshopMiscMaterialsStock'
import { TableEmpty } from '@/ui/TableState'
import { zebraRowClassName } from '@/ui/tableStyles'
import { formatDateTime } from '@/utils/format'
import { createKeyboardTableRowProps } from '@/utils/keyboardTableRow'
import { formatQuantity, renderText } from '../display'

export interface WorkshopMiscMaterialsStockTableProps {
  direction: WorkshopMiscMaterialsStockDirection
  data: WorkshopMiscMaterialsStockRecord[]
  loading: boolean
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY: number
  rowHeight: number
  emptyAction?: React.ReactNode
}

export default function WorkshopMiscMaterialsStockTable({
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
}: WorkshopMiscMaterialsStockTableProps) {
  const label = WORKSHOP_MISC_MATERIALS_STOCK_LABELS[direction]
  const sign = direction === 'in' ? '+' : '-'
  const qtyToneClass = direction === 'in' ? 'text-success' : 'text-error'

  const columns: TableColumnsType<WorkshopMiscMaterialsStockRecord> = useMemo(
    () => [
      {
        title: '#',
        key: '#',
        width: 60,
        fixed: 'left',
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '型号',
        dataIndex: 'model',
        width: 160,
        fixed: 'left',
      },
      {
        title: '客户型号',
        dataIndex: 'customer_model',
        width: 160,
        render: renderText,
      },
      {
        title: '规格',
        dataIndex: 'specification',
        width: 160,
        render: renderText,
      },
      {
        title: `原材料${label}`,
        dataIndex: 'raw_material_quantity',
        width: 105,
        align: 'right',
        render: (value: number) =>
          value > 0
            ? (
                <span className={`font-medium tabular-nums ${qtyToneClass}`}>
                  {sign}
                  {formatQuantity(value)}
                </span>
              )
            : (
                <span className="text-text-tertiary tabular-nums">0</span>
              ),
      },
      {
        title: `半成品${label}`,
        dataIndex: 'semi_finished_quantity',
        width: 105,
        align: 'right',
        render: (value: number) =>
          value > 0
            ? (
                <span className={`font-medium tabular-nums ${qtyToneClass}`}>
                  {sign}
                  {formatQuantity(value)}
                </span>
              )
            : (
                <span className="text-text-tertiary tabular-nums">0</span>
              ),
      },
      {
        title: `成品${label}`,
        dataIndex: 'finished_quantity',
        width: 100,
        align: 'right',
        render: (value: number) =>
          value > 0
            ? (
                <span className={`font-medium tabular-nums ${qtyToneClass}`}>
                  {sign}
                  {formatQuantity(value)}
                </span>
              )
            : (
                <span className="text-text-tertiary tabular-nums">0</span>
              ),
      },
      {
        title: '合计',
        dataIndex: 'total_quantity',
        width: 100,
        align: 'right',
        render: (value: number) => (
          <span className={`font-semibold tabular-nums ${qtyToneClass}`}>
            {sign}
            {formatQuantity(value)}
          </span>
        ),
      },
      {
        title: '类别',
        dataIndex: 'category',
        width: 120,
        render: renderText,
      },
      {
        title: '备注',
        dataIndex: 'remarks',
        width: 220,
        ellipsis: true,
        render: renderText,
      },
      {
        title: `${label}时间`,
        dataIndex: 'created_at',
        width: 170,
        render: value => formatDateTime(value),
      },
    ],
    [label, page, pageSize, qtyToneClass, sign],
  )

  return (
    <Table<WorkshopMiscMaterialsStockRecord>
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={{ type: 'radio', selectedRowKeys, onChange: onSelect }}
      pagination={false}
      scroll={data.length > 0 ? { x: 1460, y: scrollY } : { x: 1460 }}
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
          `选择${label}记录 ${record.model}`,
        ),
        onClick: () => onSelect([record.id]),
        style: { cursor: 'pointer', height: rowHeight },
      })}
    />
  )
}
