import { useEffect, useState, useRef } from 'react'
import { theme, Layout, message, Spin } from 'antd'
import { Outlet, useLocation } from 'react-router-dom'

import MainMenu from '@ui/MainMenu'
import AppHeader from '@ui/AppHeader'
import AppLogo from './AppLogo'
import EmployeeMobileLayout from './EmployeeMobileLayout'
import { isEmployeeSideRole } from '@/config/access'
import { useAuth } from '@/contexts/AuthContext'
import { translateErrorMessage } from '@/utils/errorHandler'

const { Content, Sider } = Layout

export default function AppLayout() {
  const { error, clearError, role } = useAuth()
  const [messageApi, contextHolder] = message.useMessage()
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const [isNavigating, setIsNavigating] = useState(false)
  const prevPathnameRef = useRef(location.pathname)
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  function onToggleCollapse() {
    setCollapsed(!collapsed)
  }

  // 检测路由变化，显示导航 loading
  useEffect(() => {
    if (prevPathnameRef.current !== location.pathname) {
      setIsNavigating(true)
      prevPathnameRef.current = location.pathname

      // 短暂延迟后隐藏 loading，给 Suspense 和页面组件时间显示其 loading 状态
      // 这个延迟确保用户能看到切换反馈，但不会太长影响体验
      const timer = setTimeout(() => {
        setIsNavigating(false)
      }, 150)

      return () => clearTimeout(timer)
    }
  }, [location.pathname])

  // 全局监听认证错误，使用 Antd message 顶部提示
  useEffect(() => {
    if (!error) return

    const message = error.message || '认证出现问题，请稍后重试'
    messageApi.error(translateErrorMessage(message))
    clearError()
  }, [error, messageApi, clearError])

  if (isEmployeeSideRole(role)) {
    return (
      <>
        {contextHolder}
        <EmployeeMobileLayout />
      </>
    )
  }

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
              position: 'relative',
            }}
          >
            {isNavigating && (
              <div
                className="bg-white/80 dark:bg-black/60"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 10,
                  borderRadius: borderRadiusLG,
                  backdropFilter: 'blur(2px)',
                }}
              >
                <Spin size="large" tip="切换中..." />
              </div>
            )}
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </>
  )
}
