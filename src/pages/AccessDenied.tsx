import { LogoutOutlined, LoginOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/contexts/useAuth'
import AppErrorView from '@ui/AppErrorView'

export default function AccessDenied() {
  const navigate = useNavigate()
  const { user, role, employeeProfile, signOut } = useAuth()

  const description = !user
    ? '当前登录信息已失效，请重新登录。'
    : !employeeProfile
      ? '当前账号尚未绑定员工资料，请联系管理员完成账号绑定后再登录。'
      : employeeProfile.is_active === false
        ? '当前员工账号已停用，请联系管理员确认权限状态。'
        : !role
          ? '当前员工资料尚未配置角色，请联系管理员补充角色后再登录。'
          : '当前账号暂无访问该页面的权限。'

  return (
    <AppErrorView
      variant="permission"
      title="当前账号暂无可用前端入口"
      badge="权限限制"
      description={description}
      detail={`账号邮箱：${user?.email || '未登录'}`}
      actions={[
        {
          key: 'login',
          label: '返回登录页',
          type: 'primary',
          icon: <LoginOutlined />,
          onClick: () => navigate('/login', { replace: true }),
        },
        ...(user
          ? [
              {
                key: 'signout',
                label: '退出当前账号',
                icon: <LogoutOutlined />,
                onClick: async () => {
                  await signOut()
                  navigate('/login', { replace: true })
                },
              },
            ]
          : []),
      ]}
    />
  )
}
