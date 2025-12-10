import { useEffect } from 'react'

import { ConfigProvider, theme, App as AntdApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router-dom'

import ErrorBoundary from '@ui/ErrorBoundary'
import { useAppStore } from '@/store'
import { AuthProvider } from '@/contexts/AuthContext'
import { router } from '@/routes/router'
import { createQueryClient } from '@/config/queryClient'

// 创建 QueryClient 实例
const queryClient = createQueryClient()

export default function App() {
  const { isDarkMode } = useAppStore()

  const themeMode = isDarkMode
    ? {
        // 使用暗色算法
        algorithm: theme.darkAlgorithm,
      }
    : {}

  // 同步 Tailwind 暗黑模式：在 <html> 标签上添加 / 移除 `dark` class
  useEffect(() => {
    const root = document.documentElement
    if (isDarkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDarkMode])

  return (
    <ErrorBoundary>
      <ConfigProvider
        locale={zhCN}
        theme={themeMode}
      >
        <AntdApp>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <RouterProvider router={router} />
            </AuthProvider>
            {import.meta.env.DEV && (
            <ReactQueryDevtools initialIsOpen={false} />
            )}
          </QueryClientProvider>
        </AntdApp>
      </ConfigProvider>
    </ErrorBoundary>
  )
}
