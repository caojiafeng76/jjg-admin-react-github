# UI 模块 - 通用组件库

> [根目录](../../CLAUDE.md) > [src](../) > **ui**
>
> 页面怎么组合这些组件（骨架、反馈、出错/无权限、表格、URL 状态、表单弹层）见 **[docs/前端交互与反馈规范.md](../../docs/前端交互与反馈规范.md)**；本文只列出组件清单和职责。

---

## 布局与导航

| 组件 | 职责 |
|---|---|
| `AppLayout.tsx` | 管理端主布局：浅色侧边栏 + 顶栏 + `PageTabs` + Content（`app-card`，12px 内边距）。用 `<Activity>` 缓存最多 8 个标签页的页面实例 |
| `EmployeeMobileLayout.tsx` | 员工端（手机）布局，由角色决定是否使用 |
| `AppHeader.tsx` / `AppLogo.tsx` | 顶栏（页面名来自 `routes/routeLabels.ts`）、Logo |
| `MainMenu.tsx` / `mainMenuItems.tsx` | 侧边菜单与菜单配置（按 `nav:*` / `page:*` 权限过滤）。点击菜单进入已打开的页面时，恢复该标签页记录的完整地址 |
| `PageTabs.tsx` / `pageTabsUtils.ts` | 多标签页：按 pathname 区分标签，记录每个标签的完整 href |
| `DarkModeButton.tsx` | 暗色切换（Zustand `isDarkMode`，同步 antd 算法和 `<html class="dark">`） |

## 页面状态（加载 / 空 / 错误 / 无权限）

| 组件 | 职责 |
|---|---|
| `TableState.tsx` | `TableState`（骨架屏 / 错误重试 / 内容）、`TableSkeleton`、`TableEmpty`、`TableError`（失败原因 + 技术详情） |
| `FormErrorAlert.tsx` | 表单内的「失败原因 + 影响 + 建议」结构化错误提示 |
| `ErrorTechnicalDetail.tsx` | 可折叠、可复制的技术详情（错误码 / 数据库原文） |
| `PageErrorBoundary.tsx` | 页面级错误边界，由 `permissionRoute` 自动挂载。出错时只替换内容区，提供重试 |
| `PageForbidden.tsx` | 布局内 403（当前页面无权限） |
| `ErrorBoundary.tsx` / `AppErrorView.tsx` | 应用根错误边界与全屏错误视图（根路由、公开页使用） |
| `Loading.tsx` | 路由懒加载 Suspense 占位 |

## 操作按钮（统一为 `type="text"` 加彩色 heroicon，传 `permissionKey` 后无权限时显示为禁用并提示）

`AddButton` · `EditButton` · `DeleteButton`（Popconfirm 确认，显式传 `title` / `itemName` / `count`）· `ExportButton` · `ImportButton` · `DownloadTemplateButton` · `PrintButton`

## 权限

| 组件 | 职责 |
|---|---|
| `PermissionButton.tsx` | 自定义按钮的权限包装：无权限时禁用并显示 Tooltip |
| `PermissionGate.tsx` | 按权限隐藏或禁用任意子元素 |
| `PermissionField.tsx` | 带权限三态的 `Form.Item` |

## 数据展示

| 组件 | 职责 |
|---|---|
| `AppPagination.tsx` | URL 驱动的分页（`page` / `pageSize`，replace 模式），默认值见 `config/pagination.ts` |
| `StatusPill.tsx` | 状态徽章（替代各模块自写的 `Tag color` 映射） |
| `SelectedSummaryBar.tsx` | 已选行摘要条 |
| `ExcelParseErrorList.tsx` | Excel 导入解析错误列表 |
| `AppQRCode.tsx` | 二维码 |

## 员工端 / 移动端（`mobile/`）

`MobileScanPageShell` · `MobileBottomSelectSheet` · `MobileNumberInput` · `MobileProjectSummaryCard` · `EmployeeChangePasswordForm` / `EmployeeMobileChangePasswordPage`

---

## 约定

- 新增通用组件前，先确认现有组件不能满足；同类组件只保留一个（例如状态徽章只用 `StatusPill`）。
- 组件文件用 PascalCase 并默认导出；Props 类型命名为 `{ComponentName}Props`。
- 样式用 Tailwind：灰阶只用 `slate-*` 且成对写 `dark:`；图标用 `@heroicons/react/16/solid`，尺寸 `size-4`。
- 主题 token 在 `App.tsx` 的 `ConfigProvider` 中集中配置（`colorPrimary #2563eb`，`borderRadius 8`），由 `SyncThemeTokens` 同步到 CSS 变量。
- 测试文件与组件放在同一目录，命名为 `*.vitest.tsx`。

## 变更记录

- 2026-10-21：按实际代码重写组件清单；新增 `PageErrorBoundary`、`PageForbidden`、`ErrorTechnicalDetail`；`DeleteButton` 默认文案改为中性的「删除记录」；`AppPagination` 改为 replace 模式。
- 2025-11-26：初始化文档。
