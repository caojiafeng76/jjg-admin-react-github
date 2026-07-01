## Why

现有返工返修流程被放在编辑弹窗的内部 Tabs 中，无法体现“车间发起 → 生产部确认 → 技术部确认 → 质量部最终确认”的页面级流转。需要把 `quality-rework-repair` 调整为按部门待办分区的流程工作台，让记录在确认后进入下一部门的待办列表。

## What Changes

- 将返工返修页面的流程 Tabs 移到页面主体，作为部门待办列表的主导航。
- 每个页面 Tab 自动按对应 `workflow_status` 查询记录，搜索区不再额外暴露流程状态筛选。
- 保留处理弹窗，但弹窗只展示当前阶段需要填写的字段，不再在弹窗内切换流程 Tabs。
- 修正提交动作的状态流转：车间提交到生产部、生产部提交到技术部、技术部提交到质量部、质量部完成。
- 保留 `workshop_pending` 作为车间待提交阶段，便于车间创建后继续补充再提交。

## Capabilities

### New Capabilities

- `rework-repair-page-workflow`: 返工返修页面级多部门流程工作台与阶段提交流转。

### Modified Capabilities

- (无)

## Impact

- **UI**: `src/features/quality/ReworkRepair/index.tsx` 页面结构与弹窗内容控制。
- **Search/Table**: 流程状态筛选移到页面 Tabs；状态标签文案同步为确认流转语义。
- **Business Rule**: 明确 `workflow_status` 的单向流转矩阵。
- **Database**: 不新增字段，不执行 DDL。
