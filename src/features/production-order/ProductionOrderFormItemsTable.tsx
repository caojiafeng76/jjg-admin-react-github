import { Button, Card, Popconfirm, Space, Table } from 'antd'
import {
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/16/solid'
import type { ProductionOrderDataCategory } from '@/services/apiProductionOrderItems'
import type { OrderItem } from './productionOrderFormTypes'

export interface ProductionOrderFormItemsTableProps {
  hideCostColumns: boolean
  items: OrderItem[]
  loading: boolean
  onAdd: () => void
  onDelete: (index: number) => void
  onEdit: (index: number) => void
}

export default function ProductionOrderFormItemsTable({
  hideCostColumns,
  items,
  loading,
  onAdd,
  onDelete,
  onEdit,
}: ProductionOrderFormItemsTableProps) {
  return (
    <Card
      title="工序明细"
      size="small"
      extra={
        <Button
          type="primary"
          size="small"
          icon={<PlusIcon className="h-4 w-4" />}
          onClick={() => onAdd()}
        >
          添加工序
        </Button>
      }
    >
      <Table
        size="small"
        pagination={false}
        dataSource={items.map((item: OrderItem, index: number) => ({
          ...item,
          key: index,
        }))}
        rowKey="key"
        scroll={{ x: 1600 }}
        loading={loading}
        columns={[
          {
            title: '#',
            width: 50,
          },
          ...(hideCostColumns
            ? []
            : [
                {
                  title: '数据类别',
                  dataIndex: 'data_category',
                  width: 100,
                  render: (value?: ProductionOrderDataCategory) => value || 'A',
                },
              ]),
          {
            title: '项目号',
            dataIndex: 'project_no',
            width: 120,
          },
          {
            title: '型号',
            dataIndex: 'product_model',
            width: 100,
          },
          {
            title: '长度',
            dataIndex: 'length_mm',
            width: 80,
            align: 'right',
          },
          {
            title: '客户型号',
            dataIndex: 'customer_model',
            width: 100,
          },
          {
            title: '工序',
            dataIndex: 'operation',
            width: 100,
            render: (value: string | string[]) => {
              // 处理数组格式的旧数据
              if (Array.isArray(value)) {
                return value.join(', ')
              }
              return value
            },
          },
          ...(hideCostColumns
            ? []
            : [
                {
                  title: '标准工时(秒)',
                  dataIndex: 'standard_seconds',
                  width: 100,
                  align: 'right' as const,
                },
              ]),
          {
            title: '来料接收数',
            dataIndex: 'incoming_qualified_quantity',
            width: 100,
            align: 'right',
          },
          {
            title: '成品合格数',
            dataIndex: 'qualified_quantity',
            width: 80,
            align: 'right',
          },
          {
            title: '加工不良数量',
            dataIndex: 'defect_quantity_1',
            width: 100,
            align: 'right',
            render: (value: number) => value || 0,
          },
          {
            title: '原料不良数量',
            dataIndex: 'defect_quantity_2',
            width: 100,
            align: 'right',
            render: (value: number) => value || 0,
          },
          {
            title: '外协不良数',
            dataIndex: 'outsource_defect_quantity',
            width: 100,
            align: 'right',
            render: (value: number) => value || 0,
          },
          {
            title: '外协不良原因',
            dataIndex: 'outsource_defect_reason',
            width: 140,
            render: (value: string | null) => value || '',
          },
          {
            title: '外协单位',
            dataIndex: 'outsource_unit',
            width: 120,
            render: (value: string | null) => value || '',
          },
          {
            title: '调机不良',
            dataIndex: 'setup_defect_quantity',
            width: 100,
            align: 'right',
            render: (value: number) => value || 0,
          },
          {
            title: '调机负责人',
            dataIndex: 'setup_responsible',
            width: 120,
            render: (value: string | null) => value || '',
          },
          {
            title: '备注',
            dataIndex: 'remark',
            width: 150,
            render: (value: string) => value || '',
          },
          {
            title: '操作',
            width: 100,
            render: (_: unknown, record: OrderItem & { key: number }) => (
              <Space size="small">
                <Button
                  type="text"
                  size="small"
                  icon={<PencilSquareIcon className="h-4 w-4" />}
                  aria-label={`编辑工序 ${record.operation}`}
                  onClick={() => onEdit(record.key)}
                />
                <Popconfirm
                  title="确定删除此工序明细吗？"
                  okText="确定"
                  cancelText="取消"
                  onConfirm={() => onDelete(record.key)}
                >
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<TrashIcon className="h-4 w-4" />}
                    aria-label={`删除工序 ${record.operation}`}
                  />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
    </Card>
  )
}
