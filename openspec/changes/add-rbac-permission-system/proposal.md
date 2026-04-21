## Why

当前系统的访问控制完全硬编码在菜单和路由守卫中（按固定角色判断），无法对同一角色的不同用户做差异化授权，新增模块也必须手动修改多处文件。需要一套可配置的细粒度权限层，覆盖 PC 管理端和移动端 H5，支持导航/页面/功能/字段四个级别的权限管控，并提供后台管理界面和代码自动注册机制。

## What Changes

- **新增** `permissions`、`role_permissions`、`user_permission_overrides` 三张数据库表及 `get_my_permissions()` 函数
- **新增** 权限类型定义 `src/types/permission.ts`（`PermissionDefinition`、`PermissionMap`、`FieldPermissionState` 等）
- **新增** 全局权限注册表 `src/config/permissionRegistry.ts`，聚合所有模块的权限声明
- **新增** 权限 Context `src/contexts/PermissionContext.tsx`，启动时从 Supabase 加载当前用户权限集
- **新增** 权限 Hooks：`usePermission` / `useFeaturePermission` / `usePermissions` / `useFieldPermission`
- **新增** UI 组件：`<PermissionGate>` / `<PermissionButton>` / `<PermissionField>`
- **新增** 权限管理后台模块 `src/features/access-management/`（角色权限配置、用户权限覆盖、权限清单只读列表）
- **新增** 各业务模块的 `permissions.ts` 权限声明文件（初始版本覆盖全量权限清单）
- **修改** `MainMenu.tsx`：从硬编码角色分支改为基于权限 Context 动态过滤菜单项
- **修改** 移动端导航/路由守卫：从 `EMPLOYEE_SIDE_ROLES` 判断改为 `page:mobile-*` 权限校验
- **修改** `RoleProtectedRoute`：改为 `PermissionProtectedRoute`，基于权限 key 保护路由
- **新增** 路由 `/access-management` 及子路由，仅 admin 可访问

## Capabilities

### New Capabilities

- `permission-data-layer`: 数据库表结构（permissions / role_permissions / user_permission_overrides）及 get_my_permissions 函数
- `permission-context-and-hooks`: 前端权限 Context、加载逻辑、四个核心 Hook（usePermission / useFeaturePermission / usePermissions / useFieldPermission）
- `permission-ui-components`: 三个 UI 封装组件（PermissionGate / PermissionButton / PermissionField）
- `permission-registry`: 全局权限注册表、各模块 permissions.ts 声明、管理员登录时自动同步到数据库
- `permission-management-ui`: 权限管理后台（角色权限配置、用户权限覆盖、权限清单只读列表）
- `permission-menu-and-routing`: MainMenu 动态过滤、移动端导航/路由守卫接入权限层

### Modified Capabilities

<!-- 无既有 spec 需要变更 -->

## Impact

- **数据库**：新增 3 张表，1 个 PLPGSQL 函数，启用 RLS；无破坏性变更，不修改现有表
- **前端入口**：`src/App.tsx` 或 `src/main.tsx` 需在顶层包裹 `PermissionContext.Provider`
- **路由层**：`src/routes/` 现有守卫替换/扩展，需兼容旧角色检查（Phase 1 并存，Phase 2 迁移）
- **菜单**：`MainMenu.tsx` 重构，移除硬编码角色分支
- **依赖**：无新增第三方依赖，仅使用现有 Supabase / TanStack Query / Ant Design / Zustand
- **范围**：不涉及现有业务数据表，不影响生产工单/物料转移单等现有功能的数据逻辑
