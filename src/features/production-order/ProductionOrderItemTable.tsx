import { useMemo } from 'react'
import { Table, TableColumnsType, Button, Popconfirm, Space } from 'antd'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/16/solid'

import type { ProductionOrderItem } from '@/services/apiProductionOrderItems'

interface Props {
  loading: boolean
  data: ProductionOrderItem[]
  onEdit: (item: ProductionOrderItem) => void
  onDelete: (ids: string[]) => void
  scrollY?: number
  showActions?: boolean
}

export default function ProductionOrderItemTable({
  loading,
  data,
  onEdit,
  onDelete,
  scrollY = 400,
  showActions = true,
}: Props) {
  const columns: TableColumnsType<ProductionOrderItem> = useMemo(
    () => [
      {
        title: '#',
        render: (_text, _record, index) => index + 1,
        fixed: 'left',
        key: '#',
        width: 50,
      },
      {
        title: '项目号',
        dataIndex: 'project_no',
        fixed: 'left',
        key: 'project_no',
        width: 120,
      },
      {
        title: '型号',
        dataIndex: 'product_model',
        key: 'product_model',
        width: 100,
      },
      {
        title: '长度(mm)',
        dataIndex: 'length_mm',
        key: 'length_mm',
        width: 100,
      },
      {
        title: '客户型号',
        dataIndex: 'customer_model',
        key: 'customer_model',
        width: 120,
      },
      {
        title: '工序',
        dataIndex: 'operation',
        key: 'operation',
        width: 100,
      },
      {
        title: '标准工时(秒)',
        dataIndex: 'standard_seconds',
        key: 'standard_seconds',
        width: 110,
      },
      {
        title: '合格数量',
        dataIndex: 'qualified_quantity',
        key: 'qualified_quantity',
        width: 90,
      },
      {
        title: '合格工时(h)',
        dataIndex: 'qualified_hours',
        key: 'qualified_hours',
        width: 100,
        render: (value: number | null) => value?.toFixed(2) || '-',
      },
      {
        title: '不良原因1',
        dataIndex: 'defect_reason_1',
        key: 'defect_reason_1',
        width: 90,
      },
      {
        title: '不良数量1',
        dataIndex: 'defect_quantity_1',
        key: 'defect_quantity_1',
        width: 90,
      },
      {
        title: '不良原因2',
        dataIndex: 'defect_reason_2',
        key: 'defect_reason_2',
        width: 90,
      },
      {
        title: '不良数量2',
        dataIndex: 'defect_quantity_2',
        key: 'defect_quantity_2',
        width: 90,
      },
      {
        title: '减分工时(h)',
        dataIndex: 'defect_hours',
        key: 'defect_hours',
        width: 100,
        render: (value: number | null) => value?.toFixed(2) || '-',
      },
      {
        title: '加分项(秒)',
        dataIndex: 'bonus_seconds',
        key: 'bonus_seconds',
        width: 90,
      },
      ...(showActions
        ? [
            {
              title: '操作',
              key: 'actions',
              fixed: 'right' as const,
              width: 100,
              render: (_text: unknown, record: ProductionOrderItem) => (
                <Space size="small">
                  <Button
                    type="text"
                    size="small"
                    icon={<PencilSquareIcon className="h-4 w-4" />}
                    onClick={() => onEdit(record)}
                  />
                  <Popconfirm
                    title="确定删除此工序明细吗？"
                    onConfirm={() => onDelete([record.id])}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<TrashIcon className="h-4 w-4" />}
                    />
                  </Popconfirm>
                </Space>
              ),
            },
          ]
        : []),
    ],
    [onEdit, onDelete, showActions],
  )

  return (
    <Table<ProductionOrderItem>
      rowKey={(record) => record.id}
      loading={loading}
      columns={columns}
      dataSource={data}
      scroll={{ y: scrollY, x: 1600 }}
      size="small"
      pagination={false}
      style={{ fontSize: '12px' }}
    />
  )
}
