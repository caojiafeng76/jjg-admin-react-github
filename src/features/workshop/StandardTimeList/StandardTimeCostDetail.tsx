import { Descriptions, Empty, Tag } from 'antd'
import type { StandardTime } from '@/services/apiStandardTimes'
import { calculateDailyStandardCapacity } from '@/utils/costAccounting'

interface Props {
  selectedRecord: StandardTime | null
}

function formatNumber(value: number | null | undefined, digits = 4) {
  return Number(value || 0).toFixed(digits)
}

export default function StandardTimeCostDetail({ selectedRecord }: Props) {
  if (!selectedRecord) {
    return (
      <div className="flex h-full items-center justify-center">
        <Empty
          description="点击上方表格行查看成本详情"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    )
  }

  const {
    record_type,
    model,
    operation,
    standard_seconds,
    theoretical_seconds,
    inspection_seconds,
    labor_rate,
    labor_cost_coefficient,
    equipment_rate,
    tool_rate,
    cutting_fluid_rate,
    fixture_rate,
    daily_management_cost,
    daily_total_hours,
    labor_cost,
    equipment_cost,
    tooling_consumable_cost,
    inspection_cost,
    overhead_cost,
    total_cost,
    uploaded_by_name,
    remark,
    created_at,
    updated_at,
  } = selectedRecord

  const operationStr = Array.isArray(operation)
    ? operation.join(', ')
    : operation

  return (
    <div className="h-full overflow-auto p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
        <Tag color={record_type === 'A' ? 'blue' : 'default'}>
          {record_type === 'A' ? 'A类' : 'B类'}
        </Tag>
        <span className="font-medium">{model}</span>
        <span className="text-gray-400">·</span>
        <span className="text-gray-600">{operationStr}</span>
        <span className="text-gray-400">·</span>
        <span className="text-gray-500">标准工时 {standard_seconds}s</span>
        <span className="text-gray-400">·</span>
        <span className="text-gray-500">
          日标准产能{' '}
          {formatNumber(calculateDailyStandardCapacity(standard_seconds), 2)} 件
        </span>
      </div>
      <Descriptions
        size="small"
        column={4}
        bordered
        items={[
          {
            key: 'theoretical_seconds',
            label: '理论工时（秒）',
            children: theoretical_seconds ?? '-',
          },
          {
            key: 'inspection_seconds',
            label: '检验工时（秒）',
            children: inspection_seconds ?? '-',
          },
          {
            key: 'labor_rate',
            label: '人工费率',
            children: formatNumber(labor_rate),
          },
          {
            key: 'labor_cost_coefficient',
            label: '人工成本系数',
            children: formatNumber(labor_cost_coefficient),
          },
          {
            key: 'equipment_rate',
            label: '设备费率',
            children: formatNumber(equipment_rate),
          },
          {
            key: 'tool_rate',
            label: '刀具费率',
            children: formatNumber(tool_rate),
          },
          {
            key: 'cutting_fluid_rate',
            label: '切削液费率',
            children: formatNumber(cutting_fluid_rate),
          },
          {
            key: 'fixture_rate',
            label: '工装费率',
            children: formatNumber(fixture_rate),
          },
          {
            key: 'daily_management_cost',
            label: '日管理总费用',
            children: formatNumber(daily_management_cost, 2),
          },
          {
            key: 'daily_total_hours',
            label: '日总工时',
            children: formatNumber(daily_total_hours, 2),
          },
          {
            key: 'labor_cost',
            label: '人工成本',
            children: formatNumber(labor_cost),
          },
          {
            key: 'equipment_cost',
            label: '设备成本',
            children: formatNumber(equipment_cost),
          },
          {
            key: 'tooling_consumable_cost',
            label: '刀具辅料成本',
            children: formatNumber(tooling_consumable_cost),
          },
          {
            key: 'inspection_cost',
            label: '检验成本',
            children: formatNumber(inspection_cost),
          },
          {
            key: 'overhead_cost',
            label: '单品分摊额',
            children: formatNumber(overhead_cost),
          },
          {
            key: 'total_cost',
            label: '合计成本',
            children: formatNumber(total_cost),
          },
          {
            key: 'uploaded_by_name',
            label: '数据上传',
            children: uploaded_by_name || '-',
          },
          {
            key: 'remark',
            label: '备注',
            span: 3,
            children: remark || '-',
          },
          {
            key: 'created_at',
            label: '创建时间',
            children: created_at
              ? new Date(created_at).toLocaleString('zh-CN')
              : '-',
          },
          {
            key: 'updated_at',
            label: '更新时间',
            span: 3,
            children: updated_at
              ? new Date(updated_at).toLocaleString('zh-CN')
              : '-',
          },
        ]}
      />
    </div>
  )
}
