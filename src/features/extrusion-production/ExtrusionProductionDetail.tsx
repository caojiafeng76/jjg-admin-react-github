import { Descriptions, Empty, Table, Tag } from 'antd'

import type {
  ExtrusionProduction,
  ExtrusionProductionItem,
} from '@/services/apiExtrusionProductions'

interface Props {
  selectedRecord: ExtrusionProduction | null
}

import { formatNumber } from '@/utils/format'

const itemColumns = [
  {
    title: '#',
    key: 'index',
    width: 56,
    render: (_: unknown, _record: ExtrusionProductionItem, index: number) =>
      index + 1,
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
    render: (value: string | null) => value || '-',
  },
  {
    title: '模具号',
    dataIndex: 'die_no',
    key: 'die_no',
    width: 120,
    render: (value: string | null) => value || '-',
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
    render: (value: number) => formatNumber(value),
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
    render: (value: number) => formatNumber(value),
  },
  {
    title: '成材率(%)',
    dataIndex: 'material_yield',
    key: 'material_yield',
    width: 110,
    render: (value: number) => formatNumber(value),
  },
  {
    title: '备注',
    dataIndex: 'remark',
    key: 'remark',
    width: 160,
    render: (value: string | null) => value || '-',
  },
]

export default function ExtrusionProductionDetail({ selectedRecord }: Props) {
  if (!selectedRecord) {
    return (
      <div className="flex h-full items-center justify-center">
        <Empty
          description="点击上方表格行查看详情"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    )
  }

  const totalTheoreticalCount = (selectedRecord.extrusion_production_items || []).reduce(
    (total, item) => total + Number(item.theoretical_output_count || 0),
    0,
  )
  const totalActualWeight = (selectedRecord.extrusion_production_items || []).reduce(
    (total, item) => total + Number(item.actual_output_weight_kg || 0),
    0,
  )

  return (
    <div className="flex h-full flex-col overflow-hidden p-3">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <Tag color={selectedRecord.is_audited ? 'success' : 'default'}>
          {selectedRecord.is_audited ? '已审核' : '待审核'}
        </Tag>
        <span className="font-medium">{selectedRecord.production_date}</span>
        <span className="text-slate-400">·</span>
        <span>{selectedRecord.shift}</span>
      </div>

      <Descriptions
        size="small"
        column={{ xs: 1, sm: 2, md: 3 }}
        bordered
        items={[
          {
            key: 'machine_id',
            label: '设备',
            children:
              selectedRecord.machine?.machine_name ||
              selectedRecord.machine?.unified_device_no ||
              selectedRecord.machine_id,
          },
          {
            key: 'shift_leader_name',
            label: '班组长',
            children: selectedRecord.shift_leader_name,
          },
          {
            key: 'uploaded_by_name',
            label: '上传人',
            children: selectedRecord.uploaded_by_name || '-',
          },
          {
            key: 'audited_at',
            label: '审核时间',
            children: selectedRecord.audited_at
              ? new Date(selectedRecord.audited_at).toLocaleString('zh-CN')
              : '-',
          },
          {
            key: 'total_theoretical_count',
            label: '总理论支数',
            children: totalTheoreticalCount,
          },
          {
            key: 'total_actual_weight',
            label: '总实际产出重量(kg)',
            children: formatNumber(totalActualWeight),
          },
          {
            key: 'remark',
            label: '备注',
            children: selectedRecord.remark || '-',
            span: 3,
          },
        ]}
      />

      <div className="mt-3 min-h-0 flex-1">
        <Table<ExtrusionProductionItem>
          rowKey={(record) => record.id}
          size="small"
          pagination={false}
          columns={itemColumns}
          dataSource={selectedRecord.extrusion_production_items || []}
          scroll={{ x: 1200, y: 360 }}
        />
      </div>
    </div>
  )
}
