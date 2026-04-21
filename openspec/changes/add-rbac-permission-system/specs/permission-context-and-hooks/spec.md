## ADDED Requirements

### Requirement: PermissionContext 在应用顶层加载当前用户权限

系统 SHALL 提供 `PermissionContext`，在应用初始化时调用 `get_my_permissions()` RPC 加载当前用户的完整权限 Map（`Record<string, boolean>`）。PermissionContext 需在 App 顶层包裹，所有子组件均可通过 `usePermissionContext()` 访问。权限加载状态（isLoading）应可被组件读取。

#### Scenario: 已登录用户获取权限 Map

- **WHEN** 已登录用户的 PermissionContext 完成初始化
- **THEN** Context 中包含 `permissions` 对象（Record<string, boolean>），键为权限 key，值为 true 表示拥有该权限

#### Scenario: 权限加载中时 can() 返回 false

- **WHEN** PermissionContext 正在加载权限数据（isLoading=true）
- **THEN** `can(key)` 返回 false，不抛出错误

#### Scenario: 用户登出后权限 Map 清空

- **WHEN** 用户登出（Supabase Auth session 失效）
- **THEN** PermissionContext 重置 permissions 为空 Map

### Requirement: usePermission hook 检查单个权限

系统 SHALL 提供 `usePermission(key: string): boolean` hook，返回当前用户是否拥有指定权限。

#### Scenario: 用户拥有权限时返回 true

- **WHEN** 当前用户权限 Map 中 key 对应值为 true
- **THEN** usePermission(key) 返回 true

#### Scenario: 用户不拥有权限时返回 false

- **WHEN** 当前用户权限 Map 中不存在该 key 或值为 false
- **THEN** usePermission(key) 返回 false

### Requirement: useFeaturePermission hook 检查功能权限

系统 SHALL 提供 `useFeaturePermission(module: string, action: string): boolean` hook，等价于 `usePermission('feature:' + module + '.' + action)`。

#### Scenario: 检查功能权限

- **WHEN** 调用 useFeaturePermission('syney-po-list', 'create')
- **THEN** 等价于检查 'feature:syney-po-list.create' 权限，返回对应 boolean

### Requirement: usePermissions hook 批量检查多个权限

系统 SHALL 提供 `usePermissions(keys: string[]): Record<string, boolean>` hook，一次调用返回多个权限键的检查结果。

#### Scenario: 批量检查返回结果 Map

- **WHEN** 传入 ['feature:A.create', 'feature:A.delete'] 的 keys 数组
- **THEN** 返回 {'feature:A.create': true/false, 'feature:A.delete': true/false}

### Requirement: useFieldPermission hook 返回字段三态权限状态

系统 SHALL 提供 `useFieldPermission(module: string, fieldName: string): FieldPermissionState` hook，根据 `field:<module>.<fieldName>.view` 和 `field:<module>.<fieldName>.edit` 两个布尔权限组合，推导出字段的最终状态：

- 有 edit 权限 → `'editable'`（隐含 view）
- 有 view 但无 edit → `'readonly'`
- 无 view 且无 edit → `'hidden'`

#### Scenario: 用户有 edit 权限时字段可编辑

- **WHEN** 用户拥有 field:production-order.work_hours.edit 权限
- **THEN** useFieldPermission('production-order', 'work_hours') 返回 'editable'

#### Scenario: 用户只有 view 权限时字段只读

- **WHEN** 用户拥有 field:production-order.work_hours.view 但不拥有 .edit
- **THEN** useFieldPermission 返回 'readonly'

#### Scenario: 用户无任何字段权限时字段隐藏

- **WHEN** 用户既无 .view 也无 .edit 权限
- **THEN** useFieldPermission 返回 'hidden'

#### Scenario: edit 权限隐含 view 升级为 editable

- **WHEN** 用户只拥有 .edit 权限而无 .view 权限（通过个人覆盖等边缘情况）
- **THEN** useFieldPermission 仍返回 'editable'
