import { useMemo } from 'react'
import { Table, TableColumnsType } from 'antd'

import type { JobBaseSetting } from '@/services/apiJobBaseSettings'

function formatAmount(value: number | null | undefined, digits = 2) {
  return Number(value || 0).toFixed(digits)
}

interface Props {
  loading: boolean
  data: JobBaseSetting[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
}

export default function JobBaseSettingTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
}: Props) {
  const columns: TableColumnsType<JobBaseSetting> = useMemo(
    () => [
      {
        title: '#',
        key: '#',
        width: 60,
        fixed: 'left',
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '工种',
        dataIndex: 'job_name',
        key: 'job_name',
        width: 160,
        fixed: 'left',
      },
      {
        title: '标准收入（元）',
        dataIndex: 'standard_income',
        key: 'standard_income',
        width: 140,
        render: (value: number) => formatAmount(value),
      },
      {
        title: '工时费（元/小时）',
        dataIndex: 'hourly_fee',
        key: 'hourly_fee',
        width: 160,
        render: (value: number) => formatAmount(value, 8),
      },
      {
        title: '每日工作时间（小时）',
        dataIndex: 'daily_work_hours',
        key: 'daily_work_hours',
        width: 160,
        render: (value: number) => formatAmount(value),
      },
      {
        title: '工作天数',
        dataIndex: 'working_days',
        key: 'working_days',
        width: 120,
      },
      {
        title: '月标准工作时间（小时）',
        dataIndex: 'monthly_standard_hours',
        key: 'monthly_standard_hours',
        width: 180,
        render: (value: number) => formatAmount(value),
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
    <Table<JobBaseSetting>
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      pagination={false}
      scroll={{ x: 1160, y: scrollY }}
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
