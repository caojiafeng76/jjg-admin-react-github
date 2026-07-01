## Context

当前车间订单存储在 `sales_orders`，订单管理页面已维护项目号、客户、型号、长度、数量、交期、工艺流程等基础字段；`OrderStatusDashboard` 已能从生产工单和物料转移数据计算已加工、转移和生产状态。Excel 模板新增的排产流程要求在这些基础数据上补充初审评估、计划日期、订单类别/交期紧急程度，以及按工序拆分的待排/已排/余排明细。

本仓库的 `database.types.ts` 由 Supabase CLI 生成，不能手写；历史上新增 `sales_orders` 字段时服务层会以 `select('*')` 加业务类型扩展承接。为了让功能可以在现有类型约束下构建通过，本次优先扩展既有订单表，而不是新建独立排产表。

## Goals / Non-Goals

**Goals:**

- 落地 Excel 中的订单初审、排产状态、总待排和工序待排/已排/余排视图。
- 支持用户维护初审字段和工序排产明细，并持久化到 Supabase。
- 汇总总待排、已排产、余排产、已加工、转移数量和占比。
- 复用现有订单权限、路由、菜单、TanStack Query 缓存和 Ant Design 表格体验。

**Non-Goals:**

- 不实现自动排产算法或产能约束求解；本次以人工录入和进度汇总为主。
- 不拆分新的数据库主从表模型；若后续需要多人协同、审计或明细级权限，可再迁移为独立表。
- 不替换现有订单管理导入流程。

## Decisions

1. **初审字段扩展在 `sales_orders` 上。** 订单日期、计划开工/完成、交期评审、工艺要求、工装夹具、产能、瓶颈工序、物料状态、订单类别、交期紧急程度和排产备注都是订单级属性，直接放在 `sales_orders` 能与现有订单查询、状态和权限复用。备选方案是单独创建 `sales_order_reviews`，但会增加 join、RLS 和类型生成成本。

2. **工序排产明细使用 `process_schedules jsonb`。** Excel 里的工序待排/已排/余排属于订单内可变行集合，首版用 JSON 数组存储 `{processCode, processName, status, requiredProductionDate, scheduledDate, lastScheduledDate, scheduledQuantity, remark}`。备选方案是新建 `sales_order_process_schedules` 表，更适合复杂报表和并发编辑；但当前需求更接近 Excel 模板行编辑，JSON 能更快落地，并避免手动修改生成类型。

3. **排产页面独立于现有订单现状看板。** 新增 `ProductionScheduling` feature 使用独立 `order-scheduling` 路由，保留 `production-scheduling` 作为“订单现状”看板入口。页面内提供 Excel 对应的多标签视图。已加工和转移数量通过服务层从 `production_order_items`、`material_transfers` 汇总后合并到排产订单数据，避免复制现有生产数据。

4. **人工排产，不做自动拆分。** 页面提供从工艺流程解析工序的辅助操作，并允许用户编辑每个工序的排产数量和日期。余排数量按订单数量减已排产数量计算，避免用户手工维护汇总口径。

## Risks / Trade-offs

- JSON 明细不适合复杂 SQL 统计 → 首版服务层在客户端/应用层聚合；后续可迁移为明细表。
- `database.types.ts` 未实时生成新字段 → 服务层只对 `sales_orders` 使用 `select('*')` 和业务接口扩展，不手写生成文件。
- 多人同时编辑同一订单可能覆盖 JSON 明细 → 表单保存粒度为单订单，当前后台使用场景可接受；后续可引入明细表或乐观锁。
- 订单工艺流程文本不一定规范 → 解析函数支持编号和常见工序名，无法识别时仍允许用户手工新增/编辑排产行。

## Migration Plan

1. 新增 Supabase migration，给 `sales_orders` 添加订单排产字段和 `process_schedules jsonb` 默认值。
2. 新增排产服务层和 hooks，读取订单、聚合生产/转移数量、保存初审和工序排产明细。
3. 新增 `ProductionScheduling` 页面并接入路由/菜单。
4. 执行构建验证和 migration dry-run；如果可用，再按仓库数据库流程推送 migration。
