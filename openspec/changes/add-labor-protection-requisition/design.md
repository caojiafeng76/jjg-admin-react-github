## Context

当前劳保模块仅覆盖劳保资料主数据，代码结构位于 `src/features/labor-protection/LaborProtectionData`，并已接入菜单、懒加载路由、Supabase 服务层与管理员专用 RLS。新增“领料单”需求会同时影响数据库结构、服务层、React Query hooks、劳保模块页面入口和导航，因此需要在现有模式上补一条完整链路，而不是只增加一个孤立页面。

约束包括：

- 项目使用 React 19 + Ant Design + TanStack Query 5，列表页沿用分页、URL 搜索参数和 `useMutationWithInvalidation` 模式。
- `src/services/database.types.ts` 由 CLI 生成，当前不能手工更新，因此新增表的服务层需要兼容类型暂未生成的情况。
- 管理端页面默认通过 Supabase RLS 控制权限，劳保资料已使用 `public.is_admin()` 策略。

## Goals / Non-Goals

**Goals:**

- 新增劳保领料单的数据表和管理员 CRUD 能力。
- 让“种类”字段复用劳保资料中的种类，前端通过下拉选择，后端通过外键保证引用合法。
- 在现有劳保模块下补充菜单、路由、懒加载入口和服务层，保持与现有 CRUD 页面一致的交互模式。
- 保证数量字段在数据库和表单层都只能录入正整数。

**Non-Goals:**

- 不实现员工端、自助领用或审批流。
- 不做库存扣减、发放统计、导出打印或批量导入。
- 不修改既有劳保资料的业务规则，只将其作为领料单的可选主数据来源。

## Decisions

### 1. 新增独立表 `labor_protection_requisitions`

采用独立表存储领料记录，字段包括 `labor_protection_data_id`、`job_title`、`quantity`、`recipient`、时间戳，并为 `labor_protection_data_id` 建立外键。

原因：

- 领料单是事务数据，不应混入劳保资料主数据表。
- 外键可以保证记录始终指向有效种类，比仅保存文本更稳。

备选方案：

- 仅保存 `category` 文本：实现更快，但无法防止劳保资料变更后出现脏数据，也无法天然支持下拉联动。

### 2. 列表查询直接 join 劳保资料并返回展示字段

服务层列表接口使用 Supabase 关联查询，直接返回领料单记录及其关联的种类文本，页面无需二次拼装。

原因：

- 减少页面层的数据拼接逻辑。
- 编辑时可以同时拿到 `labor_protection_data_id` 和展示名称，便于表单回填。

备选方案：

- 页面单独查询领料单和劳保资料后在前端 merge：会增加状态同步复杂度，也更容易在分页和回填上出错。

### 3. 继续沿用劳保资料页面的 CRUD 组织方式

新增 `src/features/labor-protection/LaborProtectionRequisition/` 目录，拆分为 `index.tsx`、`Form`、`Table`、`Search`、`useLaborProtectionRequisition.ts`，并复用现有按钮、分页和表格高度 hooks。

原因：

- 符合仓库既有 feature 模式，便于维护。
- 可复用已验证的分页、搜索、批量删除与 modal 表单流程。

备选方案：

- 在劳保资料页面内嵌一个 tabs 子页：会让两个概念耦合，后续扩展审批或统计时不利于维护。

### 4. 权限策略沿用 admin-only

数据库和路由都限制为管理员访问，菜单只在管理员侧展示。

原因：

- 用户要求管理员 CRUD。
- 现有劳保资料也是同一权限模型，保持一致可降低理解成本。

## Risks / Trade-offs

- [数据库类型未重新生成] → 服务层使用与现有劳保资料一致的弱类型 `from(table)` 包装，避免因为未更新 `database.types.ts` 导致构建失败。
- [删除已被领料单引用的劳保资料] → 外键默认限制删除，保持数据完整性；如果管理员先删种类，数据库会明确拒绝该操作。
- [列表页只做关键词搜索，无法按种类和岗位分栏过滤] → 本次先保持与现有劳保资料页面同等复杂度，后续如有需要再扩展多条件筛选。
- [新增迁移但未应用远程库时页面会报表不存在] → 本次交付包含 migration 文件，并在最终说明中明确本地已做构建验证，但数据库变更仍需执行迁移。

## Migration Plan

1. 新增 Supabase migration，创建 `labor_protection_requisitions` 表、索引、触发器、RLS 与外键。
2. 新增前端服务层与劳保领料单 feature 页面。
3. 接入懒加载路由和菜单入口。
4. 执行构建验证，确认 TypeScript、路由与组件编译通过。

回滚方式：

- 若未部署数据库迁移，直接回退代码即可。
- 若已部署迁移，需要单独新增回滚 migration 删除 `labor_protection_requisitions` 表及相关对象；本次不直接提供 destructive rollback。

## Open Questions

- 当前没有额外开放问题。字段定义和访问角色已经足够明确，可直接实施。
