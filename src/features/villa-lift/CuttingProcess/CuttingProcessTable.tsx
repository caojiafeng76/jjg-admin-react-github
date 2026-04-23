import { useMemo } from 'react'
import { Button, Popconfirm, Table, Tag, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/16/solid'
import dayjs from 'dayjs'

import type { VillaLiftCuttingRecordWithOrder } from '@/services/apiVillaLiftCutting'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

interface CuttingProcessTableProps {
  data: VillaLiftCuttingRecordWithOrder[]
  loading: boolean
  canEdit: boolean
  isDeleting: boolean
  onEdit: (record: VillaLiftCuttingRecordWithOrder) => void
  onDelete: (id: string) => void
  scrollY?: number
}

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------

export default function CuttingProcessTable({
  data,
  loading,
  canEdit,
  isDeleting,
  onEdit,
  onDelete,
  scrollY,
}: CuttingProcessTableProps) {
  const columns: TableColumnsType<VillaLiftCuttingRecordWithOrder> = useMemo(
    () => [
      {
        title: '项目名称',
        dataIndex: ['order', 'project_name'],
        key: 'project_name',
        width: 160,
        ellipsis: true,
        render: (v: string) => <span className="font-medium">{v}</span>,
      },
      {
        title: '客户',
        dataIndex: ['order', 'customer'],
        key: 'customer',
        width: 100,
        ellipsis: true,
      },
      {
        title: '产品',
        dataIndex: ['order', 'product_name'],
        key: 'product_name',
        width: 120,
        ellipsis: true,
      },
      {
        title: '型号',
        dataIndex: 'model',
        key: 'model',
        width: 120,
        ellipsis: true,
        render: (v: string) => <Tag>{v}</Tag>,
      },
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
        width: 120,
        ellipsis: true,
        render: (v: string) => v || '-',
      },
      {
        title: '规格',
        dataIndex: 'spec',
        key: 'spec',
        width: 120,
        ellipsis: true,
        render: (v: string) => v || '-',
      },
      {
        title: '切割数量',
        dataIndex: 'cut_quantity',
        key: 'cut_quantity',
        width: 90,
        align: 'right' as const,
      },
      {
        title: '原料报废',
        dataIndex: 'raw_scrap_quantity',
        key: 'raw_scrap_quantity',
        width: 90,
        align: 'right' as const,
        render: (v: number) =>
          v > 0 ? <span className="text-orange-500">{v}</span> : v,
      },
      {
        title: '加工报废',
        dataIndex: 'process_scrap_quantity',
        key: 'process_scrap_quantity',
        width: 90,
        align: 'right' as const,
        render: (v: number) =>
          v > 0 ? <span className="text-orange-500">{v}</span> : v,
      },
      {
        title: '备注',
        dataIndex: 'remarks',
        key: 'remarks',
        ellipsis: true,
        render: (v: string) => v || '-',
      },
      {
        title: '操作人',
        dataIndex: 'operator',
        key: 'operator',
        width: 100,
        ellipsis: true,
        render: (v: string) => v || '-',
      },
      {
        title: '录入时间',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 150,
        render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
      },
      ...(canEdit
        ? [
            {
              title: '操作',
              key: 'action',
              width: 80,
              fixed: 'right' as const,
              render: (_: unknown, record: VillaLiftCuttingRecordWithOrder) => (
                <div className="flex items-center gap-1">
                  <Tooltip title="编辑">
                    <Button
                      type="text"
                      size="small"
                      icon={<PencilSquareIcon className="size-4" />}
                      onClick={() => onEdit(record)}
                    />
                  </Tooltip>
                  <Popconfirm
                    title="确认删除该记录？"
                    okText="删除"
                    cancelText="取消"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => onDelete(record.id)}
                  >
                    <Tooltip title="删除">
                      <Button
                        type="text"
                        size="small"
                        danger
                        loading={isDeleting}
                        icon={<TrashIcon className="size-4" />}
                      />
                    </Tooltip>
                  </Popconfirm>
                </div>
              ),
            },
          ]
        : []),
    ],
    [canEdit, isDeleting, onEdit, onDelete],
  )

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
      scroll={{ x: 1350, y: scrollY }}
      size="small"
    />
  )
}
