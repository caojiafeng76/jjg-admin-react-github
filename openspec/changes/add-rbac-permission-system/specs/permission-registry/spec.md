## ADDED Requirements

### Requirement: 全局权限注册表聚合所有模块权限声明

系统 SHALL 在 `src/config/permissionRegistry.ts` 中维护一个 `PERMISSION_REGISTRY: PermissionDefinition[]` 数组，由各模块 `permissions.ts` 导出的权限数组 spread 合并而成。注册表是权限清单的唯一来源。

#### Scenario: 注册表包含所有已导入模块的权限

- **WHEN** 开发者在 permissionRegistry.ts 中 import 某模块的 permissions.ts 并 spread 进 PERMISSION_REGISTRY
- **THEN** PERMISSION_REGISTRY 包含该模块所有权限定义，key 全局唯一

#### Scenario: 新增模块只需一行 import

- **WHEN** 开发者新建 `src/features/new-module/NewList/permissions.ts` 并在 permissionRegistry.ts 中 spread 导入
- **THEN** 注册表自动包含新模块权限，无需修改其他文件

### Requirement: 各模块 permissions.ts 声明标准格式

每个 feature 模块 SHALL 提供 `permissions.ts` 文件，导出 `PermissionDefinition[]` 数组，每条定义包含 key、scope、module、label、surface 字段。key 必须遵循 `<scope>:<module>[.<field>].<action>` 命名规范。

#### Scenario: 权限声明格式有效

- **WHEN** 某模块的 permissions.ts 导出正确格式的 PermissionDefinition[]
- **THEN** TypeScript 编译通过，key 符合命名规范

### Requirement: 管理员登录时自动同步权限注册表到数据库

系统 SHALL 在管理员用户的 PermissionContext 初始化时，调用 `syncPermissionRegistry()` 函数，将 PERMISSION_REGISTRY 中存在但数据库中不存在的权限批量 upsert（仅新增，不更新现有记录）。非管理员不触发同步。

#### Scenario: 管理员登录触发权限同步

- **WHEN** role=admin 的用户完成登录，PermissionContext 初始化
- **THEN** syncPermissionRegistry() 被调用，PERMISSION_REGISTRY 中的新权限写入 permissions 表

#### Scenario: 非管理员不触发权限同步

- **WHEN** role=employee 或 team_leader 用户登录
- **THEN** syncPermissionRegistry() 不被调用，无多余数据库请求

#### Scenario: 重复同步幂等

- **WHEN** 管理员多次登录，PERMISSION_REGISTRY 未变化
- **THEN** upsert 操作不产生重复数据，数据库记录数不增加
