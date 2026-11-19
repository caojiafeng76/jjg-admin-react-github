import type { AppRole } from '@/config/access'
import { PlusCircleIcon, TrashIcon } from '@heroicons/react/16/solid'
import { App, Button, Radio, Skeleton } from 'antd'
import { useEffect, useState } from 'react'
import { ROLE_LABELS } from '@/config/access'
import StatusPill from '@/ui/StatusPill'
import RoleCreateModal from './RoleCreateModal'
import RolePermissionDetail from './RolePermissionDetail'
import { useAllPermissions, useRolePermissionIds } from './useRolePermissions'
import { useDeleteRole, useRoles } from './useRoles'
import { useUpdateRolePermissions } from './useUpdateRolePermissions'

export default function RolePermissionList() {
  const { modal } = App.useApp()
  const [selectedRole, setSelectedRole] = useState<string>('admin')
  const [createOpen, setCreateOpen] = useState(false)

  const { data: roles = [], isLoading: loadingRoles } = useRoles()
  const { data: allPermissions = [], isLoading: loadingPerms }
    = useAllPermissions()
  const { data: checkedIds = [], isLoading: loadingRolePerms }
    = useRolePermissionIds(selectedRole)
  const {
    mutate: updatePermissions,
    isPending: saving,
    contextHolder: updateContextHolder,
  } = useUpdateRolePermissions()
  const {
    mutate: deleteRole,
    isPending: deleting,
    contextHolder: deleteContextHolder,
  } = useDeleteRole()

  // 角色加载后，若当前选中角色不存在则回退到第一个
  useEffect(() => {
    if (roles.length === 0)
      return
    if (!roles.some(r => r.key === selectedRole)) {
      setSelectedRole(roles[0].key)
    }
  }, [roles, selectedRole])

  const handleSave = (permissionIds: string[]) => {
    updatePermissions({ role: selectedRole, permissionIds })
  }

  const currentRole = roles.find(r => r.key === selectedRole)
  const currentLabel
    = currentRole?.label ?? ROLE_LABELS[selectedRole as AppRole] ?? selectedRole

  const handleDelete = () => {
    if (!currentRole || currentRole.is_builtin)
      return
    modal.confirm({
      title: `删除角色「${currentRole.label}」`,
      content:
        '此操作会同时删除该角色的所有权限绑定，且不可恢复。已分配该角色的员工将失去对应权限。确认删除？',
      okText: '确认删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => deleteRole(currentRole.key),
    })
  }

  if (loadingRoles && roles.length === 0) {
    return <Skeleton active paragraph={{ rows: 4 }} />
  }

  return (
    <div className="flex flex-col gap-4">
      {updateContextHolder}
      {deleteContextHolder}

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          选择角色：
        </span>
        <Radio.Group
          value={selectedRole}
          onChange={e => setSelectedRole(e.target.value)}
          optionType="button"
          buttonStyle="solid"
        >
          {roles.map(r => (
            <Radio.Button key={r.key} value={r.key}>
              {r.label}
              {!r.is_builtin && (
                <StatusPill tone="warning" className="ml-1.5">
                  自定义
                </StatusPill>
              )}
            </Radio.Button>
          ))}
        </Radio.Group>
        <Button
          type="primary"
          icon={<PlusCircleIcon className="size-4" />}
          onClick={() => setCreateOpen(true)}
        >
          新建角色
        </Button>
        {currentRole && !currentRole.is_builtin && (
          <Button
            danger
            icon={<TrashIcon className="size-4" />}
            loading={deleting}
            onClick={handleDelete}
          >
            删除该角色
          </Button>
        )}
      </div>

      <RolePermissionDetail
        role={selectedRole}
        roleLabel={currentLabel}
        allPermissions={allPermissions}
        checkedIds={checkedIds}
        loading={loadingPerms || loadingRolePerms}
        saving={saving}
        onSave={handleSave}
      />

      <RoleCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={key => setSelectedRole(key)}
      />
    </div>
  )
}
