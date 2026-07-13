import { useEffect, useMemo, useState } from 'react'

import { ConfigProvider, theme, App as AntdApp } from 'antd'
import zhCN from 'antd/es/locale/zh_CN'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router-dom'

import ErrorBoundary from '@ui/ErrorBoundary'
import { useAppStore } from '@/store'
import { AuthProvider } from '@/contexts'
import { PermissionProvider } from '@/contexts'
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
}

const TABLE_TOKENS = {
  cellFontSize: 12,
  cellFontSizeMD: 12,
  cellFontSizeSM: 12,
  cellPaddingBlock: 4,
  cellPaddingBlockMD: 4,
  cellPaddingBlockSM: 4,
  cellPaddingInline: 6,
  cellPaddingInlineMD: 6,
  cellPaddingInlineSM: 6,
  selectionColumnWidth: 30,
}

const DATE_PICKER_CONFIG = {
  classNames: {
    popup: {
      container: 'max-[599.98px]:[&_.ant-picker-panels]:flex-col',
    },
  },
}

export default function App() {
  const isDarkMode = useAppStore((state) => state.isDarkMode)
  const [isMobileViewport, setIsMobileViewport] = useState(false)

  const themeConfig = useMemo(
    () => ({
      ...(isDarkMode ? { algorithm: theme.darkAlgorithm } : {}),
      token: {
        ...BASE_TOKENS,
        colorTextSecondary: isDarkMode
          ? 'rgba(255,255,255,0.65)'
          : 'rgba(0,0,0,0.45)',
      },
      components: {
        Table: {
          ...TABLE_TOKENS,
          headerBg: isDarkMode ? '#1e293b' : '#f8fafc',
          headerColor: isDarkMode ? '#cbd5e1' : '#475569',
          rowHoverBg: isDarkMode ? '#172033' : '#f8fafc',
          rowSelectedBg: isDarkMode ? '#172554' : '#eff6ff',
          rowSelectedHoverBg: isDarkMode ? '#1e3a8a' : '#dbeafe',
          borderColor: isDarkMode ? '#334155' : '#e2e8f0',
        },
      },
    }),
    [isDarkMode],
  )

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
      <ConfigProvider
        locale={zhCN}
        theme={themeConfig}
        datePicker={DATE_PICKER_CONFIG}
      >
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
