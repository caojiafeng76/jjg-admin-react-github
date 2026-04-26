## Why

成本核算需要明确哪些工序属于订单流程的末道工序，方便后续按末道口径做生产现状、完工或入库相关判断。当前 `process_standards` 没有可维护的末道标记，管理员只能通过工序名称人工识别，容易产生不一致。

## What Changes

- 在成本核算 `process_standards` 中新增布尔字段 `is_last_process`，默认值为 `false`。
- 成本核算列表展示“末道”状态。
- 管理员可勾选一批成本核算记录，并一键批量设置为“末道”或“非末道”。
- 批量更新成功后刷新成本核算列表和依赖 `process_standards` 的缓存。
- 成本核算导出中包含“末道”字段，便于线下核对。

## Capabilities

### New Capabilities

- `cost-accounting-last-process-flag`: 管理员维护成本核算记录的末道布尔标记，并支持批量设为 true/false。

### Modified Capabilities

## Impact

- 数据库：`process_standards` 新增 `is_last_process boolean not null default false`。
- 受影响代码：`src/services/apiStandardTimes.ts`、`src/features/workshop/StandardTimeList/*`、`src/utils/costAccountingExcel.ts`。
- 缓存：成本核算列表、process standards、生产工单相关查询在批量更新后需要失效。
- 权限：批量标记入口仅在管理员桌面端成本核算工具栏出现，班组长理论工时模式不暴露。
