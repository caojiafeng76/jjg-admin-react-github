import { Table, TableColumnsType } from 'antd'
import { useMemo } from 'react'

import type { MachineRuntimeSummaryItem } from '@/services/apiMachineRuntime'

interface Props {
  loading: boolean
  data: MachineRuntimeSummaryItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  scrollY?: number
  rowHeight?: number
}

export default function MachineRuntimeSummaryTable({
  loading,
  data,
  selectedId,
  onSelect,
  scrollY = 300,
  rowHeight = 40,
}: Props) {
  const columns: TableColumnsType<MachineRuntimeSummaryItem> = useMemo(
    () => [
      {
        title: '统一设备编号',
        dataIndex: 'unified_device_no',
        key: 'unified_device_no',
        width: 150,
      },
      {
        title: '工序',
        dataIndex: 'device_operation',
        key: 'device_operation',
        width: 120,
      },
      {
        title: '机器名称',
        dataIndex: 'machine_name',
        key: 'machine_name',
        width: 150,
      },
      {
        title: '运行总时间',
        key: 'total_runtime',
        width: 130,
        sorter: (a, b) => a.total_runtime_seconds - b.total_runtime_seconds,
        defaultSortOrder: 'descend',
        render: (_: unknown, record: MachineRuntimeSummaryItem) => {
          const hours = record.total_runtime_seconds / 3600
          return `${hours.toFixed(2)} h`
        },
      },
    ],
    [],
  )

  return (
    <Table<MachineRuntimeSummaryItem>
      rowKey={(r) => r.machine_equipment_id}
      loading={loading}
      columns={columns}
      dataSource={data}
      scroll={{ y: scrollY, x: 550 }}
      size="small"
      pagination={false}
      rowClassName={(record) =>
        record.machine_equipment_id === selectedId
          ? 'bg-blue-50 dark:bg-blue-950'
          : 'cursor-pointer'
      }
      onRow={(record) => ({
        onClick: () => onSelect(record.machine_equipment_id),
        style: { cursor: 'pointer', height: rowHeight },
      })}
    />
  )
}
