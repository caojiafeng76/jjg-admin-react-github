import { useMemo } from 'react'
import { Table, TableColumnsType } from 'antd'
import type { WorkshopDefectReason } from '@/services/apiWorkshopDefectReasons'

interface Props {
  loading: boolean
  data: WorkshopDefectReason[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
}

export default function DefectReasonTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
}: Props) {
  const columns: TableColumnsType<WorkshopDefectReason> = useMemo(
    () => [
      {
        title: '#',
        render: (_text, _record, index) => (page - 1) * pageSize + index + 1,
        width: 60,
        fixed: 'left',
        key: '#',
      },
      {
        title: '不良原因',
        dataIndex: 'defect_reason',
        key: 'defect_reason',
        width: 300,
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 180,
        render: (text: string) => {
          if (!text) return '-'
          return new Date(text).toLocaleString('zh-CN')
        },
      },
      {
        title: '更新时间',
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 180,
        render: (text: string) => {
          if (!text) return '-'
          return new Date(text).toLocaleString('zh-CN')
        },
      },
    ],
    [page, pageSize],
  )

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: (keys: React.Key[]) => {
        onSelect(keys)
      },
    }),
    [selectedRowKeys, onSelect],
  )

  return (
    <Table<WorkshopDefectReason>
      rowKey={(record) => record.id || ''}
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      scroll={{ x: 800, y: 'calc(100vh - 260px)' as any }}
      size="small"
      pagination={false}
      style={{
        fontSize: '12px',
      }}
    />
  )
}


