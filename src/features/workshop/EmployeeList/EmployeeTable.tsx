import { useMemo } from 'react'
import { Table, TableColumnsType, Tag, Typography } from 'antd'
import { getRoleLabel } from '@/config/access'
import type { Employee } from '@/services/apiEmployees'
import { useEmployeeAuthEmail } from './useEmployees'

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

interface BoundAccountCellProps {
  employeeId?: string
  authUserId?: string | null
}

function BoundAccountCell({ employeeId, authUserId }: BoundAccountCellProps) {
  const { data: authEmailResult, isFetching } = useEmployeeAuthEmail(
    employeeId,
    Boolean(employeeId && authUserId),
  )

  if (!authUserId) {
    return <Tag color="default">未绑定</Tag>
  }

  const email = authEmailResult?.email?.trim() || null
  const displayText =
    email || `${authUserId.slice(0, 8)}...${authUserId.slice(-6)}`

  return (
    <div className="flex flex-col gap-1">
      <Tag color="processing" className="mr-0 w-fit">
        已绑定
      </Tag>
      <Typography.Text
        copyable={{ text: email || authUserId }}
        className="text-xs text-gray-500"
      >
        {isFetching && !email ? '加载中...' : displayText}
      </Typography.Text>
    </div>
  )
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
        render: (value: string | null | undefined, record: Employee) => {
          return <BoundAccountCell employeeId={record.id} authUserId={value} />
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

          if (value === 'team_leader') {
            return <Tag color="cyan">班组长</Tag>
          }

          return <Tag color="blue">{getRoleLabel(value || 'employee')}</Tag>
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
