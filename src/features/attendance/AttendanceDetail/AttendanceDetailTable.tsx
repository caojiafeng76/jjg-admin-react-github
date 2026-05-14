import { memo, useMemo } from 'react'
import { Table, TableColumnsType } from 'antd'

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
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '姓名',
        dataIndex: 'name',
        key: 'name',
        width: 140,
        fixed: 'left',
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
        render: (value: string) => value || '白班',
      },
      {
        title: '时间',
        dataIndex: 'time',
        key: 'time',
        width: 120,
        render: (value: string) => value?.slice(0, 5) ?? '-',
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 180,
        render: (value: string) =>
          value ? new Date(value).toLocaleString('zh-CN') : '-',
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
    />
  )
}

export default memo(AttendanceDetailTable)
