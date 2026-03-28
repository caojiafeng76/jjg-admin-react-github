import { useMemo } from 'react'
import { Table, TableColumnsType } from 'antd'

import type { MachineEquipmentMaintenance } from '@/services/apiMachineEquipmentMaintenances'

function formatAmount(value: number | null | undefined, digits = 2) {
  return Number(value || 0).toFixed(digits)
}

interface Props {
  loading: boolean
  data: MachineEquipmentMaintenance[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
}

export default function MachineEquipmentMaintenanceTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
}: Props) {
  const columns: TableColumnsType<MachineEquipmentMaintenance> = useMemo(
    () => [
      {
        title: '#',
        key: '#',
        width: 60,
        fixed: 'left',
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '统一设备编号',
        dataIndex: 'unified_device_no',
        key: 'unified_device_no',
        width: 160,
        fixed: 'left',
      },
      {
        title: '工序',
        dataIndex: 'operation',
        key: 'operation',
        width: 160,
      },
      {
        title: '机器名称',
        dataIndex: 'machine_name',
        key: 'machine_name',
        width: 180,
      },
      {
        title: '客户',
        dataIndex: 'customer',
        key: 'customer',
        width: 180,
        render: (value: string | null) => value || '-',
      },
      {
        title: '原编号',
        dataIndex: 'original_no',
        key: 'original_no',
        width: 140,
        render: (value: string | null) => value || '-',
      },
      {
        title: '功率（kW）',
        dataIndex: 'power_kw',
        key: 'power_kw',
        width: 120,
        render: (value: number) => formatAmount(value),
      },
      {
        title: '同步工作数量',
        dataIndex: 'sync_work_quantity',
        key: 'sync_work_quantity',
        width: 140,
      },
      {
        title: '电单价（元/度）',
        dataIndex: 'electricity_unit_price',
        key: 'electricity_unit_price',
        width: 140,
        render: (value: number) => formatAmount(value, 4),
      },
      {
        title: '单小时电费（元）',
        dataIndex: 'hourly_electricity_fee',
        key: 'hourly_electricity_fee',
        width: 160,
        render: (value: number) => formatAmount(value, 8),
      },
      {
        title: '机器价值（元）',
        dataIndex: 'machine_value',
        key: 'machine_value',
        width: 140,
        render: (value: number) => formatAmount(value),
      },
      {
        title: '折旧年份',
        dataIndex: 'depreciation_years',
        key: 'depreciation_years',
        width: 120,
      },
      {
        title: '年运行时长（小时）',
        dataIndex: 'annual_runtime_hours',
        key: 'annual_runtime_hours',
        width: 160,
        render: (value: number) => formatAmount(value),
      },
      {
        title: '折旧费率（元/小时）',
        dataIndex: 'depreciation_rate',
        key: 'depreciation_rate',
        width: 180,
        render: (value: number) => formatAmount(value, 8),
      },
      {
        title: '设备小时费率（元/小时）',
        dataIndex: 'equipment_hourly_rate',
        key: 'equipment_hourly_rate',
        width: 200,
        render: (value: number) => formatAmount(value, 8),
      },
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        width: 200,
        ellipsis: {
          showTitle: true,
        },
        render: (value: string | null) => value || '-',
      },
      {
        title: '更新时间',
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 180,
        render: (value: string) =>
          value ? new Date(value).toLocaleString('zh-CN') : '-',
      },
    ],
    [page, pageSize],
  )

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: (keys: React.Key[]) => onSelect(keys),
    }),
    [onSelect, selectedRowKeys],
  )

  return (
    <Table<MachineEquipmentMaintenance>
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      pagination={false}
      scroll={{ x: 2700, y: scrollY }}
      size="middle"
      bordered
      rowClassName={(_, index) =>
        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
      }
      onRow={(record) => ({
        onClick: () => onSelect([record.id]),
        style: { cursor: 'pointer', height: rowHeight },
      })}
    />
  )
}
