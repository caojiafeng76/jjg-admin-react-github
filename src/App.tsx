import { useEffect, useState } from 'react'

import { ConfigProvider, theme, App as AntdApp } from 'antd'
import zhCN from 'antd/es/locale/zh_CN'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router-dom'

import ErrorBoundary from '@ui/ErrorBoundary'
import { useAppStore } from '@/store'
import { AuthProvider } from '@/contexts/AuthContext'
import { PermissionProvider } from '@/contexts/PermissionContext'
import { router } from '@/routes/router'
import { createQueryClient } from '@/config/queryClient'

// 创建 QueryClient 实例
const queryClient = createQueryClient()

// 全局主题 token —— 所有 Ant Design 组件以此为基准
// 修改这里即可统一全站风格；不要在各组件内散写 style 覆盖
const BASE_TOKENS = {
  colorPrimary: '#1677ff',
  borderRadius: 6, // 基准圆角（sm: 4, base: 6, lg: 8）
  borderRadiusSM: 4,
  borderRadiusLG: 8,
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
  fontSize: 14,
  colorTextSecondary: 'rgba(0,0,0,0.45)', // 统一次要文字色
}

export default function App() {
  const { isDarkMode } = useAppStore()
  const [isMobileViewport, setIsMobileViewport] = useState(false)

  const themeConfig = {
    ...(isDarkMode ? { algorithm: theme.darkAlgorithm } : {}),
    token: BASE_TOKENS,
  }

  // 同步 Tailwind 暗黑模式：在 <html> 标签上添加 / 移除 `dark` class
  useEffect(() => {
    const root = document.documentElement
    if (isDarkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDarkMode])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)')

    const syncViewport = (event?: MediaQueryListEvent) => {
      setIsMobileViewport(event ? event.matches : mediaQuery.matches)
    }

    syncViewport()
    mediaQuery.addEventListener('change', syncViewport)

    return () => {
      mediaQuery.removeEventListener('change', syncViewport)
    }
  }, [])

  return (
    <ErrorBoundary>
      <ConfigProvider locale={zhCN} theme={themeConfig}>
        <AntdApp>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <PermissionProvider>
                <RouterProvider router={router} />
              </PermissionProvider>
            </AuthProvider>
            {import.meta.env.DEV && !isMobileViewport && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </QueryClientProvider>
        </AntdApp>
      </ConfigProvider>
    </ErrorBoundary>
  )
}
