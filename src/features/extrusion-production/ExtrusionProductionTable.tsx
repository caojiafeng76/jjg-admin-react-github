import { useMemo } from 'react'
import { Table, Tag, type TableColumnsType, type TableProps } from 'antd'

import type { ExtrusionProduction } from '@/services/apiExtrusionProductions'

interface Props {
  loading: boolean
  data: ExtrusionProduction[]
  page: number
  pageSize: number
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  scrollY?: number
  rowHeight?: number
  activeRowId?: string | null
  onRowClick?: (record: ExtrusionProduction) => void
}

export default function ExtrusionProductionTable({
  loading,
  data,
  page,
  pageSize,
  selectedRowKeys,
  onSelect,
  scrollY = 400,
  rowHeight = 40,
  activeRowId,
  onRowClick,
}: Props) {
  const columns: TableColumnsType<ExtrusionProduction> = useMemo(
    () => [
      {
        title: '#',
        key: 'index',
        width: 56,
        fixed: 'left',
        render: (_text, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '生产日期',
        dataIndex: 'production_date',
        key: 'production_date',
        width: 120,
      },
      {
        title: '班别',
        dataIndex: 'shift',
        key: 'shift',
        width: 90,
      },
      {
        title: '审核状态',
        dataIndex: 'is_audited',
        key: 'is_audited',
        width: 100,
        render: (value: boolean) => (
          <Tag color={value ? 'success' : 'default'}>
            {value ? '已审核' : '待审核'}
          </Tag>
        ),
      },
      {
        title: '设备ID',
        dataIndex: 'machine_id',
        key: 'machine_id',
        width: 180,
      },
      {
        title: '班组长',
        dataIndex: 'shift_leader_name',
        key: 'shift_leader_name',
        width: 180,
      },
      {
        title: '明细数',
        key: 'item_count',
        width: 88,
        render: (_text, record) => record.extrusion_production_items?.length || 0,
      },
      {
        title: '上传人',
        dataIndex: 'uploaded_by_name',
        key: 'uploaded_by_name',
        width: 120,
        render: (value: string | null) => value || '-',
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 170,
        render: (value: string) => new Date(value).toLocaleString('zh-CN'),
      },
    ],
    [page, pageSize],
  )

  const rowSelection: TableProps<ExtrusionProduction>['rowSelection'] = {
    selectedRowKeys,
    onChange: onSelect,
    preserveSelectedRowKeys: true,
  }

  return (
    <Table<ExtrusionProduction>
      rowKey={(record) => record.id}
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      onRow={(record) => ({
        onClick: () => onRowClick?.(record),
        style: {
          cursor: onRowClick ? 'pointer' : undefined,
          backgroundColor:
            record.id && record.id === activeRowId ? '#e6f4ff' : undefined,
          height: rowHeight,
        },
      })}
      scroll={{ x: 1300, y: scrollY }}
      size="small"
      pagination={false}
      style={{ fontSize: '12px' }}
    />
  )
}
