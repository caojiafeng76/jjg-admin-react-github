import { useState } from 'react'
import { Button, Input, Table, Tag } from 'antd'
import { useAllEmployees } from '@/features/workshop/EmployeeList/useEmployees'
import { useRoleOptions } from '@/hooks/useRoleOptions'
import type { AppRole } from '@/config/access'
import type { Employee } from '@/services/apiEmployees'
import {
  useAllPermissions,
  useRolePermissionIds,
} from '../RolePermissionList/useRolePermissions'
import { useUserPermissionOverrides } from './useUserPermissions'
import { useUpdateUserPermissions } from './useUpdateUserPermissions'
import UserPermissionDetail from './UserPermissionDetail'

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
  const { data: allPermissions = [], isLoading: loadingAllPerms } =
    useAllPermissions()
  const { data: rolePermissionIds = [] } = useRolePermissionIds(
    employee.role ?? 'employee',
  )
  const { data: userOverrides = [], isLoading: loadingOverrides } =
    useUserPermissionOverrides(employee.id)
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
        onSave={(overrides) =>
          updateOverrides({ employeeId: employee.id, overrides })
        }
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

  const filtered = allEmployees.filter(
    (e) => !search || e.name?.toLowerCase().includes(search.toLowerCase()),
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

  const columns = [
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
        role ? (
          <Tag>{getRoleLabel(role)}</Tag>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (val: boolean) =>
        val !== false ? (
          <Tag color="success">在职</Tag>
        ) : (
          <Tag color="default">离职</Tag>
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
  ]

  return (
    <div className="flex flex-col gap-4">
      <Input.Search
        placeholder="搜索员工姓名"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        allowClear
        style={{ maxWidth: 280 }}
      />

      <Table
        dataSource={filtered as EmployeeRow[]}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="small"
        pagination={{ pageSize: 20 }}
      />
    </div>
  )
}
