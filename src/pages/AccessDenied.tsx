import { Button, Card, Space, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/contexts/AuthContext'

const { Paragraph, Title, Text } = Typography

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
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-xl shadow-lg">
        <Space direction="vertical" size={12} className="w-full">
          <Title level={3} style={{ marginBottom: 0 }}>
            当前账号暂无可用前端入口
          </Title>
          <Paragraph className="text-sm text-slate-600" style={{ marginBottom: 0 }}>
            {description}
          </Paragraph>
          <Text type="secondary">
            账号邮箱：{user?.email || '未登录'}
          </Text>
          <Space>
            <Button type="primary" onClick={() => navigate('/login', { replace: true })}>
              返回登录页
            </Button>
            {user ? (
              <Button
                onClick={async () => {
                  await signOut()
                  navigate('/login', { replace: true })
                }}
              >
                退出当前账号
              </Button>
            ) : null}
          </Space>
        </Space>
      </Card>
    </div>
  )
}