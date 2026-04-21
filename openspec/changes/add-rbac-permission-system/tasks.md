## 0. 数据库基础层

- [x] 0.1 创建 migration SQL：建 `permissions` 表（id/key/scope/module/surface/label/description/created_at）并启用 RLS
- [x] 0.2 创建 migration SQL：建 `role_permissions` 表（id/role/permission_id/created_at，唯一约束 role+permission_id）并启用 RLS
- [x] 0.3 创建 migration SQL：建 `user_permission_overrides` 表（id/employee_id/permission_id/enabled/created_at，唯一约束）并启用 RLS
- [x] 0.4 创建 RLS 策略：permissions（所有已认证用户可 SELECT，禁止前端 INSERT/UPDATE/DELETE）
- [x] 0.5 创建 RLS 策略：role_permissions（admin 可全操作，其他用户仅 SELECT）
- [x] 0.6 创建 RLS 策略：user_permission_overrides（admin 可全操作，用户可 SELECT 自己的记录）
- [x] 0.7 创建 PLPGSQL 函数 `get_my_permissions()` SECURITY DEFINER，合并 role_permissions + user_permission_overrides 返回权限集
- [x] 0.8 执行 migration 并验证：管理员调用 get_my_permissions() 有返回，员工调用返回空（角色权限数据尚未配置）
- [x] 0.9 使用 Supabase MCP generate_typescript_types 更新 database.types.ts（或手动补充新表类型）
- [x] 0.10 在 migration SQL 中直接 INSERT 全量 permissions 记录（覆盖设计文档中所有 nav/page/feature 权限），同时在同一 migration 中用 INSERT INTO role_permissions 按以下映射完成所有角色的初始权限绑定，确保 Phase 4 移除旧硬编码后所有角色功能开箱即用、无需额外手动配置：
  - `admin`：绑定所有 permissions 记录（SELECT id FROM permissions）
  - `precision_cutting_admin`：绑定 page:workshop-order-production / page:workshop-order-closed / page:workshop-order-qr-detail / nav:workshop-order-list / page:precision-cutting-transfer / nav:precision-cutting / page:precision-finishing-cutting
  - `team_leader`：绑定所有 page:mobile-_ / nav:mobile-_ / feature:mobile-\* 权限 + page:standard-time-list / nav:standard-time-list（PC端成本核算页）
  - `employee`：绑定所有 page:mobile-_ / nav:mobile-_ / feature:mobile-\* 权限
- [x] 0.11 在 migration SQL 中创建 DB trigger `auto_grant_to_admin`：当新权限 INSERT 进 permissions 表时，自动将其绑定到 admin 角色，确保未来新增模块的权限无需任何手动配置即可对 admin 生效

## 1. 前端类型与服务层

- [x] 1.1 新建 `src/types/permission.ts`：导出 PermissionScope / PermissionSurface / FieldPermissionState / PermissionDefinition / PermissionMap 类型
- [x] 1.2 新建 `src/services/apiPermissions.ts`：实现 `getMyPermissions()` 调用 Supabase RPC get_my_permissions，返回 PermissionMap
- [x] 1.3 在 `apiPermissions.ts` 中实现 `syncPermissionRegistry(registry: PermissionDefinition[])` 函数：upsert 新权限到 permissions 表（onConflict key 忽略）
- [x] 1.4 验证：getMyPermissions() 在管理员账户下调用可返回结果，错误时走 handleApiError

## 2. PermissionContext 与 Hooks

- [x] 2.1 新建 `src/contexts/PermissionContext.tsx`：用 TanStack Query useQuery 加载 getMyPermissions()（queryKey: ['my-permissions']），提供 permissions/isLoading/can/canAll 接口
- [x] 2.2 在 PermissionContext 中：admin 用户初始化完成后，静默调用 syncPermissionRegistry(PERMISSION_REGISTRY)（从 permissionRegistry.ts 导入，此时可先传空数组，后续 Phase 3a 补全）
- [x] 2.3 在 `src/App.tsx` 最外层（AuthContext 内部）包裹 `<PermissionContext.Provider>`，确保全局可用
- [x] 2.4 新建 `src/hooks/usePermission.ts`：导出 usePermission(key) / useFeaturePermission(module, action) / usePermissions(keys) 三个 hook
- [x] 2.5 在 `usePermission.ts` 中实现 `useFieldPermission(module, fieldName): FieldPermissionState`，按三态推导逻辑实现
- [x] 2.6 验证：bun run build 通过，浏览器中 PermissionContext 初始化无报错，isLoading 状态正确

## 3. UI 权限组件

- [x] 3.1 新建 `src/ui/PermissionGate.tsx`：实现 hide/disable 两种 mode，无权限时 hide 返回 null，disable 通过 cloneElement 注入 disabled
- [x] 3.2 新建 `src/ui/PermissionButton.tsx`：封装 Ant Design Button + PermissionGate（disable 模式）+ Tooltip 提示"无操作权限"
- [x] 3.3 新建 `src/ui/PermissionField.tsx`：包裹 Form.Item，根据 useFieldPermission 三态控制渲染（hidden=null/readonly=disabled/editable=正常）
- [x] 3.4 验证：bun run build 通过，三个组件 TypeScript 类型无错误

## 4. 权限注册表与各模块 permissions.ts

- [x] 4.1 新建 `src/config/permissionRegistry.ts`：创建 PERMISSION_REGISTRY 数组（初始为空，后续逐步导入各模块权限）
- [x] 4.2 为 `src/features/syney/` 各模块（PoList/SpecList/ReportList/ReportDetail）创建 `permissions.ts`，声明 nav/page/feature 权限
- [x] 4.3 为 `src/features/workshop/` 各模块（OrderList/ProcessList/EmployeeList 等）创建 `permissions.ts`
- [x] 4.4 为生产工单（production-order）、物料转移单（material-transfer）、精加工切割单等模块创建 `permissions.ts`
- [x] 4.5 为成本核算、考勤、刀具、劳保、优迈、设备、权限管理等模块创建 `permissions.ts`
- [x] 4.6 为移动端页面和功能（mobile-production-order/mobile-scan-hub 等）在对应模块中添加 `page:mobile-*` 和 `nav:mobile-*` 权限声明
- [x] 4.7 在 `permissionRegistry.ts` 中 import 并 spread 所有已创建的 permissions.ts
- [x] 4.8 更新 PermissionContext 中的 syncPermissionRegistry 调用，传入完整 PERMISSION_REGISTRY
- [x] 4.9 验证：管理员登录后 permissions 表中有完整的权限记录（通过 Supabase MCP execute_sql 查询验证）

## 5. PC 端主菜单与路由守卫迁移

- [x] 5.1 重构 `MainMenu.tsx`：将现有硬编码菜单项改为 `MenuItemWithPermission[]` 数组，每项添加 `permission` 字段
- [x] 5.2 实现 `filterMenuByPermissions(items, can)` 工具函数，按权限过滤菜单数组
- [x] 5.3 在 MainMenu 中使用 filterMenuByPermissions 替换 if/else 角色分支（Phase 3b 并存期：`isAdmin || can('nav:...')` 作为过渡条件）
- [x] 5.4 新建 `src/routes/PermissionProtectedRoute.tsx`：基于 `page:*` 权限检查，无权限时重定向并显示提示
- [x] 5.5 将 `src/routes/` 中的 RoleProtectedRoute 用法逐步替换为 PermissionProtectedRoute（并存期保留旧 fallback）
- [x] 5.6 验证：管理员配置好角色权限数据后，不同角色用户的菜单显示和路由访问符合预期

## 6. 移动端导航与路由守卫迁移

- [x] 6.1 定位移动端底部 Tab 或 employeeItems 导航数组的实现位置
- [x] 6.2 将移动端导航项改为带 `permission` 字段的 `MobileNavItemWithPermission[]` 结构，按 `nav:mobile-*` 权限过滤
- [x] 6.3 为移动端路由（/scan、/production-order 等）添加 `page:mobile-*` 权限守卫
- [x] 6.4 验证：employee 角色用户移动端导航和路由访问符合预期

## 7. 权限管理后台模块

- [x] 7.1 建立 `src/features/access-management/` 目录结构：index.tsx（Tab 切换）+ 三个子模块目录
- [x] 7.2 实现 `RolePermissionList/` 模块：useRolePermissions hook（读取 role_permissions）+ 角色列表页
- [x] 7.3 实现 `RolePermissionList/RolePermissionDetail.tsx`：分组 Checkbox Tree + 批量保存 + 变更高亮 + 二次确认
- [x] 7.4 实现 `useUpdateRolePermissions.ts` mutation：批量 upsert/delete role_permissions，invalidate ['my-permissions']
- [x] 7.5 实现 `UserPermissionList/` 模块：useUserPermissions hook + 用户列表页（含覆盖权限数量）
- [x] 7.6 实现 `UserPermissionList/UserPermissionDetail.tsx`：角色默认 vs 用户覆盖双列对比 + 恢复默认操作
- [x] 7.7 实现 `useUpdateUserPermissions.ts` mutation：upsert/delete user_permission_overrides
- [x] 7.8 实现 `PermissionRegistry/` 模块：只读列表展示 permissions 表，支持 scope 过滤和关键词搜索
- [x] 7.9 在路由配置中添加 `/access-management` 及子路由，用 PermissionProtectedRoute 限制仅 admin 可访问
- [x] 7.10 在主菜单中添加"权限管理"入口，绑定 `nav:access-management` 权限

## 8. 移除旧硬编码并最终验证

- [x] 8.1 验证所有 4 个角色的功能完整性均由 migration 种子数据（0.10 + 0.11）全覆盖，无需任何手动配置：admin（所有 PC 功能 + 自动 trigger 覆盖未来新权限）、precision_cutting_admin（订单管理/精切转移/精加工切割）、team_leader（移动端全部 + 标准工时 PC 页）、employee（移动端全部）
- [x] 8.2 移除 MainMenu.tsx 中的旧角色 if/else 分支（保留 filterMenuByPermissions 驱动的版本）
- [x] 8.3 移除路由守卫中的旧 RoleProtectedRoute（确认全部迁移完成）
- [x] 8.4 评估 EMPLOYEE_SIDE_ROLES / isEmployeeSideRole 残留：router 已无引用；剩余 7 处属于「操作者视角」派生（layout 选择、扫码身份校验、is_audited 默认值等业务规则），非访问控制，按设计保留并在 src/config/access.ts 注释明确语义
- [x] 8.5 执行 bun run build，确认 TypeScript 无报错，构建成功
- [x] 8.6 回归验证：admin / employee / team_leader / precision_cutting_admin 各角色用户的访问行为符合预期
