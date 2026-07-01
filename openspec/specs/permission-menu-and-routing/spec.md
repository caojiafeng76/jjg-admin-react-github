# permission-menu-and-routing Specification

## Purpose
TBD - created by archiving change add-rbac-permission-system. Update Purpose after archive.
## Requirements
### Requirement: PC 端主菜单由权限 Context 动态过滤

系统 SHALL 重构 `MainMenu.tsx`，将所有菜单项统一定义为带 `permission` 字段的数组（`MenuItemWithPermission[]`），运行时调用 `filterMenuByPermissions(items, can)` 过滤出当前用户有权限访问的菜单项，不再硬编码角色分支。

#### Scenario: 有 nav 权限的用户看到对应菜单项

- **WHEN** 用户拥有 nav:syney 权限
- **THEN** 主菜单中"西尼"分组可见

#### Scenario: 无 nav 权限的用户不看到菜单项

- **WHEN** 用户不拥有 nav:workshop-order-list 权限
- **THEN** 主菜单中订单管理分组不可见

#### Scenario: 菜单顺序保持不变

- **WHEN** 权限过滤执行
- **THEN** 可见菜单项的相对顺序与原始数组定义一致，不重排

### Requirement: PC 端路由守卫基于 page 权限检查

系统 SHALL 提供 `PermissionProtectedRoute` 组件，替换现有的 `RoleProtectedRoute`，对路由进行 `page:*` 权限检查；无权限时重定向到 403 页面或首页，并显示友好提示。

#### Scenario: 有 page 权限时正常访问

- **WHEN** 用户拥有 page:syney-po-list 权限并访问对应路由
- **THEN** 页面正常渲染

#### Scenario: 无 page 权限时重定向

- **WHEN** 用户不拥有对应 page 权限
- **THEN** 重定向到 403 页面或首页，显示"无访问权限"提示

### Requirement: 移动端底部 Tab 导航由 nav:mobile-\* 权限过滤

系统 SHALL 重构移动端底部 Tab 或工作台快捷入口导航（`employeeItems` 数组），使其基于 `nav:mobile-*` 权限过滤，不再只依赖 `EMPLOYEE_SIDE_ROLES` 判断。

#### Scenario: 有 mobile-workspace nav 权限时显示工作台 Tab

- **WHEN** 用户拥有 nav:mobile-workspace 权限
- **THEN** 移动端底部工作台 Tab 可见

#### Scenario: 无 mobile-scan nav 权限时隐藏扫码入口

- **WHEN** 用户不拥有 nav:mobile-scan 权限
- **THEN** 移动端扫码中心入口不显示

### Requirement: 移动端路由守卫基于 page:mobile-\* 权限检查

系统 SHALL 为移动端路由添加 `page:mobile-*` 权限守卫，无权限时跳转到员工工作台首页或显示无权限提示，不再仅依赖角色类型判断。

#### Scenario: 有 page 权限时进入移动端页面

- **WHEN** 用户拥有 page:mobile-scan-hub 权限并访问 /scan 路由
- **THEN** 扫码中心页面正常渲染

#### Scenario: 无 page 权限时跳转

- **WHEN** 用户不拥有 page:mobile-production-order 权限
- **THEN** 跳转到移动端工作台首页，不渲染目标页面

