## Why

车间订单目前只能由用户看到 100% 出库提醒后手动结案，无人处理时已完成订单会继续停留在生产中并出现在后续工单关联入口。需要把现有完成度口径落实为可靠的数据库自动状态流转，并让手动反结案成为永久人工接管信号。

## What Changes

- 记录订单当前一次达到 100% 出库完成度的时间；跌破 100% 后清空并在再次达标时重新计时。
- 达标持续满 2 天且未被豁免的生产中订单由数据库定时任务自动结案。
- 订单从已结案手动改回生产中后永久退出自动结案流程，现有状态管理权限保持不变。
- 根据现有物料转移记录回首次达标时间，并立即结案已满足 2 天条件的存量订单。

## Capabilities

### New Capabilities

- `workshop-order-auto-close`: 车间订单完成时间追踪、延迟自动结案、反结案永久豁免和存量订单补处理。

### Modified Capabilities

无。

## Impact

- 数据库：`public.sales_orders`、`public.material_transfers`、私有触发器函数、Supabase Cron。
- 类型：由 Supabase CLI 重新生成 `src/services/database.types.ts`。
- 前端：沿用现有订单状态、结案时间、权限、Mutation 和缓存刷新链路，不新增页面入口或字段。
- 运行时：新增每 15 分钟执行一次的轻量数据库任务。
