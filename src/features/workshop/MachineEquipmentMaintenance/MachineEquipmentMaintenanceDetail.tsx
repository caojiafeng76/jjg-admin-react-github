import { Descriptions, Empty } from 'antd'

import type { MachineEquipmentMaintenance } from '@/services/apiMachineEquipmentMaintenances'

interface Props {
  selectedRecord: MachineEquipmentMaintenance | null
}

function fmt(value: number | null | undefined, digits = 8) {
  return Number(value || 0).toFixed(digits)
}

export default function MachineEquipmentMaintenanceDetail({
  selectedRecord,
}: Props) {
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

  const {
    unified_device_no,
    operation,
    machine_name,
    machine_value,
    depreciation_years,
    annual_runtime_hours,
    depreciation_rate,
    equipment_hourly_rate,
    remark,
    updated_at,
  } = selectedRecord

  return (
    <div className="h-full overflow-auto p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium text-slate-700">{unified_device_no}</span>
        <span className="text-gray-400">·</span>
        <span className="text-gray-600">{operation}</span>
        <span className="text-gray-400">·</span>
        <span className="text-gray-500">{machine_name}</span>
      </div>
      <Descriptions
        size="small"
        column={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 4, xxl: 4 }}
        bordered
        items={[
          {
            key: 'depreciation_years',
            label: '折旧年份',
            children: depreciation_years ?? '-',
          },
          {
            key: 'machine_value',
            label: '机器价值（元）',
            children: Math.round(Number(machine_value || 0)).toLocaleString(
              'zh-CN',
            ),
          },
          {
            key: 'annual_runtime_hours',
            label: '年运行时长（小时）',
            children: fmt(annual_runtime_hours, 2),
          },
          {
            key: 'depreciation_rate',
            label: '折旧费率（元/小时）',
            children: fmt(depreciation_rate, 8),
          },
          {
            key: 'equipment_hourly_rate',
            label: '设备小时费率（元/小时）',
            children: fmt(equipment_hourly_rate, 8),
          },
          {
            key: 'remark',
            label: '备注',
            span: 3,
            children: remark || '-',
          },
          {
            key: 'updated_at',
            label: '更新时间',
            span: 1,
            children: updated_at
              ? new Date(updated_at).toLocaleString('zh-CN')
              : '-',
          },
        ]}
      />
    </div>
  )
}
