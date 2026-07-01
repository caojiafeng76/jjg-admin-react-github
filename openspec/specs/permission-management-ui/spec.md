# permission-management-ui Specification

## Purpose
TBD - created by archiving change add-rbac-permission-system. Update Purpose after archive.
## Requirements
### Requirement: 角色权限配置页面支持分组 Checkbox 编辑

系统 SHALL 提供 `/access-management/roles` 页面，展示所有角色的权限分配情况。选中某角色后，显示按模块分组的权限 Checkbox Tree，支持全选/取消全选某模块、批量保存、变更高亮（有改动的标黄）、保存前二次确认。

#### Scenario: admin 可为角色添加权限

- **WHEN** admin 在角色权限配置页勾选某权限后点击保存
- **THEN** role_permissions 表新增对应记录，该角色成员再次登录后获得此权限

#### Scenario: admin 可为角色移除权限

- **WHEN** admin 取消勾选某权限后点击保存
- **THEN** role_permissions 表删除对应记录

#### Scenario: 批量保存一次提交整个角色变更

- **WHEN** admin 对某角色同时勾选/取消多个权限后点击保存
- **THEN** 所有变更在一次请求中提交，减少数据库往返次数

#### Scenario: 保存前展示二次确认弹窗

- **WHEN** admin 点击保存按钮
- **THEN** 弹出确认对话框，展示将要变更的权限数量，需要 admin 确认后才执行

### Requirement: 用户权限覆盖页面支持个人级别权限配置

系统 SHALL 提供 `/access-management/users` 页面，展示用户列表（含当前角色和覆盖权限数量）。选中某用户后，对比展示角色默认权限和用户覆盖设置，支持为用户添加覆盖授权或收回，支持恢复为角色默认。

#### Scenario: 展示角色默认 vs 用户覆盖双列对比

- **WHEN** admin 打开某用户的权限覆盖详情
- **THEN** 每条权限显示"角色默认"和"用户覆盖"两列状态，差异可一目了然

#### Scenario: admin 可为用户添加覆盖授权

- **WHEN** admin 为某用户添加某权限的 enabled=true 覆盖
- **THEN** user_permission_overrides 表写入记录，该用户下次登录获得此权限

#### Scenario: admin 可恢复用户权限为角色默认

- **WHEN** admin 点击"恢复默认"移除某用户的覆盖记录
- **THEN** user_permission_overrides 中对应记录被删除，该用户恢复角色默认权限

### Requirement: 权限清单页面只读展示所有已注册权限

系统 SHALL 提供 `/access-management/permissions` 只读页面，展示 permissions 表中所有已注册的权限，包含 key、scope、module、surface、label 信息，支持按 scope 过滤和关键词搜索。

#### Scenario: 展示全量已注册权限

- **WHEN** admin 访问权限清单页面
- **THEN** 以列表形式展示所有 permissions 记录，标注 scope/surface 分类

#### Scenario: 支持按 scope 过滤

- **WHEN** admin 选择 scope=feature 过滤
- **THEN** 列表只显示功能权限条目

