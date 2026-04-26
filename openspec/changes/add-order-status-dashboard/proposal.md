## Why

生产管理需要一个以订单为中心的现状视图，把订单管理、生产工单、成本核算和岗位基础信息串起来，快速看到每个订单在各工序岗位上的产量推进情况。

当前“排产计划”入口仍是占位页，无法承载订单生产状态跟踪；先落地一个只读汇总版本，方便后续按实际使用反馈继续调整字段和样式。

## What Changes

- 将“排产计划”导航和页面标题改为“订单现状”。
- 在原 `production-scheduling` 路由下实现订单现状页面，不新增写入流程。
- 按订单汇总关联的生产工单明细，外层按成本核算“工种”作为岗位展示合格数量，明细中再按实际工序分别统计合格数量。
- 按“生产中”和“已结案”两个页签查看订单现状。
- 支持按订单日期、项目号、型号对订单现状进行模糊搜索。
- 按订单关联物料转移单，展示转移数量、入库数量、接收车间和最近转移记录。
- 支持点击物料转移数量，弹出该订单的物料转移明细。
- 支持点击岗位产量单元格，弹出该订单该岗位下不同工序的合格数量汇总和生产工单明细。
- 结合成本核算工种配置生成岗位列，先提供接近长图样式的横向表格。

## Capabilities

### New Capabilities

- `order-status-dashboard`: 以订单为中心查看各工序岗位合格数量和生产状态汇总。

### Modified Capabilities

### Impact

- 受影响代码：`src/ui/MainMenu.tsx`、`src/ui/AppHeader.tsx`、`src/pages/ComingSoonPage.tsx`、`src/routes/*`、`src/features/workshop/*`、`src/features/production-order/*`、`src/features/material-transfer/*`、`src/services/*`。
- 不引入新依赖，不修改数据库结构，不改变现有订单、生产工单、成本核算或岗位基础数据的写入规则。
