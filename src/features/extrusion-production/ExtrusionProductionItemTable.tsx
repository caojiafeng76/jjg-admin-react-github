import { Button, Popconfirm, Space, Table, type TableColumnsType } from 'antd'
import {
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/16/solid'

import type { ExtrusionProductionItemInput } from '@/services/apiExtrusionProductions'

interface Props {
  data: ExtrusionProductionItemInput[]
  onAdd: () => void
  onEdit: (index: number) => void
  onDelete: (index: number) => void
}

function renderNumber(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined) {
    return '-'
  }

  return Number(value).toFixed(digits)
}

export default function ExtrusionProductionItemTable({
  data,
  onAdd,
  onEdit,
  onDelete,
}: Props) {
  const columns: TableColumnsType<ExtrusionProductionItemInput> = [
    {
      title: '#',
      key: 'index',
      width: 56,
      render: (_text, _record, index) => index + 1,
    },
    {
      title: '项目号',
      dataIndex: 'project_no',
      key: 'project_no',
      width: 140,
    },
    {
      title: '型号',
      dataIndex: 'product_model',
      key: 'product_model',
      width: 140,
      render: (value: string | null | undefined) => value || '-',
    },
    {
      title: '模具号',
      dataIndex: 'die_no',
      key: 'die_no',
      width: 120,
      render: (value: string | null | undefined) => value || '-',
    },
    {
      title: '理论支数',
      dataIndex: 'theoretical_output_count',
      key: 'theoretical_output_count',
      width: 96,
    },
    {
      title: '理论支重(kg)',
      dataIndex: 'theoretical_output_weight_kg',
      key: 'theoretical_output_weight_kg',
      width: 120,
      render: (value) => renderNumber(value),
    },
    {
      title: '实际数量',
      dataIndex: 'actual_quantity',
      key: 'actual_quantity',
      width: 96,
    },
    {
      title: '实际产出重量(kg)',
      dataIndex: 'actual_output_weight_kg',
      key: 'actual_output_weight_kg',
      width: 140,
      render: (value) => renderNumber(value),
    },
    {
      title: '成材率(%)',
      dataIndex: 'material_yield',
      key: 'material_yield',
      width: 110,
      render: (value) => renderNumber(value),
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_text, _record, index) => (
        <Space size="small">
          <Button
            type="text"
            icon={<PencilSquareIcon className="size-4 text-yellow-500/80!" />}
            onClick={() => onEdit(index)}
          >
            编辑
          </Button>
          <Popconfirm
            title="删除明细"
            description="确定删除这条明细吗？"
            onConfirm={() => onDelete(index)}
            okText="删除"
            cancelText="取消"
          >
            <Button
              type="text"
              icon={<TrashIcon className="size-4 text-red-500/80!" />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="rounded-2xl border border-slate-200 p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium text-slate-700">挤压明细</div>
        <Button
          type="dashed"
          icon={<PlusIcon className="size-4" />}
          onClick={onAdd}
        >
          添加明细
        </Button>
      </div>

      <Table<ExtrusionProductionItemInput>
        rowKey={(record) =>
          `${record.project_no}-${record.sort_order ?? 0}-${record.die_no ?? ''}`
        }
        size="small"
        pagination={false}
        columns={columns}
        dataSource={data}
        locale={{ emptyText: '请先添加至少一条明细' }}
        scroll={{ x: 1200 }}
      />
    </div>
  )
}
