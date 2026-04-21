## ADDED Requirements

### Requirement: permissions 表存储所有已注册权限

系统 SHALL 维护一张 `permissions` 表，存储通过代码注册的所有权限定义，包含 id、key（唯一标识符）、scope（nav/page/feature/field）、module、label、surface（pc/mobile/both）、description 和 created_at 字段。权限 key 必须全局唯一。

#### Scenario: 管理员可读取所有权限

- **WHEN** 已认证的管理员查询 permissions 表
- **THEN** 返回所有已注册的权限记录

#### Scenario: 普通员工不可直接 INSERT 权限

- **WHEN** 非 admin 角色用户尝试直接 INSERT permissions 记录
- **THEN** RLS 策略拒绝该操作，返回权限错误

### Requirement: role_permissions 表存储角色-权限分配

系统 SHALL 维护一张 `role_permissions` 表，关联角色（AppRole 枚举）与权限（permission_id），记录每个角色被授予的权限集合，(role, permission_id) 组合唯一。

#### Scenario: admin 可分配角色权限

- **WHEN** admin 用户为某角色添加权限分配记录
- **THEN** 记录成功写入，后续调用 get_my_permissions 时该角色成员可获得此权限

#### Scenario: 非 admin 不可修改角色权限分配

- **WHEN** 非 admin 用户尝试 INSERT/UPDATE/DELETE role_permissions 记录
- **THEN** RLS 策略拒绝操作

#### Scenario: 所有已认证用户可读取角色权限分配

- **WHEN** 任意已认证用户查询 role_permissions
- **THEN** 返回数据（用于前端展示）

### Requirement: user_permission_overrides 表支持用户级权限覆盖

系统 SHALL 维护一张 `user_permission_overrides` 表，允许对特定员工授予或收回超出其角色默认权限的能力。字段包含 id、employee_id（外键 employees.id）、permission_id（外键 permissions.id）、enabled（boolean，true=授予，false=收回）和 created_at。(employee_id, permission_id) 组合唯一。

#### Scenario: admin 可为用户添加权限覆盖

- **WHEN** admin 为某员工添加 enabled=true 的覆盖记录
- **THEN** 该员工调用 get_my_permissions 时获得该权限（即使其角色未分配）

#### Scenario: admin 可收回用户的角色默认权限

- **WHEN** admin 为某员工添加 enabled=false 的覆盖记录（对应某个角色已分配的权限）
- **THEN** 该员工调用 get_my_permissions 时不再获得该权限

#### Scenario: 用户可读取自己的覆盖记录

- **WHEN** 已认证用户查询 user_permission_overrides
- **THEN** 只返回属于自己（employee_id = 当前用户）的记录

### Requirement: get_my_permissions 函数返回完整权限集

系统 SHALL 提供一个 SECURITY DEFINER 的 PostgreSQL 函数 `get_my_permissions()`，返回当前认证用户的完整权限表，合并角色默认权限和用户个人覆盖。用户覆盖优先级高于角色默认。

#### Scenario: 有角色权限的员工调用函数

- **WHEN** 已通过 Supabase Auth 认证的员工调用 get_my_permissions()
- **THEN** 返回该员工角色对应的所有 role_permissions 记录，enabled=true

#### Scenario: 有个人覆盖的员工调用函数

- **WHEN** 员工有 user_permission_overrides 记录（enabled=true）且其角色未分配该权限
- **THEN** 函数返回结果包含该权限，enabled=true

#### Scenario: 个人 enabled=false 覆盖收回角色权限

- **WHEN** 员工角色已分配某权限，但存在 enabled=false 的个人覆盖
- **THEN** 函数返回结果中该权限 enabled=false（或不返回该记录）

#### Scenario: 未绑定 employee 的认证用户调用函数

- **WHEN** 认证用户在 employees 表中无对应记录
- **THEN** 函数返回空结果集，不报错
