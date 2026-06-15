import { memo, useMemo } from 'react'
import { Table, TableColumnsType } from 'antd'
import { ClockIcon, UserCircleIcon } from '@heroicons/react/24/outline'

import type { AttendanceDetail } from '@/services/apiAttendanceDetails'

interface Props {
  loading: boolean
  data: AttendanceDetail[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
}

function AttendanceDetailTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
}: Props) {
  const columns: TableColumnsType<AttendanceDetail> = useMemo(
    () => [
      {
        title: '#',
        key: '#',
        width: 60,
        fixed: 'left',
        render: (_value, _record, index) => (
          <span className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-500">
            {(page - 1) * pageSize + index + 1}
          </span>
        ),
      },
      {
        title: (
          <span className="flex items-center gap-1.5">
            <UserCircleIcon className="h-4 w-4 text-slate-400" />
            姓名
          </span>
        ),
        dataIndex: 'name',
        key: 'name',
        width: 140,
        fixed: 'left',
        render: (value: string) => (
          <span className="font-medium text-slate-700">{value}</span>
        ),
      },
      {
        title: '日期',
        dataIndex: 'date',
        key: 'date',
        width: 140,
      },
      {
        title: '班别',
        dataIndex: 'shift',
        key: 'shift',
        width: 100,
        render: (value: string) =>
          value === '夜班' ? (
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
              {value || '白班'}
            </span>
          ) : (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {value || '白班'}
            </span>
          ),
      },
      {
        title: (
          <span className="flex items-center gap-1.5">
            <ClockIcon className="h-4 w-4 text-slate-400" />
            时间
          </span>
        ),
        dataIndex: 'time',
        key: 'time',
        width: 120,
        render: (value: string) => (
          <span className="font-mono text-slate-600">{value?.slice(0, 5) ?? '-'}</span>
        ),
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 180,
        render: (value: string) => (
          <span className="text-xs text-slate-400">
            {value ? new Date(value).toLocaleString('zh-CN') : '-'}
          </span>
        ),
      },
    ],
    [page, pageSize],
  )

  return (
    <Table
      rowKey="id"
      loading={loading}
      dataSource={data}
      columns={columns}
      pagination={false}
      scroll={{ x: 'max-content', y: scrollY }}
      rowSelection={{
        type: 'checkbox',
        selectedRowKeys,
        onChange: onSelect,
      }}
      size="small"
      onRow={() => ({ style: { height: rowHeight } })}
      className="[&_.ant-table-thead>tr>th]:!bg-slate-50 [&_.ant-table-thead>tr>th]:!font-medium [&_.ant-table-tbody>tr:hover>td]:!bg-blue-50/30"
    />
  )
}

export default memo(AttendanceDetailTable)
