## Context

成本核算页面由 `StandardTimeList` 管理，数据源为 Supabase `process_standards` 表。当前列表已有多选、创建、编辑、删除和导出；管理员使用桌面端完整成本核算功能，班组长只维护理论工时。`StandardTime` 类型依赖生成的 `database.types.ts`，该文件由 Supabase CLI 生成，不手动修改。

## Goals / Non-Goals

**Goals:**

- 在 `process_standards` 增加 `is_last_process` 布尔字段，默认 `false` 且不可为空。
- 管理员可对当前选中成本核算记录批量设置末道状态为 true 或 false。
- 成本核算列表、详情和导出能看到末道状态。
- 批量更新后刷新成本核算列表和依赖成本核算的查询缓存。

**Non-Goals:**

- 不改变成本计算公式、触发器和生产工单工时同步逻辑。
- 不自动推断哪些工序是末道，不做单选唯一性约束。
- 不向班组长理论工时移动端暴露批量末道操作。

## Decisions

- 使用 `is_last_process boolean not null default false` 作为数据库字段。数据库 default 是新增记录的源头保障，前端创建表单无需额外提交该字段也会得到 false。
- 批量更新放在 `apiStandardTimes.ts` 服务层新增函数中，通过 `.update({ is_last_process: value }).in('id', ids)` 一次提交选中 ID。这样 UI 不直接拼 Supabase 操作，错误处理仍走 `handleApiError`。
- Hook 新增 `useUpdateStandardTimesLastProcess`，复用现有 `useMutationWithInvalidation`，失效键覆盖成本核算列表、process standards、生产工单和生产工单明细，避免列表或依赖页面保留旧标记。
- UI 采用两个明确按钮“设为末道”“取消末道”，作用于已勾选行。操作前用 `Modal.confirm` 二次确认，避免误批量修改。
- 列表与详情使用 `Tag` 展示“末道/非末道”；导出增加一列“末道”，值为“是/否”，方便线下核对。

## Risks / Trade-offs

- [生成类型尚未更新] → 先通过迁移更新数据库；若本地无法重新生成 Supabase 类型，可用局部扩展类型避免手改 `database.types.ts`，并在后续类型生成后自然收敛。
- [批量误操作] → 使用选中行数量校验和确认弹窗，成功后清空选择。
- [字段口径未来变化] → 仅存布尔标记，不引入唯一约束或自动推断，后续业务可基于该标记扩展。

## Migration Plan

- 新增 Supabase migration：给 `public.process_standards` 添加 `is_last_process` 字段和中文注释。
- 通过 Supabase MCP 或仓库 `bun run db:push` 应用迁移。
- 完成前端服务层、hook、表格、详情和导出更新。
- 执行 `bun run build`，并对变更文件运行 Ant Design lint（如 CLI 可用）。

## Open Questions

- 暂无。默认按“可多条成本核算记录同时为末道”实现，不限制同一型号或工艺流程只能有一个末道。
