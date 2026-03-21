import { useMemo } from 'react'
import {
  Table,
  TableColumnsType,
  TableProps,
  Button,
  Popconfirm,
  Space,
} from 'antd'
import { PencilSquareIcon, TrashIcon, EyeIcon } from '@heroicons/react/16/solid'

import type { ProductionOrder } from '@/services/apiProductionOrders'

interface Props {
  loading: boolean
  data: ProductionOrder[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  onView: (record: ProductionOrder) => void
  onEdit: (record: ProductionOrder) => void
  onDelete: (ids: string[]) => void
  scrollY?: number
}

export default function ProductionOrderList({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  onView,
  onEdit,
  onDelete,
  scrollY = 400,
}: Props) {
  const columns: TableColumnsType<ProductionOrder> = useMemo(
    () => [
      {
        title: '#',
        render: (_text, _record, index) => index + 1,
        fixed: 'left',
        key: '#',
        width: 50,
      },
      {
        title: '日期',
        dataIndex: 'order_date',
        fixed: 'left',
        key: 'order_date',
        width: 120,
      },
      {
        title: '操作人',
        key: 'employee',
        fixed: 'left',
        width: 120,
        render: (_text, record: ProductionOrder) =>
          (record as unknown as { employee?: { name: string } }).employee
            ?.name || '-',
      },
      {
        title: '出勤工时(h)',
        dataIndex: 'work_hours',
        key: 'work_hours',
        width: 110,
      },
      {
        title: '合格工时(h)',
        dataIndex: 'total_qualified_hours',
        key: 'total_qualified_hours',
        width: 120,
        render: (value: number | null) => value?.toFixed(2) || '-',
      },
      {
        title: '工时效率(%)',
        dataIndex: 'efficiency',
        key: 'efficiency',
        width: 110,
        render: (value: number | null) =>
          value ? (value * 100).toFixed(2) : '-',
      },

      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        ellipsis: true,
        width: 150,
      },
      {
        title: '操作',
        key: 'actions',
        fixed: 'right',
        width: 150,
        render: (_text, record: ProductionOrder) => (
          <Space size="small">
            <Button
              type="text"
              size="small"
              icon={<EyeIcon className="h-4 w-4" />}
              onClick={() => onView(record)}
              title="查看"
            />
            <Button
              type="text"
              size="small"
              icon={<PencilSquareIcon className="h-4 w-4" />}
              onClick={() => onEdit(record)}
              title="编辑"
            />
            <Popconfirm
              title="确定删除此生产工单吗？"
              onConfirm={() => onDelete([record.id])}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<TrashIcon className="h-4 w-4" />}
                title="删除"
              />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [onView, onEdit, onDelete],
  )

  const rowSelection: TableProps<ProductionOrder>['rowSelection'] = {
    selectedRowKeys,
    onChange: onSelect,
    preserveSelectedRowKeys: true,
  }

  return (
    <Table<ProductionOrder>
      rowKey={(record) => record.id}
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      scroll={{ y: scrollY }}
      size="small"
      pagination={false}
      style={{ fontSize: '12px' }}
    />
  )
}
