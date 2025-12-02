import { useEffect, useState } from 'react'
import { theme, Layout, message } from 'antd'
import { Outlet } from 'react-router-dom'

import MainMenu from '@ui/MainMenu'
import AppHeader from '@ui/AppHeader'
import AppLogo from './AppLogo'
import { useAuth } from '@/contexts/AuthContext'

const { Content, Sider } = Layout

export default function AppLayout() {
  const { error, clearError } = useAuth()
  const [messageApi, contextHolder] = message.useMessage()
  const [collapsed, setCollapsed] = useState(false)
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  function onToggleCollapse() {
    setCollapsed(!collapsed)
  }

  // 全局监听认证错误，使用 Antd message 顶部提示
  useEffect(() => {
    if (!error) return

    messageApi.error(error.message || '认证出现问题，请稍后重试')
    clearError()
  }, [error, messageApi, clearError])

  return (
    <>
      {contextHolder}
      <Layout className="h-screen overflow-hidden">
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <AppLogo />
        <MainMenu />
      </Sider>
      <Layout>
        <AppHeader
          colorBgContainer={colorBgContainer}
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
        />
        <Content
          className="flex flex-col overflow-hidden"
          style={{
            margin: '12px 8px',
            padding: 12,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
    </>
  )
}
