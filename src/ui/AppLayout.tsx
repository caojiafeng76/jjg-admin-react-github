import { useState } from 'react'
import { theme, Layout } from 'antd'
import { Outlet } from 'react-router-dom'

import MainMenu from '@ui/MainMenu'
import AppHeader from '@ui/AppHeader'
import AppLogo from './AppLogo'

const { Content, Sider } = Layout

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  function onToggleCollapse() {
    setCollapsed(!collapsed)
  }

  return (
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
          className=""
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
  )
}
