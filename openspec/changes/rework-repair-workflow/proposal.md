## Why

当前返工返修页面采用单一表单展示所有流程信息，无法清晰区分不同部门的职责和流程阶段。用户需要一个基于流程阶段的视图，让车间、生产部、技术部、质量部各自只看到和编辑自己负责的字段，同时支持部门间的流转审批。

## What Changes

- **新增数据库字段**：`production_review_opinion`（生产部审核意见），用于生产部审核环节
- **UI 重构**：将单一表单改为 4 个 Tab 页面（车间、生产部、技术部、质量部）
- **流程控制**：每个 Tab 对应一个流程阶段，显示/编辑该阶段相关的字段
- **状态管理**：新增 `workflow_status` 字段追踪当前流程状态

## Capabilities

### New Capabilities

- `rework-repair-workflow`: 返工返修多部门流程管理，包括车间提交、生产部审核、技术部审核、质量部验证的完整流程

### Modified Capabilities

- (无，本次为新增能力)

## Impact

- **数据库**：`quality_rework_repairs` 表需新增 `production_review_opinion` 和 `workflow_status` 字段
- **API**：`apiQualityReworkRepair.ts` 需更新类型定义和查询逻辑
- **UI**：`ReworkRepair/index.tsx` 需重构为 Tab 结构
- **表单**：`ReworkRepairForm.tsx` 需拆分为多个表单组件
- **权限**：可能需要新增部门级权限控制
