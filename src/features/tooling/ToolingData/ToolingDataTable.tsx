import { memo, useMemo } from 'react'
import { Table, TableColumnsType } from 'antd'

import type { ToolingData } from '@/services/apiToolingData'

function formatAmount(value: number | null | undefined) {
  return Number(value || 0).toFixed(2)
}

interface Props {
  loading: boolean
  data: ToolingData[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
}

function ToolingDataTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
}: Props) {
  const columns: TableColumnsType<ToolingData> = useMemo(
    () => [
      {
        title: '#',
        key: '#',
        width: 60,
        fixed: 'left',
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '刀具编号',
        dataIndex: 'tool_code',
        key: 'tool_code',
        width: 140,
        fixed: 'left',
      },
      {
        title: '刀具名称',
        dataIndex: 'tool_name',
        key: 'tool_name',
        width: 180,
      },
      {
        title: '刀具规格',
        dataIndex: 'tool_spec',
        key: 'tool_spec',
        width: 180,
      },
      {
        title: '材质',
        dataIndex: 'material',
        key: 'material',
        width: 140,
      },
      {
        title: '单价（元）',
        dataIndex: 'unit_price',
        key: 'unit_price',
        width: 120,
        render: (value: number) => formatAmount(value),
      },
      {
        title: '用途',
        dataIndex: 'usage',
        key: 'usage',
        width: 220,
      },
      {
        title: '备注',
        dataIndex: 'remarks',
        key: 'remarks',
        width: 260,
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
    <Table<ToolingData>
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      pagination={false}
      scroll={{ x: 1480, y: scrollY }}
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

export default memo(ToolingDataTable)
