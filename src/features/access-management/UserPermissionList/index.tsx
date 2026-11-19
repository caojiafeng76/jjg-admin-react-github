import type { AppRole } from '@/config/access'
import type { Employee } from '@/services/apiEmployees'
import { Button, Input, Table } from 'antd'
import { useMemo, useState } from 'react'
import { useAllEmployees } from '@/features/workshop/EmployeeList/useEmployees'
import { useRoleOptions } from '@/hooks/useRoleOptions'
import FilterBar from '@/ui/FilterBar'
import StatusPill from '@/ui/StatusPill'
import { TableEmpty } from '@/ui/TableState'
import { zebraRowClassName } from '@/ui/tableStyles'
import {
  useAllPermissions,
  useRolePermissionIds,
} from '../RolePermissionList/useRolePermissions'
import UserPermissionDetail from './UserPermissionDetail'
import { useUpdateUserPermissions } from './useUpdateUserPermissions'
import { useUserPermissionOverrides } from './useUserPermissions'

type EmployeeRow = Required<Pick<Employee, 'id' | 'name'>> & {
  role: AppRole | null
  is_active?: boolean
}

function EmployeeDetailPanel({
  employee,
  onBack,
}: {
  employee: EmployeeRow
  onBack: () => void
}) {
  const { data: allPermissions = [], isLoading: loadingAllPerms }
    = useAllPermissions()
  const { data: rolePermissionIds = [] } = useRolePermissionIds(
    employee.role ?? 'employee',
  )
  const { data: userOverrides = [], isLoading: loadingOverrides }
    = useUserPermissionOverrides(employee.id)
  const {
    mutate: updateOverrides,
    isPending: saving,
    contextHolder,
  } = useUpdateUserPermissions()

  return (
    <>
      {contextHolder}
      <UserPermissionDetail
        employee={{ id: employee.id, name: employee.name, role: employee.role }}
        allPermissions={allPermissions}
        rolePermissionIds={rolePermissionIds}
        userOverrides={userOverrides}
        loadingPerms={loadingAllPerms || loadingOverrides}
        saving={saving}
        onSave={overrides =>
          updateOverrides({ employeeId: employee.id, overrides })}
        onBack={onBack}
      />
    </>
  )
}

export default function UserPermissionList() {
  const [search, setSearch] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRow | null>(
    null,
  )

  const { data: allEmployees = [], isLoading } = useAllEmployees()
  const { getLabel: getRoleLabel } = useRoleOptions()

  const filtered = useMemo(
    () =>
      allEmployees.filter(
        e => !search || e.name?.toLowerCase().includes(search.toLowerCase()),
      ),
    [allEmployees, search],
  )

  const columns = useMemo(
    () => [
      {
        title: '姓名',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: '角色',
        dataIndex: 'role',
        key: 'role',
        render: (role: AppRole | null) =>
          role
            ? (
                <StatusPill tone="info">{getRoleLabel(role)}</StatusPill>
              )
            : (
                <span className="text-slate-400 dark:text-slate-500">—</span>
              ),
      },
      {
        title: '状态',
        dataIndex: 'is_active',
        key: 'is_active',
        render: (val: boolean) => (
          <StatusPill tone={val !== false ? 'success' : 'neutral'}>
            {val !== false ? '在职' : '离职'}
          </StatusPill>
        ),
      },
      {
        title: '操作',
        key: 'action',
        render: (_: unknown, record: EmployeeRow) => (
          <Button
            type="link"
            size="small"
            onClick={() => setSelectedEmployee(record)}
          >
            管理权限覆盖
          </Button>
        ),
      },
    ],
    [getRoleLabel],
  )

  if (selectedEmployee) {
    return (
      <EmployeeDetailPanel
        key={selectedEmployee.id}
        employee={selectedEmployee}
        onBack={() => setSelectedEmployee(null)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <FilterBar>
        <Input.Search
          placeholder="搜索员工姓名"
          value={search}
          onChange={e => setSearch(e.target.value)}
          allowClear
          style={{ maxWidth: 280 }}
        />
      </FilterBar>

      <Table
        dataSource={filtered as EmployeeRow[]}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="small"
        rowClassName={zebraRowClassName}
        locale={{
          emptyText: (
            <TableEmpty
              title="暂无匹配员工"
              description="请尝试其他员工姓名关键词"
            />
          ),
        }}
        pagination={{ pageSize: 20 }}
      />
    </div>
  )
}
