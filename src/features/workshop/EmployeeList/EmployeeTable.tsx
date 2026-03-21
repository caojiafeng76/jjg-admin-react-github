import { useMemo } from 'react'
import { Table, TableColumnsType, Tag, Typography } from 'antd'
import type { Employee } from '@/services/apiEmployees'

interface Props {
  loading: boolean
  data: Employee[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
}

export default function EmployeeTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
}: Props) {
  const formatAuthUserId = (value?: string | null) => {
    if (!value) return '-'

    return `${value.slice(0, 8)}...${value.slice(-6)}`
  }

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
        width: 160,
        ellipsis: {
          showTitle: true,
        },
      },
      {
        title: '绑定账号',
        dataIndex: 'auth_user_id',
        key: 'auth_user_id',
        width: 240,
        render: (value: string | null | undefined) => {
          if (!value) {
            return <Tag color="default">未绑定</Tag>
          }

          return (
            <div className="flex flex-col gap-1">
              <Tag color="processing" className="mr-0 w-fit">
                已绑定
              </Tag>
              <Typography.Text
                copyable={{ text: value }}
                className="text-xs text-gray-500"
              >
                {formatAuthUserId(value)}
              </Typography.Text>
            </div>
          )
        },
      },
      {
        title: '角色',
        dataIndex: 'role',
        key: 'role',
        width: 110,
        render: (value: Employee['role']) => {
          if (value === 'admin') {
            return <Tag color="gold">管理员</Tag>
          }

          return <Tag color="blue">员工</Tag>
        },
      },
      {
        title: '状态',
        dataIndex: 'is_active',
        key: 'is_active',
        width: 110,
        render: (value: boolean | undefined) => {
          if (value === false) {
            return <Tag color="red">停用</Tag>
          }

          return <Tag color="green">启用</Tag>
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

  const components = useMemo(
    () => ({
      body: {
        cell: (props: any) => {
          const { children, ...restProps } = props
          return (
            <td
              {...restProps}
              style={{
                ...restProps.style,
                height: `${rowHeight}px`,
              }}
            >
              {children}
            </td>
          )
        },
      },
    }),
    [rowHeight],
  )

  return (
    <Table<Employee>
      rowKey={(record) => record.id || ''}
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      scroll={{ x: 1100, y: scrollY }}
      size="small"
      pagination={false}
      style={{
        fontSize: '12px',
      }}
      components={components}
    />
  )
}
