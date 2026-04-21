import { Tabs } from 'antd'
import RolePermissionList from './RolePermissionList'
import UserPermissionList from './UserPermissionList'
import PermissionRegistry from './PermissionRegistry'

export default function AccessManagement() {
  const items = [
    {
      key: 'roles',
      label: '角色权限管理',
      children: <RolePermissionList />,
    },
    {
      key: 'users',
      label: '用户权限覆盖',
      children: <UserPermissionList />,
    },
    {
      key: 'registry',
      label: '权限注册表',
      children: <PermissionRegistry />,
    },
  ]

  return (
    <div className="h-full overflow-auto p-4">
      <Tabs items={items} destroyInactiveTabPane={false} />
    </div>
  )
}
