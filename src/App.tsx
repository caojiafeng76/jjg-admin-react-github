import { useEffect, useMemo, useState } from 'react'

import { ConfigProvider, theme, App as AntdApp } from 'antd'
import { StyleProvider } from '@ant-design/cssinjs'
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
  colorPrimary: '#2563eb', // 品牌主色（替换 antd 出厂默认 #1677ff）
  colorInfo: '#2563eb', // 信息色跟随主色
  borderRadius: 8, // 基准圆角（sm: 6, base: 8, lg: 12）
  borderRadiusSM: 6,
  borderRadiusLG: 12,
  controlHeight: 34, // 控件高度 32 → 34，更舒展
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
  fontSize: 14,
}

const TABLE_TOKENS = {
  // 默认/中等密度放松：13px 字 / 8px 行高 / 12px 内边距
  cellFontSize: 13,
  cellFontSizeMD: 13,
  cellFontSizeSM: 12, // size="small" 局部降级：保持旧紧凑密度
  cellPaddingBlock: 8,
  cellPaddingBlockMD: 8,
  cellPaddingBlockSM: 4,
  cellPaddingInline: 12,
  cellPaddingInlineMD: 12,
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

// 桥接 antd token 到 :root（B1 风险修复）
// antd cssVar 变量默认挂在组件根元素上，作用域外的元素（如脱离 antd
// 组件的裸 DOM、portal 内容）解析不到。此组件把 Tailwind @theme inline
// 引用的 token 显式写到 <html>（:root），使任意位置都能解析；
// 主题/暗色切换时 token 变化，effect 自动同步。值仍以 App.tsx 为唯一来源。
function SyncThemeTokens() {
  const { token } = theme.useToken()

  useEffect(() => {
    const root = document.documentElement
    const vars: Record<string, string> = {
      '--jjg-color-primary': token.colorPrimary,
      '--jjg-color-primary-hover': token.colorPrimaryHover,
      '--jjg-color-success': token.colorSuccess,
      '--jjg-color-warning': token.colorWarning,
      '--jjg-color-error': token.colorError,
      '--jjg-color-info': token.colorInfo,
      '--jjg-border-radius': `${token.borderRadius}px`,
      '--jjg-border-radius-sm': `${token.borderRadiusSM}px`,
      '--jjg-border-radius-lg': `${token.borderRadiusLG}px`,
      '--jjg-color-text-secondary': token.colorTextSecondary,
      '--jjg-color-text-tertiary': token.colorTextTertiary,
      '--jjg-color-split': token.colorSplit,
    }
    Object.entries(vars).forEach(([name, value]) =>
      root.style.setProperty(name, value),
    )
  }, [token])

  return null
}

export default function App() {
  const isDarkMode = useAppStore((state) => state.isDarkMode)
  const [isMobileViewport, setIsMobileViewport] = useState(false)

  const themeConfig = useMemo(
    () => ({
      // B1: 开启 CSS 变量模式，token 输出为 --jjg-* 变量，
      // 供 Tailwind @theme inline 桥接引用（index.css），
      // 使 antd token 成为颜色/圆角唯一来源
      cssVar: { prefix: 'jjg' },
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
        Menu: {
          // A7: 激活态圆角高亮块（8px 圆角 + 主色 8% 背景）
          itemBorderRadius: 8,
          itemSelectedBg: 'rgba(37, 99, 235, 0.08)',
          itemSelectedColor: '#2563eb',
          // 暗色：菜单背景与 Sider slate-900 统一，激活态淡主色块
          darkItemBg: '#0f172a',
          darkSubMenuItemBg: '#0f172a',
          darkPopupBg: '#0f172a',
          darkItemHoverBg: 'rgba(148, 163, 184, 0.12)',
          darkItemSelectedBg: 'rgba(37, 99, 235, 0.16)',
          darkItemSelectedColor: '#bfdbfe',
          // 分组标题（group type 预留，当前菜单为 submenu 结构）
          groupTitleFontSize: 12,
          groupTitleColor: '#64748b',
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
      {/* B1: StyleProvider layer 将 antd 样式包进 @layer antd，
          使 Tailwind utilities（utilities 层）可以覆盖 antd 样式 */}
      <StyleProvider layer>
        <ConfigProvider
          locale={zhCN}
          theme={themeConfig}
          datePicker={DATE_PICKER_CONFIG}
        >
          <AntdApp>
            <SyncThemeTokens />
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
      </StyleProvider>
    </ErrorBoundary>
  )
}
