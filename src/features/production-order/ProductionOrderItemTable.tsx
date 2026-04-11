import { useMemo } from 'react'
import { Table, TableColumnsType, Button, Popconfirm, Space } from 'antd'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/16/solid'

import type {
  ProductionOrderItem,
  ProductionOrderItemWithMachine,
} from '@/services/apiProductionOrderItems'

const dangerTextStyle = {
  color: '#cf1322',
  fontWeight: 600,
}

interface Props {
  loading: boolean
  data: ProductionOrderItemWithMachine[]
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
  const columns: TableColumnsType<ProductionOrderItemWithMachine> = useMemo(
    () => [
      {
        title: '#',
        render: (_text, _record, index) => index + 1,
        fixed: 'left',
        key: '#',
        width: 50,
      },
      {
        title: '数据类别',
        dataIndex: 'data_category',
        fixed: 'left',
        key: 'data_category',
        width: 100,
        render: (value: ProductionOrderItem['data_category'] | null) =>
          value || 'A',
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
        render: (value: string | string[]) => {
          // 处理数组格式的旧数据
          if (Array.isArray(value)) {
            return value.join(', ')
          }
          return value
        },
      },
      {
        title: '机器编号',
        key: 'machine_equipment_id',
        width: 120,
        render: (_: unknown, record: ProductionOrderItemWithMachine) => {
          const m = record.machine_equipment_maintenances
          if (!m) return <span className="text-slate-400">无</span>
          return (
            <div className="flex flex-col">
              <span>{m.unified_device_no}</span>
              <span className="text-xs text-slate-400">{m.machine_name}</span>
            </div>
          )
        },
      },
      {
        title: '标准工时(秒)',
        dataIndex: 'standard_seconds',
        key: 'standard_seconds',
        width: 110,
      },
      {
        title: '来料接收数',
        dataIndex: 'incoming_qualified_quantity',
        key: 'incoming_qualified_quantity',
        width: 100,
      },
      {
        title: '成品合格数',
        dataIndex: 'qualified_quantity',
        key: 'qualified_quantity',
        width: 90,
      },
      {
        title: '合格工时(h)',
        dataIndex: 'qualified_hours',
        key: 'qualified_hours',
        width: 100,
        render: (value: number | null, record: ProductionOrderItem) => {
          if (value === null || value === undefined) {
            return '-'
          }

          const shouldHighlight =
            record.standard_seconds === 0 && record.qualified_quantity > 0

          return (
            <span style={shouldHighlight ? dangerTextStyle : undefined}>
              {value.toFixed(2)}
            </span>
          )
        },
      },
      {
        title: '加工不良数量',
        dataIndex: 'defect_quantity_1',
        key: 'defect_quantity_1',
        width: 100,
      },
      {
        title: '原料不良数量',
        dataIndex: 'defect_quantity_2',
        key: 'defect_quantity_2',
        width: 100,
      },
      {
        title: '外协不良数',
        dataIndex: 'outsource_defect_quantity',
        key: 'outsource_defect_quantity',
        width: 100,
        render: (value: number | null) => value || 0,
      },
      {
        title: '外协不良原因',
        dataIndex: 'outsource_defect_reason',
        key: 'outsource_defect_reason',
        width: 140,
        render: (value: string | null) => value || '-',
      },
      {
        title: '外协单位',
        dataIndex: 'outsource_unit',
        key: 'outsource_unit',
        width: 120,
        render: (value: string | null) => value || '-',
      },
      {
        title: '调机不良',
        dataIndex: 'setup_defect_quantity',
        key: 'setup_defect_quantity',
        width: 100,
        render: (value: number | null) => value || 0,
      },
      {
        title: '调机负责人',
        dataIndex: 'setup_responsible',
        key: 'setup_responsible',
        width: 120,
        render: (value: string | null) => value || '-',
      },
      {
        title: '减分工时(h)',
        dataIndex: 'defect_hours',
        key: 'defect_hours',
        width: 100,
        render: (value: number | null) => value?.toFixed(2) || '-',
      },
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        width: 150,
        render: (value: string | null) => value || '-',
      },
      {
        title: '运行时间',
        key: 'runtime',
        width: 100,
        render: (_: unknown, record: ProductionOrderItemWithMachine) => {
          const seconds =
            (record.incoming_qualified_quantity ?? 0) *
            (record.theoretical_seconds ?? 0)
          if (seconds === 0) return <span className="text-slate-400">—</span>
          return `${(seconds / 3600).toFixed(2)} h`
        },
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
    <Table<ProductionOrderItemWithMachine>
      rowKey={(record) => record.id}
      loading={loading}
      columns={columns}
      dataSource={data}
      scroll={{ y: scrollY, x: 2500 }}
      size="small"
      pagination={false}
      style={{ fontSize: '12px' }}
    />
  )
}
