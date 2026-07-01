## Why

刀具资料已经具备维护入口，但库存、入库、出库菜单仍停留在占位状态，无法按实际生产领用和盘点管理刀具数量。

参考优迈成品库存流转补齐刀具库存链路，可以让刀具资料、待审核单据、已审核库存变动保持同一套业务口径。

## What Changes

- 新增刀具库存页面，支持按刀具资料维护当前库存、待入库、待出库和最终库存展示。
- 新增刀具入库页面，支持创建、编辑、删除、批量审核/反审入库单，并联动库存。
- 新增刀具出库页面，支持领用人/用途登记、批量审核/反审、导入导出和打印，并联动库存。
- 新增 Supabase 表、约束和触发器，将待审核汇总、已审核库存增减、审核后锁定规则放在数据库侧执行。
- 补齐刀具库存、刀具入库、刀具出库的路由懒加载、菜单权限与缓存失效链路。

## Capabilities

### New Capabilities

- `tooling-inventory-stock-flow`: 刀具库存、刀具入库、刀具出库的页面、数据访问、审核流转和库存联动能力。

### Modified Capabilities

## Impact

- 前端：`src/features/tooling`、`src/services`、`src/routes`、`src/ui/MainMenu.tsx`、权限注册。
- 数据库：新增 `tooling_inventory`、`tooling_stock_in`、`tooling_stock_out` 及相关索引、约束、触发器、RLS 策略。
- 工具：新增刀具库存/出库 Excel 解析导出和刀具出库 PDF 打印工具。
- 验证：至少执行 `bun run build`；数据库 migration 使用仓库脚本或 Supabase MCP/CLI 进行可用性校验。
