import { useMemo } from 'react'
import { Table, TableColumnsType } from 'antd'
import type { Employee } from '@/services/apiEmployees'

interface Props {
  loading: boolean
  data: Employee[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
}

export default function EmployeeTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
}: Props) {
  const columns: TableColumnsType<Employee> = useMemo(
    () => [
      {
        title: '#',
        render: (_text, _record, index) => (page - 1) * pageSize + index + 1,
        width: 60,
        fixed: 'left',
        key: '#',
      },
      {
        title: '姓名',
        dataIndex: 'name',
        key: 'name',
        width: 200,
        ellipsis: {
          showTitle: true,
        },
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
    <Table<Employee>
      rowKey={(record) => record.id || ''}
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      scroll={{ x: 800 }}
      size="small"
      pagination={false}
      style={{
        fontSize: '12px',
      }}
    />
  )
}
