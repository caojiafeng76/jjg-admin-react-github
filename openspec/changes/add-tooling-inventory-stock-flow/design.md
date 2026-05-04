## Context

刀具模块当前已有 `tooling_data` 资料维护页面、导入功能、菜单分组和权限注册，但 `tooling-inventory`、`tooling-stock-in`、`tooling-stock-out` 路由仍指向占位页，菜单项也没有独立权限。

优迈成品库存/入库/出库已经提供可复用模式：资料表作为主数据，库存表保存当前库存与待审核汇总，入库/出库单通过状态切换触发数据库侧库存联动，前端负责 CRUD、批量审核和缓存失效。

当前工作区已有刀具资料导入相关未提交改动，本变更只在其基础上新增库存流转，不回退或覆盖既有改动。

## Goals / Non-Goals

**Goals:**

- 为刀具新增库存、入库、出库三张表和数据库触发器，保证库存口径由数据库统一维护。
- 新增三组 React 页面、服务层和 hooks，交互体验参考优迈成品库存/入库/出库。
- 接入路由懒加载、菜单权限、权限注册和 TanStack Query 缓存失效。
- 出库支持领用人、用途、出库日期、导入导出和打印。

**Non-Goals:**

- 不修改刀具资料字段定义和现有导入逻辑。
- 不手动修改自动生成的 `database.types.ts`。
- 不引入新的 UI 框架、状态管理库或库存计算前端逻辑。
- 不在本变更内处理历史刀具库存初始化数据导入。

## Decisions

1. **数据库作为库存流转唯一事实来源。**
   - 采用 `tooling_inventory`、`tooling_stock_in`、`tooling_stock_out` 三表，结构映射优迈成品表。
   - 入库/出库记录的 `待审核` 数量汇总到库存表的 pending 字段，`已审核` 按增量更新 `current_stock`。
   - 前端不自行计算库存，只展示数据库返回的 `current_stock`、`pending_stock_in`、`pending_stock_out`、`final_stock`。
   - 备选方案是在前端 mutation 后手动更新库存，风险是多端并发和导入场景口径分裂，因此不采用。

2. **刀具资料快照冗余到库存和单据。**
   - 单据保存 `tool_code`、`tool_name`、`tool_spec`、`material`、`unit_price`，避免资料后续变更影响历史单据展示。
   - `tooling_data_id` 仍作为唯一关联依据，库存表对其建唯一索引。

3. **审核后锁定核心字段。**
   - 已审核入库/出库记录只允许修改 `remarks`，禁止删除，避免已入账库存被无痕修改。
   - 状态允许 `待审核` 与 `已审核` 之间切换，库存触发器按新旧状态增量处理。

4. **前端沿用优迈模块布局和缓存策略。**
   - 列表使用 `queryConfig.list`、`keepPreviousData`、URL 搜索参数和 `useTableHeight`。
   - 入库/出库 mutation 同时失效自身列表 key 与 `tooling-inventory` key，确保审核后库存页刷新。
   - 出库导入按刀具编号匹配资料，导出和打印仅对选择记录执行。

5. **权限独立注册。**
   - 新增 `page:tooling-inventory`、`page:tooling-stock-in`、`page:tooling-stock-out`，菜单项和路由保护使用对应权限，而不是继续复用 `page:tooling-data`。

## Risks / Trade-offs

- [Risk] 新 migration 与当前未提交的刀具资料导入 migration 有顺序依赖。→ 使用晚于现有 `20260504133000` 的时间戳，外键引用现有 `tooling_data`。
- [Risk] 已审核单据的编辑限制若只放 UI，仍可能被 API 绕过。→ 使用数据库 before trigger 强制锁定，并在 UI 同步禁用核心字段。
- [Risk] 出库审核可能导致库存不足。→ 数据库触发器在扣减 `current_stock` 前校验并抛出中文错误，前端透传错误消息。
- [Risk] 自动生成数据库类型未包含新表。→ 服务层使用项目既有的动态 Supabase table pattern，避免手改生成文件。
