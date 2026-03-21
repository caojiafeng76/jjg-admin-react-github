# Supabase Day2-Day3 migration 与 RLS 设计稿

## 1. 目标

这一份设计稿对应开发计划中的两个阶段：

- Day 2：员工账号绑定字段改造
- Day 3：RLS 策略落地

目标不是一次性把所有权限系统做复杂，而是先完成员工端 MVP 所必需的数据库底座：

- 登录账号可以唯一绑定到员工资料
- 员工只能读取自己的员工资料
- 员工只能读取自己的工单和工序明细
- 员工只能新增和修改自己的工单与明细
- 管理员保留全量访问能力

## 2. 现状判断

从当前仓库可确认：

- employees 表当前只有基础字段，没有账号绑定字段
- 现有 RLS migration 采用的是“authenticated 全表读写”的宽松策略
- production_orders 已通过 employee_id 关联 employees
- production_order_items 通过 order_id 关联 production_orders

这意味着当前系统虽然有登录态，但没有真正的数据归属隔离。

## 3. 本次设计范围

本次设计只覆盖以下范围：

- employees 字段补充
- 帮助函数设计
- employees / production_orders / production_order_items 的 RLS 改造
- migration 拆分建议
- 验证方案

本次不覆盖：

- 手机号验证码登录
- 审核流状态机
- 班组长权限
- 管理后台绑定页面实现

## 4. 建议 migration 拆分

建议拆成两个 migration，而不是混在一个文件里。

### migration A

用途：只做表结构变更。

建议文件名：

- 20260321010000_add_employee_auth_binding_fields.sql

建议内容：

- 给 employees 增加 auth_user_id
- 给 employees 增加 role
- 给 employees 增加 is_active
- 增加约束和索引

### migration B

用途：只做权限函数与 RLS 策略。

建议文件名：

- 20260321010100_add_employee_scoped_rls.sql

建议内容：

- 创建 current_employee_id() 等 helper function
- 替换 employees 的旧宽松策略
- 为 production_orders 和 production_order_items 建立细粒度策略

拆开的原因：

- 便于单独验证 schema 变更
- 便于排查 RLS 问题
- 回滚时边界更清晰

## 5. 字段设计

### 5.1 employees.auth_user_id

用途：绑定 Supabase Auth 用户。

设计：

- 类型：uuid
- 允许为空：是
- 唯一：是，建议使用 partial unique index

允许为空的原因：

- 现有员工资料可能还未完成账号开通
- 管理员可能先建员工，再分配账号

### 5.2 employees.role

用途：角色识别。

第一阶段只保留两个角色：

- admin
- employee

设计：

- 类型：text
- 默认值：employee
- 非空：是
- 建议增加 check constraint

### 5.3 employees.is_active

用途：启用或禁用员工账号。

设计：

- 类型：boolean
- 默认值：true
- 非空：是

规则：

- is_active = false 的员工，即使 Auth 登录成功，也不应再获得业务数据访问权限

## 6. Helper Function 设计

RLS 设计不建议把复杂子查询直接散落在每条 policy 里。建议统一抽成函数。

### 6.1 public.current_employee_id()

作用：返回当前登录用户对应的员工 ID。

返回规则：

- 当前 auth.uid() 对应 employees.auth_user_id
- 且 is_active = true
- 找不到则返回 null

设计要点：

- 使用 security definer
- 固定 search_path 为 public
- 作为 stable function 使用

### 6.2 public.is_admin()

作用：判断当前登录用户是否是启用状态的管理员。

返回规则：

- auth.uid() 对应员工存在
- role = admin
- is_active = true

设计要点：

- 使用 security definer
- 固定 search_path 为 public
- 返回 boolean

### 6.3 为什么需要 security definer

如果 helper function 自己也依赖 employees 表，而 employees 又被 RLS 保护，那么在 policy 内直接查 employees 很容易出现递归依赖或策略相互卡住。

使用 security definer 的目的，是让 helper function 以更稳定的方式读取身份映射，而不是受调用者 RLS 限制。

## 7. RLS 设计

### 7.1 employees

建议权限：

- admin：全量读写
- employee：仅能 select 自己那一行
- employee：不能直接 update 自己资料，避免自行修改 role、auth_user_id、is_active

这样设计的原因：

- 员工资料本身就是权限基础表
- 如果允许员工自行修改，风险很高

### 7.2 production_orders

建议权限：

- admin：全量读写
- employee：select 自己的工单
- employee：insert 仅允许 employee_id = current_employee_id()
- employee：update 仅允许修改自己已有的工单，且更新后仍归属自己
- employee：delete 默认不开放，交给管理员处理

删除不开放给员工的原因：

- 工单主表删除影响更大
- 第一阶段需求重点是查看和编辑，不是删除
- 可以通过不开放 delete 降低误删风险

### 7.3 production_order_items

建议权限：

- admin：全量读写
- employee：select 仅限本人所属工单的明细
- employee：insert 仅限本人所属工单
- employee：update 仅限本人所属工单
- employee：delete 仅限本人所属工单

这里允许员工删除明细，是因为移动端录入过程中更可能需要删错录的某一条明细，而不是整张工单。

## 8. 和现有旧策略的冲突点

当前仓库已有一个宽松 migration：

- supabase/migrations/20250101000010_enable_rls_and_policies.sql

这个文件里 employees 的策略是“任何 authenticated 用户都可读写”。这对员工端权限模型是冲突的。

因此 Day 3 migration 必须明确做两件事：

- drop 旧的 employees 宽松策略
- 用新的按角色和按归属策略替换

production_orders 和 production_order_items 当前没有看到针对员工隔离的细粒度策略，因此可以在新 migration 中直接补上。

## 9. SQL 草稿文件

本次已同步准备两份 SQL 草稿，位置如下：

- docs/sql-drafts/20260321_day2_add_employee_auth_binding_fields.sql
- docs/sql-drafts/20260321_day3_add_employee_scoped_rls.sql

这两份文件是设计稿级别，不建议直接无审查地放进 supabase/migrations。建议先在本地数据库验证，再复制为正式 migration。

## 10. 实施前检查

在执行正式 migration 前，建议先确认：

1. 当前线上是否已有真实 Auth 用户
2. employees 是否需要先补一批 auth_user_id 映射
3. 管理员账号对应哪条 employees 记录
4. 现有后台是否存在依赖“任意 authenticated 都能查 employees 全表”的功能

第 4 点尤其重要。因为一旦 employees 改成“员工只能看自己”，如果前端仍用客户端直接拉全量员工列表，员工端会拿不到数据，这是正确行为，但后台端必须通过管理员身份或改用更明确的数据流。

## 11. 验证建议

建议最少验证下面 8 个场景：

1. 管理员登录后可查全部 employees
2. 员工登录后只能查到自己的 employees 记录
3. 员工不能更新自己的 role
4. 员工只能查询自己的 production_orders
5. 员工不能插入 employee_id 为他人的工单
6. 员工只能查询自己工单下的 production_order_items
7. 员工不能修改他人工单下的明细
8. 员工可删除自己工单下误录的明细

## 12. 建议落地方式

最稳妥的方式是：

1. 先在本地 Supabase 环境应用 Day 2 草稿
2. 绑定一条管理员 employees 数据和一条普通员工数据
3. 再应用 Day 3 草稿
4. 用两个账号分别在前端和 SQL 层做验证
5. 验证通过后，再生成正式 migration 文件

如果你要继续推进，下一步最自然的是：

- 直接把这两份 SQL 草稿转成正式 supabase/migrations 文件
- 或先让我继续补“管理员初始化与账号绑定操作说明”

## 13. 管理员初始化与账号绑定操作说明

这一节解决两个实际问题：

1. 第一个管理员账号怎么落地
2. 普通员工账号如何创建、绑定、启用、停用

这一部分必须单独说明，因为当前项目是纯前端 Vite 应用，通过 [src/services/supabase.ts](src/services/supabase.ts) 使用的是前端 Supabase 客户端。第一阶段不能把 `service_role` 直接放到前端做用户管理，否则会直接破坏安全边界。

因此第一阶段建议采用：

- Auth 用户创建：由 Supabase Dashboard 或受控后台脚本执行
- employees 资料绑定：由 SQL 或管理后台操作执行
- 前端员工端：只负责登录和使用，不负责创建账号

### 13.1 第一阶段推荐操作方式

#### 方案一：Supabase Dashboard + SQL Editor

这是第一阶段最稳妥的方式。

管理员操作分成两步：

1. 在 Supabase Auth 中创建用户
2. 在 `employees` 表中绑定 `auth_user_id`

优点：

- 不需要额外开发后台服务
- 适合 MVP 快速上线
- 权限边界最清晰

缺点：

- 需要管理员手工执行
- 批量开通效率一般

#### 方案二：后续增加受控管理接口

后续如要提升效率，可增加：

- Supabase Edge Function
- 或独立后端管理接口

由服务端持有 `service_role`，管理员在后台页面触发“创建账号并绑定”。

第一阶段不建议直接做这个方案，原因是：

- 当前项目没有独立后端
- 先做安全底座和手机端主链路更重要
- 过早引入服务端管理逻辑会拖慢 MVP 上线

### 13.2 第一个管理员如何初始化

这是最容易卡住的一步。建议按下面顺序执行。

#### 步骤 1：先在 Auth 中创建管理员登录账号

推荐在 Supabase Dashboard 的 Authentication 中手工创建一个邮箱账号，例如：

- admin@company.com

要求：

- 密码由管理员首次掌握
- 邮箱使用真实可管理邮箱，避免后续密码找回失控

#### 步骤 2：在 employees 中建立对应员工记录

如果管理员在 `employees` 中还没有对应记录，先创建一条员工资料，例如：

- name = 系统管理员

#### 步骤 3：把 Auth 用户绑定到该员工记录

从 Auth 用户列表拿到该用户的 UUID，然后执行绑定：

```sql
update public.employees
set auth_user_id = '管理员 auth uid',
	role = 'admin',
	is_active = true
where name = '系统管理员';
```

#### 步骤 4：验证管理员身份

验证点：

- 管理员登录后，`public.is_admin()` 返回 true
- 管理员能查询全量 `employees`
- 管理员能查询全量 `production_orders`

#### 步骤 5：锁定操作人

建议在内部文档里记录：

- 首个管理员邮箱
- 对应员工名称
- 创建时间
- 谁执行了初始化

这是为了避免后续出现“系统里谁是管理员没人说得清”的情况。

### 13.3 普通员工账号开通标准流程

建议把员工账号开通固定成一条标准操作链：

1. 创建或确认员工资料
2. 创建 Auth 账号
3. 绑定 `auth_user_id`
4. 设置 `role = 'employee'`
5. 设置 `is_active = true`
6. 把登录方式通知给员工

#### 步骤 A：确认 employees 数据存在

先检查员工资料是否已经存在。

如果不存在，先创建：

```sql
insert into public.employees (name)
values ('张三');
```

如果已存在，则直接复用，不要重复创建同名员工。

#### 步骤 B：创建员工 Auth 账号

建议由管理员在 Dashboard 中创建：

- 员工邮箱账号
- 初始密码

建议规则：

- 邮箱必须唯一
- 初始密码由管理员发放后要求员工首次修改
- 账号创建后立即记录 auth uid

#### 步骤 C：绑定 Auth 账号到 employees

```sql
update public.employees
set auth_user_id = '员工 auth uid',
	role = 'employee',
	is_active = true
where id = '员工表主键';
```

推荐按 `id` 绑定，不要按 `name`。因为名字在业务上可能重名，也可能后续被修正。

#### 步骤 D：通知员工登录

建议至少通知这些信息：

- 登录地址
- 登录邮箱
- 初始密码
- 首次登录后是否需要改密码
- 遇到“未绑定员工资料”该找谁处理

### 13.4 账号解绑与换绑说明

员工可能会出现以下情况：

- 邮箱换了
- 原账号作废
- 绑定错人了
- 员工离职后由新员工接替设备，但不能沿用旧绑定

因此需要明确解绑和换绑流程。

#### 解绑

```sql
update public.employees
set auth_user_id = null
where id = '员工表主键';
```

解绑后的结果：

- 该员工资料仍存在
- 原 Auth 用户即使还能登录，也拿不到业务数据范围
- 员工端会因为 `current_employee_id()` 为空而无法访问自己的业务数据

#### 换绑

推荐顺序：

1. 先解绑旧账号
2. 再绑定新账号
3. 验证新账号能正常访问

不要直接把一个账号从 A 员工改绑到 B 员工而不留操作记录，这样最容易造成串号排查困难。

### 13.5 停用员工账号说明

如果员工离职、停岗、暂停使用系统，不建议优先删除业务数据，建议先停用。

```sql
update public.employees
set is_active = false
where id = '员工表主键';
```

停用后的结果：

- `current_employee_id()` 将不再返回该员工 id
- 员工登录后无法获取业务数据权限
- 历史工单数据仍保留，不影响报表和追溯

这是比直接删员工、删账号更稳妥的方式。

### 13.6 不建议的做法

下面这些做法第一阶段不要做：

#### 不要在前端直接持有 service_role

原因：

- 浏览器端无法保密
- 一旦泄露，等于整个库的高权限暴露

#### 不要只按员工姓名绑定账号

原因：

- 同名风险
- 姓名可能更正
- 无法作为权限主键长期稳定使用

#### 不要允许员工自己在前端修改 role / auth_user_id / is_active

原因：

- 这些字段本质上是权限字段
- 应由管理员控制，而不是终端用户控制

### 13.7 建议的后台管理动作定义

后续如果要做管理后台按钮，建议动作先定义成下面几类：

1. 创建账号
2. 绑定账号
3. 解绑账号
4. 重置初始密码
5. 停用员工账号
6. 重新启用员工账号

第一阶段即使界面还没做出来，也建议先把这些动作名称和含义固定，避免后续产品和开发对“开通账号”理解不一致。

### 13.8 推荐的操作记录字段

如果后续需要更强的审计能力，建议预留记录下列信息：

- 谁创建了账号
- 谁绑定了员工账号
- 何时停用
- 何时解绑
- 原因备注

第一阶段可以先不建审计表，但至少建议管理员在内部登记表里保留记录。

### 13.9 推荐的实施顺序

建议实际操作按这个顺序走：

1. 应用 Day 2 migration
2. 创建首个管理员 Auth 账号
3. 绑定管理员 employees 记录
4. 应用 Day 3 RLS migration
5. 验证管理员权限
6. 再批量开通员工账号

这个顺序的原因是：

- 如果先开很多员工账号，再上 RLS，排查问题会很乱
- 先保证管理员通路可用，后续员工账号问题才有人能处理

### 13.10 推荐的本地验证脚本思路

建议至少准备两类测试账号：

- 管理员 1 个
- 普通员工 2 个

验证组合：

- admin 查询 employee A 和 employee B 数据
- employee A 查询自己的数据
- employee A 查询 employee B 的数据
- employee B 查询 employee A 的数据

这样可以很快确认绑定和 RLS 是否真的按预期工作。
