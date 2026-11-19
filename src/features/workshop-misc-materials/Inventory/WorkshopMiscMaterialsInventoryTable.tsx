import type { TableColumnsType } from 'antd'
import type { WorkshopMiscMaterialsInventory } from '@/services/apiWorkshopMiscMaterialsInventory'
import { Table } from 'antd'
import { useMemo } from 'react'

import { TableEmpty } from '@/ui/TableState'
import { zebraRowClassName } from '@/ui/tableStyles'
import { formatDateTime } from '@/utils/format'
import { createKeyboardTableRowProps } from '@/utils/keyboardTableRow'
import { formatQuantity, renderText } from '../display'

export interface WorkshopMiscMaterialsInventoryTableProps {
  loading: boolean
  data: WorkshopMiscMaterialsInventory[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
}

export default function WorkshopMiscMaterialsInventoryTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
}: WorkshopMiscMaterialsInventoryTableProps) {
  const columns: TableColumnsType<WorkshopMiscMaterialsInventory> = useMemo(
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
        key: 'model',
        width: 160,
        fixed: 'left',
      },
      {
        title: '客户型号',
        dataIndex: 'customer_model',
        key: 'customer_model',
        width: 160,
        render: renderText,
      },
      {
        title: '规格',
        dataIndex: 'specification',
        key: 'specification',
        width: 160,
        render: renderText,
      },
      {
        title: '原材料数量',
        dataIndex: 'raw_material_quantity',
        key: 'raw_material_quantity',
        width: 110,
        align: 'right',
        render: (value: number) => (
          <span className="tabular-nums">{formatQuantity(value)}</span>
        ),
      },
      {
        title: '半成品数量',
        dataIndex: 'semi_finished_quantity',
        key: 'semi_finished_quantity',
        width: 110,
        align: 'right',
        render: (value: number) => (
          <span className="tabular-nums">{formatQuantity(value)}</span>
        ),
      },
      {
        title: '成品数量',
        dataIndex: 'finished_quantity',
        key: 'finished_quantity',
        width: 100,
        align: 'right',
        render: (value: number) => (
          <span className="tabular-nums">{formatQuantity(value)}</span>
        ),
      },
      {
        title: '合计',
        dataIndex: 'total_quantity',
        key: 'total_quantity',
        width: 100,
        align: 'right',
        render: (value: number) => (
          <span className="font-semibold text-slate-900 tabular-nums dark:text-slate-100">
            {formatQuantity(value)}
          </span>
        ),
      },
      {
        title: '类别',
        dataIndex: 'category',
        key: 'category',
        width: 120,
        render: renderText,
      },
      {
        title: '备注',
        dataIndex: 'remarks',
        key: 'remarks',
        width: 220,
        ellipsis: true,
        render: renderText,
      },
      {
        title: '更新时间',
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 170,
        render: value => formatDateTime(value),
      },
    ],
    [page, pageSize],
  )

  return (
    <Table<WorkshopMiscMaterialsInventory>
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={{ type: 'radio', selectedRowKeys, onChange: onSelect }}
      pagination={false}
      scroll={data.length > 0 ? { x: 1470, y: scrollY } : { x: 1470 }}
      size="small"
      locale={{
        emptyText: (
          <TableEmpty
            title="暂无材料库存"
            description="库存行随材料资料自动生成，请先维护材料资料"
          />
        ),
      }}
      rowClassName={zebraRowClassName}
      onRow={record => ({
        ...createKeyboardTableRowProps(
          () => onSelect([record.id]),
          `选择材料库存 ${record.model}`,
        ),
        onClick: () => onSelect([record.id]),
        style: { cursor: 'pointer', height: rowHeight },
      })}
    />
  )
}
