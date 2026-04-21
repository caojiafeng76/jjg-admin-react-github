import type { ReactNode, TdHTMLAttributes } from 'react'
import { useMemo } from 'react'
import { Table, TableColumnsType, Tag, Typography } from 'antd'
import { useRoleOptions } from '@/hooks/useRoleOptions'
import type { Employee } from '@/services/apiEmployees'
import { useEmployeeAuthEmail } from './useEmployees'

function formatNumber(value: number | null | undefined, digits = 2) {
  return Number(value ?? 0).toFixed(digits)
}

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

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode
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
        className="text-xs text-slate-500"
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
  const { getLabel: getRoleLabel } = useRoleOptions()
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

          if (value === 'precision_cutting_admin') {
            return <Tag color="purple">精切管理员</Tag>
          }

          if (value === 'team_leader') {
            return <Tag color="cyan">班组长</Tag>
          }

          return <Tag color="blue">{getRoleLabel(value || 'employee')}</Tag>
        },
      },
      {
        title: '工种',
        dataIndex: 'job_name',
        key: 'job_name',
        width: 160,
        render: (value: string | null | undefined) => value || '-',
      },
      {
        title: '岗位时薪',
        dataIndex: 'hourly_wage',
        key: 'hourly_wage',
        width: 120,
        render: (value: number | null | undefined) => formatNumber(value),
      },
      {
        title: '系数',
        dataIndex: 'coefficient',
        key: 'coefficient',
        width: 100,
        render: (value: number | null | undefined) => formatNumber(value),
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
    [page, pageSize, getRoleLabel],
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
        cell: (props: TableCellProps) => {
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
      scroll={{ x: 1480, y: scrollY }}
      size="small"
      pagination={false}
      style={{
        fontSize: '12px',
      }}
      components={components}
    />
  )
}
