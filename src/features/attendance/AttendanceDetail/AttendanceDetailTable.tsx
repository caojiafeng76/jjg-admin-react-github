import type { TableColumnsType } from 'antd'
import type { AttendanceDetail } from '@/services/apiAttendanceDetails'
import { ClockIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { Table } from 'antd'

import { memo, useMemo } from 'react'
import StatusPill from '@/ui/StatusPill'
import { TableEmpty } from '@/ui/TableState'
import { zebraRowClassName } from '@/ui/tableStyles'

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
          <span className="flex size-7 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-500 tabular-nums dark:bg-slate-800 dark:text-slate-400">
            {(page - 1) * pageSize + index + 1}
          </span>
        ),
      },
      {
        title: (
          <span className="flex items-center gap-1.5">
            <UserCircleIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            姓名
          </span>
        ),
        dataIndex: 'name',
        key: 'name',
        width: 140,
        fixed: 'left',
        render: (value: string) => (
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {value}
          </span>
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
        render: (value: string) => (
          <StatusPill tone={value === '夜班' ? 'info' : 'neutral'}>
            {value || '白班'}
          </StatusPill>
        ),
      },
      {
        title: (
          <span className="flex items-center gap-1.5">
            <ClockIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            时间
          </span>
        ),
        dataIndex: 'time',
        key: 'time',
        width: 120,
        render: (value: string) => (
          <span className="font-mono text-slate-600 dark:text-slate-300">
            {value?.slice(0, 5) ?? '-'}
          </span>
        ),
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 180,
        render: (value: string) => (
          <span className="text-xs text-slate-400 dark:text-slate-500">
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
      rowClassName={zebraRowClassName}
      locale={{
        emptyText: (
          <TableEmpty
            title="暂无考勤明细"
            description="可点击上方“新建”或“导入 Excel”录入考勤记录"
          />
        ),
      }}
      onRow={() => ({ style: { height: rowHeight } })}
    />
  )
}

export default memo(AttendanceDetailTable)
