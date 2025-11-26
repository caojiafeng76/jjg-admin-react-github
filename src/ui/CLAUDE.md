# UI 模块 - 通用组件库

> [根目录](../../../CLAUDE.md) > [src](../../) > **ui**

---

## 模块职责

UI 模块提供应用的通用 UI 组件，负责：
- 布局组件（页面容器、头部、菜单）
- 操作按钮（增删改查、打印等）
- 全局组件（错误边界、加载状态）
- 分页组件
- 主题切换按钮

---

## 组件清单

### 布局组件
- **AppLayout.tsx** - 应用主布局容器（侧边栏 + 内容区）
- **AppHeader.tsx** - 应用顶部栏（Logo + 用户信息）
- **MainMenu.tsx** - 侧边栏菜单（路由导航）
- **AppLogo.tsx** - 应用 Logo 组件

### 操作按钮
- **AddButton.tsx** - 新增按钮（通用）
- **EditButton.tsx** - 编辑按钮（通用）
- **DeleteButton.tsx** - 删除按钮（带二次确认）
- **PrintButton.tsx** - 打印按钮（通用）

### 全局组件
- **ErrorBoundary.tsx** - React 错误边界（捕获组件错误）
- **Loading.tsx** - 全局加载状态组件

### 功能组件
- **AppPagination.tsx** - 分页组件（封装 Ant Design Pagination）
- **DarkModeButton.tsx** - 暗色模式切换按钮

---

## 核心组件详解

### 1. AppLayout.tsx - 应用主布局
```typescript
import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'
import MainMenu from './MainMenu'
import AppHeader from './AppHeader'

const { Sider, Content } = Layout

export default function AppLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible theme="dark">
        <AppLogo />
        <MainMenu />
      </Sider>
      <Layout>
        <AppHeader />
        <Content style={{ padding: '24px' }}>
          <Outlet /> {/* 渲染子路由 */}
        </Content>
      </Layout>
    </Layout>
  )
}
```

**特性**：
- 响应式侧边栏（支持折叠）
- 深色主题侧边栏
- 使用 React Router 的 `Outlet` 渲染子路由

### 2. MainMenu.tsx - 菜单导航
```typescript
const items: MenuItem[] = [
  {
    key: 'dashboard',
    label: '首页',
    icon: <HomeIcon className="size-4" />,
  },
  {
    key: 'syney',
    label: '西尼',
    icon: <Square3Stack3DIcon className="size-4" />,
    children: [
      { key: 'syney-po-list', label: '订单列表' },
      { key: 'syney-store-report-list', label: '入库单列表' },
      { key: 'syney-spec-list', label: '踏板规格列表' },
      { key: 'syney-setting', label: '设置' },
    ],
  },
]
```

**特性**：
- 自动高亮当前路由
- 自动展开当前菜单组
- 使用 Heroicons 作为图标库

### 3. ErrorBoundary.tsx - 错误边界
```typescript
export default class ErrorBoundary extends React.Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
    // 可以发送错误日志到监控服务
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="页面加载失败"
          subTitle="抱歉，页面遇到了错误，请刷新页面重试"
          extra={[
            <Button type="primary" onClick={() => window.location.reload()}>
              刷新页面
            </Button>,
          ]}
        />
      )
    }
    return this.props.children
  }
}
```

**用法**：
```typescript
// 在 App.tsx 中包裹根组件
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### 4. DarkModeButton.tsx - 暗色模式切换
```typescript
import { useAppStore } from '@/store'

export default function DarkModeButton() {
  const { isDarkMode, setIsDarkMode } = useAppStore()

  return (
    <Button
      icon={isDarkMode ? <SunIcon /> : <MoonIcon />}
      onClick={setIsDarkMode}
    />
  )
}
```

**特性**：
- 状态持久化（通过 Zustand + localStorage）
- 自动切换 Ant Design 主题算法（`theme.darkAlgorithm`）

---

## 样式规范

### Tailwind CSS 类名约定
- **尺寸**：使用 Tailwind 语义化类名（`size-4`、`w-full`、`h-screen`）
- **间距**：统一使用 `padding`/`margin` 类名（`p-4`、`mx-auto`）
- **颜色**：优先使用 Ant Design 主题色，避免硬编码颜色值

### Ant Design 组件定制
在 `App.tsx` 中使用 `ConfigProvider` 全局定制：
```typescript
<ConfigProvider
  theme={{
    algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 4,
    },
  }}
>
  <App />
</ConfigProvider>
```

---

## 组件开发规范

### 1. 组件命名
- 文件名：PascalCase（如 `AppLayout.tsx`）
- 组件名：与文件名一致
- 导出方式：默认导出（`export default AppLayout`）

### 2. Props 类型定义
```typescript
interface AppHeaderProps {
  title?: string
  showUser?: boolean
  onLogout?: () => void
}

export default function AppHeader({ title = '精加工车间管理系统', showUser = true }: AppHeaderProps) {
  // ...
}
```

### 3. 组件结构
```typescript
// 1. 导入依赖
import React from 'react'
import { Button } from 'antd'

// 2. 类型定义
interface Props { /* ... */ }

// 3. 组件主体
export default function MyComponent({ prop1, prop2 }: Props) {
  // Hooks
  const [state, setState] = useState()

  // 事件处理
  const handleClick = () => { /* ... */ }

  // 渲染
  return <div>...</div>
}
```

---

## 常见问题 (FAQ)

### 1. 如何添加新的菜单项？
编辑 `MainMenu.tsx` 的 `items` 数组：
```typescript
const items: MenuItem[] = [
  // ...
  {
    key: 'new-module',
    label: '新模块',
    icon: <Icon />,
    children: [
      { key: 'new-module-page', label: '新页面' },
    ],
  },
]
```

同时在 `App.tsx` 中添加路由：
```typescript
<Route path="/new-module-page" element={<NewModulePage />} />
```

### 2. 如何自定义 Ant Design 主题色？
在 `App.tsx` 的 `ConfigProvider` 中修改 `token`：
```typescript
<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#00b96b',  // 修改主色调
      colorSuccess: '#52c41a',
      colorWarning: '#faad14',
      colorError: '#f5222d',
    },
  }}
>
  {/* ... */}
</ConfigProvider>
```

### 3. ErrorBoundary 未捕获错误？
ErrorBoundary 只能捕获**组件生命周期**中的错误，无法捕获：
- 事件处理函数中的错误（需手动 try-catch）
- 异步代码中的错误（使用 `.catch()` 或 `async/await` + `try-catch`）
- 服务端渲染错误

### 4. 如何统一管理全局 Loading 状态？
使用 Zustand 全局状态：
```typescript
// store/index.ts
export const useAppStore = create<State & Actions>()((set) => ({
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
}))

// 在组件中使用
const { isLoading, setIsLoading } = useAppStore()
setIsLoading(true)
```

---

## 相关文件清单

- `AppLayout.tsx` - 应用主布局
- `AppHeader.tsx` - 应用头部栏
- `MainMenu.tsx` - 侧边栏菜单
- `AppLogo.tsx` - Logo 组件
- `AddButton.tsx` - 新增按钮
- `EditButton.tsx` - 编辑按钮
- `DeleteButton.tsx` - 删除按钮
- `PrintButton.tsx` - 打印按钮
- `ErrorBoundary.tsx` - 错误边界
- `Loading.tsx` - 加载状态
- `AppPagination.tsx` - 分页组件
- `DarkModeButton.tsx` - 暗色模式切换

---

## 变更记录 (Changelog)

### 2025-11-26
- 初始化 UI 模块文档
- 记录所有通用组件

---

**下一步建议**：
1. 添加 Storybook 用于组件预览
2. 提取组件样式为独立的 CSS 模块
3. 添加组件单元测试
