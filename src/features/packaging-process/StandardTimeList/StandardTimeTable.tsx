import { memo, useMemo } from 'react'
import { Table, type TableColumnsType } from 'antd'

import type { PackagingStandardTime } from '@/services/apiPackagingStandardTimes'

interface Props {
  loading: boolean
  data: PackagingStandardTime[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
}

function StandardTimeTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
}: Props) {
  const columns: TableColumnsType<PackagingStandardTime> = useMemo(
    () => [
      {
        title: '#',
        key: '#',
        width: 60,
        fixed: 'left',
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '型号',
        dataIndex: 'model',
        key: 'model',
        width: 200,
      },
      {
        title: '长度',
        dataIndex: 'length',
        key: 'length',
        width: 120,
        render: (value: number) => value || '-',
      },
      {
        title: '料号',
        dataIndex: 'part_no',
        key: 'part_no',
        width: 200,
        render: (value: string | null) => value || '-',
      },
      {
        title: '标准工时(秒)',
        dataIndex: 'standard_seconds',
        key: 'standard_seconds',
        width: 140,
        render: (value: number) => value || 0,
      },
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        width: 200,
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
    <Table<PackagingStandardTime>
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      pagination={false}
      scroll={{ x: 1100, y: scrollY }}
      size="small"
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

export default memo(StandardTimeTable)
