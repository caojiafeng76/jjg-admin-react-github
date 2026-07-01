## Context

当前系统使用四个固定角色（`admin` / `employee` / `team_leader` / `precision_cutting_admin`）控制访问：`MainMenu.tsx` 按角色分支硬编码菜单项，`RoleProtectedRoute` 写死允许角色列表。随着模块增多，权限配置散落在多处，且无法对同一角色不同员工做差异化授权。需要在不破坏现有访问逻辑的前提下，叠加细粒度 RBAC 层。

## Goals / Non-Goals

**Goals:**

- 建立 permissions / role_permissions / user_permission_overrides 三张表，支持角色-权限和用户-权限两级配置
- 前端提供统一的 PermissionContext + Hooks，任意组件均可检查任意粒度的权限
- PC 菜单和移动端导航由权限 Context 驱动，消除硬编码角色分支
- 路由守卫迁移为基于权限 key 的检查
- 提供权限管理后台界面（角色权限配置、用户权限覆盖、权限清单）
- 全量权限清单通过代码自动发现+数据库 upsert 维护，新增模块只需添加 `permissions.ts`

**Non-Goals:**

- 不实现动态路由（路由结构仍在代码中定义）
- 不实现 API 层（Edge Function）权限校验——数据库 RLS 已覆盖行级安全，前端权限仅控制 UI
- 不实现审计日志（权限变更历史记录超出本期范围）
- 不修改现有业务数据表结构
- 不实现团队/部门维度的权限隔离（仅角色 + 用户个人覆盖）

## Decisions

### D1：权限加载策略——单次 RPC vs 多次查询

**选择**：单次 `get_my_permissions()` RPC，返回完整 `{key: string, enabled: boolean}[]`，前端转为 Map。

**理由**：权限表数量有限（数百条），一次性加载比逐条查询性能更好；在 PermissionContext 中全局缓存，避免组件层重复请求；TanStack Query 可跨 Context 共享同一 queryKey。

**放弃方案**：按需懒加载（频繁的权限检查会产生大量请求）；Zustand 持久化（权限数据应跟随登录状态，不应跨 session 持久化）。

### D2：分阶段上线——4 个 Phase 并行运行旧逻辑

**选择**：Phase 1-2 期间新旧检查并存（旧角色检查保留），Phase 3 权限管理后台上线并完成角色权限初始配置后，Phase 4 移除旧硬编码检查。

**理由**：避免在权限数据未完整配置前突然切断访问；保留回滚点（随时可回退到旧角色检查）。

**风险**：并存期维护双重逻辑，约 1-2 周窗口期需同步两套配置。

### D3：字段权限三态由两个 boolean 权限组合推导

**选择**：`field:M.F.edit` → editable；`field:M.F.view`（且无 edit）→ readonly；两者均无 → hidden；`edit` 隐含 `view`。

**理由**：简化后台配置——管理员只需分配 `edit` 权限，无需同时分配 `view`；三态逻辑在 `useFieldPermission` hook 内封装，调用方无感知。

### D4：权限注册表由代码文件驱动，管理员登录时自动 upsert

**选择**：每个模块 `permissions.ts` → 全局 `permissionRegistry.ts` 聚合 → 管理员 PermissionContext 初始化时调用 `syncPermissionRegistry()` upsert 到数据库。

**理由**：权限定义与业务代码同仓库，diff 可审查；新增模块无需手动操作后台，降低维护成本。非管理员不触发 upsert，避免 RLS 拦截。

### D5：PermissionField 通过 React cloneElement 注入 disabled

**选择**：`<PermissionField>` 包裹 `<Form.Item>`，内部通过 `cloneElement` 给直接子控件注入 `disabled` 属性实现 readonly 态。

**理由**：对 Ant Design 标准表单控件（Input、Select、DatePicker 等）无感知；遇到不接受 disabled 的自定义控件，可降级为直接使用 `useFieldPermission` hook。

## Risks / Trade-offs

| 风险                                                  | 缓解措施                                                                                                                                                                                      |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 权限加载失败时 UI 全部隐藏（fail-close）              | PermissionContext 中未加载/加载中时返回空 Map，`can()` 返回 false；建议在 loading 时显示骨架屏而非立即报错                                                                                    |
| `get_my_permissions()` 函数 SECURITY DEFINER 安全风险 | 函数仅读取当前用户 employee_id 和 role，不接受外部参数，结合 Supabase Auth 校验；RLS 兜底                                                                                                     |
| 角色权限初始数据为空时所有人无法访问                  | 在 Phase 0 的 migration SQL 中直接写入全量 permissions 记录和所有角色的初始 role_permissions 种子数据（4个角色完整覆盖），同时添加 DB trigger 确保 admin 始终自动获得所有新权限，无需手动配置 |
| MainMenu 迁移期间菜单顺序/分组可能变化                | 保留原始菜单数组顺序，只在 `filterMenuByPermissions` 做过滤，不重排                                                                                                                           |
| 用户个人权限覆盖与角色权限冲突时的优先级              | 明确规则：用户覆盖高于角色默认；enabled=true 覆盖可授予，enabled=false 覆盖可收回                                                                                                             |

## Migration Plan

**Phase 0（数据库基础）**

1. 执行 migration SQL：建表 permissions / role_permissions / user_permission_overrides
2. 创建 `get_my_permissions()` 函数
3. 启用 RLS，添加相应策略
4. 在同一 migration 中直接 INSERT 全量 permissions 记录（所有 nav/page/feature 权限 key），并按各角色当前 router.tsx 访问范围写入 role_permissions 种子数据（admin 绑全部、precision_cutting_admin 绑订单/精切相关、team_leader 绑移动端+标准工时PC页、employee 绑移动端全部）
5. 创建 DB trigger `auto_grant_to_admin`：新权限写入 permissions 表时自动授予 admin 角色，确保未来新增模块无需任何手动配置
6. 验证：管理员可调用函数，员工只能读取自己权限

**Phase 1（前端基础层，不破坏现有访问）**

1. 添加 `src/types/permission.ts`
2. 添加 `src/services/apiPermissions.ts`（加载+同步函数）
3. 添加 `PermissionContext.tsx`，在 `App.tsx` 最外层包裹
4. 添加 `usePermission` / `useFeaturePermission` / `useFieldPermission` hooks
5. 验证：现有菜单和路由不受影响

**Phase 2（UI 组件）**

1. 添加 `<PermissionGate>` / `<PermissionButton>` / `<PermissionField>`
2. 单元级验证：各组件在 permission=true/false 时渲染正确

**Phase 3a（权限注册表 + permissions.ts）**

1. 创建 `src/config/permissionRegistry.ts`
2. 为所有现有模块添加 `permissions.ts`
3. 管理员登录后自动 upsert 触发，验证 permissions 表数据完整

**Phase 3b（主菜单 + 路由守卫迁移）**

1. 重构 `MainMenu.tsx` 使用 `filterMenuByPermissions`
2. 迁移 PC 端 `RoleProtectedRoute` 为 `PermissionProtectedRoute`
3. 并存期：旧角色检查作为 fallback（`isAdmin || can('page:...')`）

**Phase 3c（移动端导航迁移）**

1. 迁移移动端底部 Tab 使用 `nav:mobile-*` 权限过滤
2. 迁移移动端路由守卫使用 `page:mobile-*` 权限检查

**Phase 4（权限管理后台上线）**

1. 上线 `src/features/access-management/` 模块
2. 验证各角色访问行为符合预期（所有角色应开箱即用，由 Phase 0 种子数据覆盖）
3. 移除旧硬编码角色检查（RoleProtectedRoute → PermissionProtectedRoute 全量切换）

**回滚策略**：

- Phase 0-2 可随时回滚（仅添加，未修改现有逻辑）
- Phase 3b 后：恢复 MainMenu.tsx 旧版本（git revert）即可回到硬编码角色模式
- 数据库表可保留（不影响现有表），函数可禁用

## Open Questions

1. 权限加载失败（网络超时）时，是完全拒绝访问还是降级为基于角色的旧逻辑？建议 Phase 3b 之前沿用旧逻辑作为降级，Phase 4 后统一 fail-close。
2. 用户个人权限覆盖界面是否需要操作历史记录？本期不做，后续迭代。
3. `precision_cutting_admin` 角色是否与 `admin` 角色在权限配置上完全独立管理？建议是，两套不同的默认权限集。
