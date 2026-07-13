import { useMemo } from 'react'
import { createKeyboardTableRowProps } from '@/utils/keyboardTableRow'
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
  onRowClick?: (record: MachineEquipmentMaintenance) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
  activeRowId?: string | null
}

export default function MachineEquipmentMaintenanceTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  onRowClick,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
  activeRowId = null,
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
        render: (value: number) =>
          Math.round(Number(value || 0)).toLocaleString('zh-CN'),
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
      scroll={{ x: 'max-content', y: scrollY }}
      size="small"
      rowClassName={(record, index) => {
        if (record.id === activeRowId) return 'bg-sky-100'
        if (selectedRowKeys.includes(record.id)) return 'bg-sky-50'
        return index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
      }}
      onRow={(record) => ({
        ...createKeyboardTableRowProps(() => {
          onSelect([record.id])
          onRowClick?.(record)
        }, `打开设备保养记录 ${record.id}`),
        onClick: () => {
          onSelect([record.id])
          onRowClick?.(record)
        },
        style: { cursor: 'pointer', height: rowHeight },
      })}
    />
  )
}
