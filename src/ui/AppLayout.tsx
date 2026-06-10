import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { theme, Layout, message, Spin } from 'antd'
import { useLocation, useOutlet } from 'react-router-dom'

import MainMenu from '@ui/MainMenu'
import AppHeader from '@ui/AppHeader'
import AppLogo from './AppLogo'
import EmployeeMobileLayout from './EmployeeMobileLayout'
import PageTabs from './PageTabs'
import { getLocationKey, type PageTab } from './pageTabsUtils'
import { getDefaultHomeByRole, isEmployeeSideRole } from '@/config/access'
import { useAuth } from '@/contexts/useAuth'
import { usePermissionContext } from '@/contexts/usePermissionContext'
import { translateErrorMessage } from '@/utils/errorHandler'

const { Content, Sider } = Layout

export default function AppLayout() {
  const { error, clearError, role } = useAuth()
  const { isLoading: permLoading } = usePermissionContext()
  const outlet = useOutlet()
  const [messageApi, contextHolder] = message.useMessage()
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const [isNavigating, setIsNavigating] = useState(false)
  const [permLoadBlock, setPermLoadBlock] = useState(false)
  const prevPermLoadingRef = useRef(false)
  const [pageTabs, setPageTabs] = useState<PageTab[]>([])
  const [cachedOutlets, setCachedOutlets] = useState<Record<string, ReactNode>>(
    {},
  )
  const prevPathnameRef = useRef(location.pathname)
  const cachedOutletsRef = useRef(cachedOutlets)
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const homeKey = role ? getDefaultHomeByRole(role) : null
  const activeKey = getLocationKey(location, homeKey)

  // 计算可见的 outlet：用 useMemo 同步计算，确保路由变化时立即显示内容。
  // useEffect 负责将 outlet 同步到 state，供其他依赖 cachedOutlets 的逻辑使用。
  const visibleOutlets = useMemo<Record<string, ReactNode>>(() => {
    if (!outlet) return cachedOutlets

    return {
      ...cachedOutlets,
      [activeKey]: outlet,
    }
  }, [activeKey, cachedOutlets, outlet])

  const outletEntries = useMemo(
    () => Object.entries(visibleOutlets),
    [visibleOutlets],
  )

  function onToggleCollapse() {
    setCollapsed(!collapsed)
  }

  const handleTabsChange = useCallback((nextTabs: PageTab[]) => {
    setPageTabs(nextTabs)
  }, [])

  useEffect(() => {
    cachedOutletsRef.current = cachedOutlets
  }, [cachedOutlets])

  useEffect(() => {
    // 根路径只承载异步首页重定向，缓存后会在隐藏状态继续触发 Navigate。
    if (!outlet || location.pathname === '/') return

    setCachedOutlets((currentOutlets) => {
      if (currentOutlets[activeKey]) return currentOutlets

      return {
        ...currentOutlets,
        [activeKey]: outlet,
      }
    })
  }, [activeKey, location.pathname, outlet])

  useEffect(() => {
    const availableKeys = new Set(pageTabs.map((tab) => tab.key))
    availableKeys.add(activeKey)

    setCachedOutlets((currentOutlets) => {
      const nextOutlets = Object.fromEntries(
        Object.entries(currentOutlets).filter(([key]) => availableKeys.has(key)),
      )

      return Object.keys(nextOutlets).length === Object.keys(currentOutlets).length
        ? currentOutlets
        : nextOutlets
    })
  }, [activeKey, pageTabs])

  useEffect(() => {
    if (prevPathnameRef.current !== location.pathname) {
      const nextActiveKey = getLocationKey(location, homeKey)
      setIsNavigating(!cachedOutletsRef.current[nextActiveKey])
      prevPathnameRef.current = location.pathname

      const timer = setTimeout(() => {
        setIsNavigating(false)
      }, 150)

      return () => clearTimeout(timer)
    }
  }, [homeKey, location])

  useEffect(() => {
    if (permLoading && !prevPermLoadingRef.current) {
      setPermLoadBlock(true)
    } else if (!permLoading && prevPermLoadingRef.current) {
      setPermLoadBlock(false)
    }
    prevPermLoadingRef.current = permLoading
  }, [permLoading])

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
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            <MainMenu />
          </div>
        </Sider>
        <Layout>
          <AppHeader
            colorBgContainer={colorBgContainer}
            collapsed={collapsed}
            onToggleCollapse={onToggleCollapse}
          />
          <PageTabs onTabsChange={handleTabsChange} />
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
            {permLoadBlock && (
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
                  zIndex: 11,
                  borderRadius: borderRadiusLG,
                  backdropFilter: 'blur(2px)',
                }}
              >
                <Spin size="large" tip="权限加载中..." />
              </div>
            )}
            {outletEntries.map(([key, cachedOutlet]) => (
              <div
                key={key}
                className="min-h-0 flex-1 flex-col overflow-hidden"
                style={{ display: key === activeKey ? 'flex' : 'none' }}
              >
                {cachedOutlet}
              </div>
            ))}
          </Content>
        </Layout>
      </Layout>
    </>
  )
}
