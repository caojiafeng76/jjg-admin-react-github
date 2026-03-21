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

## 14. 本次正式落地方案

这次实际落地采用的是“最小影响方案”，目标是先把管理员账户和员工权限字段补齐，同时避免影响当前已经在使用的功能。

### 14.1 已落地文件

正式 migration 文件：

- [supabase/migrations/20260321010200_add_employee_auth_fields_and_bootstrap_admin.sql](supabase/migrations/20260321010200_add_employee_auth_fields_and_bootstrap_admin.sql)

### 14.2 本次 migration 做了什么

这份 migration 完成了以下内容：

1. 为 `employees` 增加 `auth_user_id`
2. 为 `employees` 增加 `role`
3. 为 `employees` 增加 `is_active`
4. 增加角色约束和索引
5. 创建 `public.is_admin()` helper function
6. 按邮箱 `cjf811651172@gmail.com` 自动查找 `auth.users`
7. 将该账号绑定为管理员员工记录，并设置 `role = 'admin'`

### 14.3 为什么这次没有直接切换严格 RLS

原因是这次用户要求里有一条硬约束：不能影响现有功能的使用。

而当前仓库里已有的 RLS 策略仍然是“authenticated 用户全表可读写”的宽松模型。如果现在直接切成严格员工隔离，现有后台查询和员工管理相关逻辑很可能会立即受到影响。

因此这次先完成：

- 管理员身份模型落地
- 目标邮箱管理员账户初始化
- 后续严格 RLS 所需字段准备

暂不在正式 migration 里启用严格员工隔离策略。

### 14.4 后续建议

如果你下一步要继续推进“员工只能看自己的数据”，建议在这次 migration 稳定后，再单独提交下一份 RLS migration，而不是把管理员初始化和权限收紧混在同一次上线里。

## 16. 严格员工隔离正式 migration

严格员工隔离版本的正式 migration 已经补充，文件如下：

- [supabase/migrations/20260321010300_enable_strict_employee_scoped_rls.sql](supabase/migrations/20260321010300_enable_strict_employee_scoped_rls.sql)

### 16.1 这条 migration 做了什么

它会把以下三张表切换到严格权限模型：

1. `employees`
2. `production_orders`
3. `production_order_items`

切换后的权限规则：

- 管理员：全量读写
- 普通员工：只能访问自己的员工资料
- 普通员工：只能访问自己名下的工单
- 普通员工：只能访问自己工单下的明细

### 16.2 这条 migration 的前置条件

必须先满足下面条件，再执行这条 migration：

1. [supabase/migrations/20260321010200_add_employee_auth_fields_and_bootstrap_admin.sql](supabase/migrations/20260321010200_add_employee_auth_fields_and_bootstrap_admin.sql) 已成功执行
2. `cjf811651172@gmail.com` 已在 `auth.users` 中存在
3. 该账号已经被正确识别为管理员
4. 前端已经接受“员工查询不到全量 employees”这一行为变化，或已经做好角色分流

### 16.3 为什么它不应该和 10200 同时上线

原因很直接：

- 10200 是“最小影响、先补身份字段和管理员初始化”
- 10300 是“真正开始收紧权限”

把两者拆开后，问题更容易定位：

- 如果 10200 有问题，是字段或管理员初始化问题
- 如果 10300 有问题，是 RLS 或前端权限适配问题

### 16.4 上线建议

建议顺序：

1. 先上线 10200
2. 验证管理员账户可用
3. 验证现有后台功能无异常
4. 再上线 10300
5. 用管理员和普通员工各验证一轮

## 15. 管理员验证步骤清单

这一节对应上一个阶段已经落地的 migration，用于确认下面三件事都成立：

1. migration 已成功执行
2. cjf811651172@gmail.com 已被识别为管理员
3. 现有功能没有因为这次字段改造被破坏

建议按下面顺序验证，不要跳步。

### 15.1 第一步：确认 migration 已执行成功

在 Supabase SQL Editor 或本地数据库中执行：

```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
	and table_name = 'employees'
	and column_name in ('auth_user_id', 'role', 'is_active')
order by column_name;
```

预期结果：

- 能看到 `auth_user_id`
- 能看到 `role`
- 能看到 `is_active`

继续检查 helper function 是否存在：

```sql
select routine_name
from information_schema.routines
where routine_schema = 'public'
	and routine_name = 'is_admin';
```

预期结果：

- 返回一条 `is_admin`

### 15.2 第二步：确认目标 Auth 用户存在

在 Supabase Dashboard 的 Authentication 用户列表中确认：

- 邮箱 `cjf811651172@gmail.com` 已存在

如果这个用户不存在，本次 migration 不会报错中断，但也不会自动完成管理员绑定。

如果你更想通过 SQL 检查，可在有权限的环境中执行：

```sql
select id, email, created_at
from auth.users
where lower(email) = lower('cjf811651172@gmail.com');
```

预期结果：

- 至少返回一条记录

### 15.3 第三步：确认 employees 绑定结果

执行：

```sql
select id, name, auth_user_id, role, is_active
from public.employees
where auth_user_id in (
	select id
	from auth.users
	where lower(email) = lower('cjf811651172@gmail.com')
);
```

预期结果：

- 能查到 1 条 employees 记录
- `role = 'admin'`
- `is_active = true`
- `auth_user_id` 不为空

如果查不到，再执行：

```sql
select id, name, auth_user_id, role, is_active
from public.employees
where name = '系统管理员';
```

用于确认 migration 是否走了“创建系统管理员员工记录”的分支。

### 15.4 第四步：确认管理员判断函数有效

这一步最好用该管理员账号实际登录系统后验证。

如果你有条件在前端控制台或临时 SQL 验证当前登录上下文，可执行：

```sql
select public.is_admin();
```

预期结果：

- 返回 `true`

如果返回 `false`，重点检查：

1. `auth.users` 中该邮箱是否真的存在
2. `employees.auth_user_id` 是否绑定到了正确的 auth uid
3. `role` 是否为 `admin`
4. `is_active` 是否为 `true`

### 15.5 第五步：确认现有员工管理功能未被破坏

这一步直接在现有系统里做人工回归。

建议最少验证这些页面：

1. 员工列表页面可正常打开
2. 员工列表可正常查询
3. 创建员工仍可用
4. 编辑员工仍可用
5. 删除员工的引用检查仍可用

重点原因：

- [src/services/apiEmployees.ts](src/services/apiEmployees.ts) 当前仍按原有结构查询 `employees`
- 这次新增字段不应影响旧查询和旧表单

### 15.6 第六步：确认现有生产工单功能未被破坏

建议最少验证这些流程：

1. 生产工单列表可正常打开
2. 创建生产工单可用
3. 编辑生产工单可用
4. 工序明细增删改可用
5. 日报统计页面可正常读取数据

重点原因：

- 本次 migration 没有改 `production_orders` 表结构
- 也没有切严格 RLS
- 所以这些页面理论上不该受到影响

### 15.7 第七步：异常场景验证

建议额外验证两个异常场景：

#### 场景 A：目标邮箱不存在

预期：

- migration 不应失败
- 只是不自动完成管理员初始化

#### 场景 B：目标邮箱已存在且已绑定员工

预期：

- 该员工记录被提升为管理员
- 不应重复插入员工数据

### 15.8 第八步：验收通过标准

这次改造可以视为验收通过，需要同时满足：

1. employees 已增加 3 个字段
2. `public.is_admin()` 已存在
3. `cjf811651172@gmail.com` 已绑定为管理员
4. 员工管理页面功能正常
5. 生产工单相关功能正常
6. 没有出现登录后大面积查不到数据的问题

### 15.9 如果验证失败，优先排查顺序

建议按这个顺序排查，效率最高：

1. 先查 `auth.users` 里有没有目标邮箱
2. 再查 `employees.auth_user_id` 有没有绑定正确 uid
3. 再查 `role` 和 `is_active`
4. 最后再看前端页面是否有缓存或登录态问题

不要一上来就怀疑前端逻辑，因为这次改造主要发生在数据库层。

## 17. 10300 上线后的双账号验证清单

这一节用于执行 [supabase/migrations/20260321010300_enable_strict_employee_scoped_rls.sql](supabase/migrations/20260321010300_enable_strict_employee_scoped_rls.sql) 之后的联调验收。

目标不是只验证“RLS 已启用”，而是确认三件事同时成立：

1. 管理员仍可正常使用后台全部关键功能
2. 普通员工只能看到并编辑自己的数据
3. 不会因为权限切换导致页面直接报错或查不到本应可见的数据

建议至少准备两个账号：

- 管理员账号：`cjf811651172@gmail.com`
- 普通员工账号：任意一个已正确绑定到 `employees.auth_user_id` 的测试账号

如果条件允许，最好再准备第 3 个普通员工账号，用于交叉验证越权场景。

### 17.1 上线前准备

执行 10300 前，先确认：

1. 10200 已执行成功
2. 管理员账号已验证通过
3. 至少有 1 个普通员工账号完成绑定
4. 测试员工名下最好已有 1 到 2 张工单和若干明细

如果没有现成员工数据，10300 本身也许能成功执行，但你无法验证“员工只能看自己的数据”是否真的生效。

### 17.2 管理员账号验证

使用管理员账号登录后，建议按下面顺序验证。

#### 验证 A：员工管理

检查项：

1. 员工列表页面能打开
2. 能查询全量员工
3. 能创建员工
4. 能编辑员工
5. 能执行删除前引用检查

预期结果：

- 管理员不应因为严格 RLS 而只能看到自己
- 员工管理能力应与执行 10300 前保持一致

#### 验证 B：生产工单管理

检查项：

1. 生产工单列表能打开
2. 可查看不同员工的工单
3. 可新建工单
4. 可编辑工单
5. 可编辑工序明细

预期结果：

- 管理员仍然拥有全量读写能力

#### 验证 C：报表与统计

检查项：

1. 日报统计页面可打开
2. 可读取全量统计数据
3. 不会因为 employees 被收紧而导致联表异常

预期结果：

- 管理员侧统计功能不应退化

### 17.3 普通员工账号验证

使用普通员工账号登录后，建议按下面顺序验证。

#### 验证 D：员工资料范围

检查项：

1. 只能读取自己的员工资料
2. 无法读取其他员工记录

如果通过 SQL 或调试工具验证，预期应表现为：

- 查全量 employees 时，只能得到自己那一条

#### 验证 E：工单列表范围

检查项：

1. 员工只能看到自己名下的工单
2. 看不到其他员工的工单
3. 工单列表页面本身可以正常打开

预期结果：

- 页面能加载
- 数据范围被缩小，但不应报权限错误导致空白页

#### 验证 F：工单创建

检查项：

1. 员工能创建自己的工单
2. 即使尝试构造其他 `employee_id`，也不能写入他人名下

预期结果：

- 插入自己的工单成功
- 插入他人 `employee_id` 失败

#### 验证 G：工单编辑

检查项：

1. 员工可编辑自己已有工单
2. 员工不能编辑其他员工工单

预期结果：

- 自己的工单可改
- 他人的工单更新失败或压根无法读到

#### 验证 H：工序明细范围

检查项：

1. 员工只能看到自己工单下的明细
2. 可新增自己工单下的明细
3. 可修改自己工单下的明细
4. 可删除自己误录的明细

预期结果：

- 只要订单归自己，就能正常操作
- 非自己订单的明细一律不可见或不可改

### 17.4 越权验证

这部分是 10300 是否真正有效的关键。

建议重点验证下面 5 个场景：

1. 员工 A 查询员工 B 的 employees 记录
2. 员工 A 查询员工 B 的 production_orders
3. 员工 A 更新员工 B 的 production_orders
4. 员工 A 查询员工 B 的 production_order_items
5. 员工 A 删除员工 B 工单下的明细

预期结果：

- 所有越权操作都失败

如果这 5 个场景有任何一个成功，说明 10300 的策略还不够严。

### 17.5 前端兼容性验证

10300 执行后，前端最容易出现的不是“查到了不该查的数据”，而是“某些页面过去默认能查全量，现在查不到导致 UI 出错”。

建议重点看：

1. 下拉框是否还能加载应有数据
2. 页面是否因为返回空数组而报错
3. 员工端页面是否存在假设“能看到所有员工”的逻辑

优先检查这些位置：

- [src/services/apiEmployees.ts](src/services/apiEmployees.ts)
- [src/services/apiProductionOrders.ts](src/services/apiProductionOrders.ts)
- [src/services/apiProductionOrderItems.ts](src/services/apiProductionOrderItems.ts)
- [src/features/workshop/EmployeeList/index.tsx](src/features/workshop/EmployeeList/index.tsx)
- [src/features/production-order/index.tsx](src/features/production-order/index.tsx)

### 17.6 验收通过标准

10300 可以视为验收通过，需要同时满足：

1. 管理员仍可全量使用后台关键能力
2. 普通员工只能看到自己的员工资料
3. 普通员工只能看到自己的工单
4. 普通员工只能操作自己工单下的明细
5. 所有越权验证均失败
6. 前端关键页面没有因权限收紧而出现大面积报错

### 17.7 如果 10300 上线后出现问题，回滚判断顺序

优先判断是哪一类问题：

#### 类型 A：管理员也查不到数据

优先排查：

1. `public.is_admin()` 是否返回 true
2. 管理员 employees 记录的 `role` 是否仍为 `admin`
3. `auth_user_id` 是否正确
4. `is_active` 是否为 true

#### 类型 B：普通员工看到了不该看的数据

优先排查：

1. `current_employee_id()` 是否正确返回本人 id
2. production_orders 的策略是否完整生效
3. production_order_items 是否通过所属订单正确限制

#### 类型 C：页面报错但 SQL 权限本身没问题

优先排查：

1. 前端是否假设能查全量 employees
2. 页面是否没有处理空结果
3. 是否仍在复用后台全量接口做员工端逻辑

## 18. 10300 执行后的实际联调步骤

这一节不是“检查清单”，而是上线当天可以直接照着执行的联调顺序。

建议拆成三条并行但可交叉确认的线：

1. 管理员账号联调线
2. 普通员工账号联调线
3. SQL 验证线

推荐执行方式：

- 先跑 SQL 验证线，确认 migration 已生效
- 再跑管理员账号联调线，确认后台不受影响
- 最后跑普通员工账号联调线，确认隔离已真正收紧

如果现场人手足够，也可以两个人分工：

- A 同时负责管理员页面联调
- B 同时负责员工账号联调
- SQL 验证作为穿插确认手段

### 18.1 先决条件

开始联调前，先确认下面 6 件事已经满足：

1. [supabase/migrations/20260321010200_add_employee_auth_fields_and_bootstrap_admin.sql](supabase/migrations/20260321010200_add_employee_auth_fields_and_bootstrap_admin.sql) 已执行
2. [supabase/migrations/20260321010300_enable_strict_employee_scoped_rls.sql](supabase/migrations/20260321010300_enable_strict_employee_scoped_rls.sql) 已执行
3. 管理员账号 `cjf811651172@gmail.com` 可正常登录
4. 至少 1 个普通员工账号已绑定 `employees.auth_user_id`
5. 该普通员工账号名下已有至少 1 张工单
6. 浏览器端已清理旧登录态或明确重新登录，避免缓存干扰

如果第 5 条不满足，很多“员工只能看自己的工单”验证会因为没有测试数据而失真。

### 18.2 管理员账号联调线

这一条线的目标只有一个：确认 10300 上线后，管理员侧关键功能没有退化。

#### 步骤 A1：管理员重新登录

操作：

1. 退出当前系统登录态
2. 用 `cjf811651172@gmail.com` 重新登录
3. 进入系统首页

预期结果：

- 能正常登录
- 不会出现登录成功但页面空白
- 不会出现登录后马上报权限错误

如果这里失败，优先不要继续点页面，先转去执行 SQL 验证线里的管理员身份确认。

#### 步骤 A2：验证员工管理页

建议打开员工列表相关页面，至少验证以下操作：

1. 打开员工列表
2. 搜索任意两个不同员工姓名
3. 新建 1 条测试员工资料
4. 编辑 1 条已有员工资料

预期结果：

- 能看到全量员工，而不是只看到自己
- 创建和编辑动作正常
- 不出现“查不到数据”或权限报错

如果管理员此时只能看到自己，基本可以直接判断 `public.is_admin()` 或管理员绑定存在问题。

#### 步骤 A3：验证生产工单页

建议进入生产工单页面，至少验证以下操作：

1. 打开工单列表
2. 切换或搜索不同员工的工单
3. 打开 1 张已有工单详情
4. 新增 1 张测试工单
5. 编辑 1 张已有工单

预期结果：

- 管理员仍能看到不同员工的数据
- 新增和编辑动作正常
- 不会因为员工隔离策略导致全局工单列表变空

#### 步骤 A4：验证工序明细与报表

建议继续验证：

1. 在任意工单下新增 1 条工序明细
2. 修改 1 条已有工序明细
3. 删除 1 条测试明细
4. 打开日报或统计相关页面

预期结果：

- 工序明细增删改正常
- 统计页面仍可读取应有数据
- 不会因为 `employees` 表权限收紧导致联表失败

#### 步骤 A5：管理员线验收结论

管理员联调线通过，至少要满足：

1. 员工管理正常
2. 生产工单正常
3. 工序明细正常
4. 报表统计正常

只要其中任意一项失败，就不要急着判断“RLS 全错了”，先记录具体失败页面和接口，再回到 SQL 验证线核对管理员身份判断。

### 18.3 普通员工账号联调线

这一条线的目标是确认“员工可用”和“员工不能越权”同时成立。

#### 步骤 B1：普通员工重新登录

操作：

1. 退出管理员账号
2. 用普通员工测试账号重新登录
3. 进入员工端或当前可访问的工单页面

预期结果：

- 能正常登录
- 页面可打开
- 不会一登录就因为拿不到全量 employees 而报错

#### 步骤 B2：验证员工资料范围

建议最少检查：

1. 页面中如有员工姓名、员工信息展示，应显示当前本人信息
2. 不应出现其他员工的敏感信息
3. 如果页面存在员工下拉框，不应默认加载所有员工

预期结果：

- 只能感知到自己的员工身份
- 看不到其他员工资料

#### 步骤 B3：验证工单列表范围

建议最少检查：

1. 打开工单列表
2. 记录当前能看到的工单数量
3. 核对这些工单是否都归属当前员工

预期结果：

- 只能看到自己的工单
- 看不到其他员工工单
- 页面本身可用，不是“因为被限制所以整个页面坏掉”

#### 步骤 B4：验证工单创建与编辑

建议执行：

1. 新建 1 张属于自己的测试工单
2. 修改这张测试工单中的可编辑字段
3. 重新刷新页面，确认修改已保存

预期结果：

- 可成功创建自己的工单
- 可成功修改自己的工单
- 刷新后仍能查到这张工单

#### 步骤 B5：验证工序明细操作

建议执行：

1. 在自己的工单下新增 1 条测试明细
2. 编辑该测试明细
3. 删除该测试明细

预期结果：

- 三个动作都成功
- 不会误伤同工单下其他正式数据

#### 步骤 B6：验证越权失败

这一步建议至少做 2 类验证：

1. 尝试访问不属于自己的工单详情
2. 尝试修改不属于自己的工单或工序明细

可通过前端构造、调试工具或直接 SQL 模拟完成。

预期结果：

- 查不到他人工单
- 改不了他人工单
- 改不了他人工单下的明细

如果员工还能看到或修改他人的数据，10300 本次上线不能算通过。

#### 步骤 B7：员工线验收结论

普通员工联调线通过，至少要满足：

1. 员工能正常登录并使用自己的数据
2. 员工能创建和编辑自己的工单
3. 员工能维护自己工单下的明细
4. 员工无法访问或修改别人的数据

### 18.4 SQL 验证线

这一条线是整个联调的兜底线。页面现象可以误导，但 SQL 结果通常更直接。

#### 步骤 C1：确认 helper function 存在

执行：

```sql
select routine_name
from information_schema.routines
where routine_schema = 'public'
	and routine_name in ('is_admin', 'current_employee_id')
order by routine_name;
```

预期结果：

- 返回 `current_employee_id`
- 返回 `is_admin`

#### 步骤 C2：确认管理员绑定状态

执行：

```sql
select e.id, e.name, e.auth_user_id, e.role, e.is_active
from public.employees e
join auth.users u on u.id = e.auth_user_id
where lower(u.email) = lower('cjf811651172@gmail.com');
```

预期结果：

- 能查到 1 条员工记录
- `role = 'admin'`
- `is_active = true`

#### 步骤 C3：确认普通员工绑定状态

执行：

```sql
select id, name, auth_user_id, role, is_active
from public.employees
where auth_user_id is not null
	and role = 'employee'
	and is_active = true
order by created_at desc;
```

预期结果：

- 至少能找到 1 条有效普通员工记录

如果这里查不到数据，员工联调线几乎一定会失败，因为根本没有可识别的普通员工身份。

#### 步骤 C4：确认测试员工名下存在工单

执行：

```sql
select employee_id, count(*) as order_count
from public.production_orders
group by employee_id
order by order_count desc;
```

预期结果：

- 至少有 1 个员工名下存在工单

如果普通员工账号名下没有工单，可以先由管理员补 1 张测试工单，再继续员工联调。

#### 步骤 C5：确认 RLS 已开启

执行：

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
	and tablename in ('employees', 'production_orders', 'production_order_items')
order by tablename;
```

预期结果：

- 三张表的 `rowsecurity` 都为 `true`

#### 步骤 C6：确认新策略已存在

执行：

```sql
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
	and tablename in ('employees', 'production_orders', 'production_order_items')
order by tablename, policyname;
```

预期结果：

- 能看到管理员全量策略
- 能看到员工自有范围策略
- 不应只剩旧的宽松 authenticated 全表策略

#### 步骤 C7：SQL 线验收结论

SQL 验证线通过，至少要满足：

1. `is_admin()` 和 `current_employee_id()` 都存在
2. 管理员账号绑定正确
3. 普通员工账号绑定正确
4. 测试员工名下有可验证的工单数据
5. 三张表 RLS 已开启
6. 新策略已落地

### 18.5 建议的联调执行顺序

如果你要把这节交给现场执行的人，建议直接按下面顺序做：

1. 跑 C1 到 C6，确认数据库状态正确
2. 跑 A1 到 A5，确认管理员侧没坏
3. 跑 B1 到 B5，确认员工自己的链路可用
4. 跑 B6，专门验证越权失败
5. 最后统一记录结论和异常

### 18.6 建议的联调记录模板

建议现场至少记录下面 6 列：

1. 验证线
2. 步骤编号
3. 操作人
4. 结果
5. 截图或 SQL 结果
6. 异常说明

例如：

| 验证线   | 步骤编号 | 操作人 | 结果 | 证据                 | 异常说明         |
| -------- | -------- | ------ | ---- | -------------------- | ---------------- |
| 管理员线 | A2       | 张三   | 通过 | 员工列表截图         | 无               |
| 员工线   | B6       | 李四   | 失败 | 越权更新成功截图     | 需要立即回滚排查 |
| SQL 线   | C5       | 王五   | 通过 | rowsecurity 查询结果 | 无               |

这样上线当天如果出现问题，能快速定位到底是：

- 数据绑定问题
- RLS 策略问题
- 还是前端页面适配问题
