## Context

返工返修记录已具备 `workflow_status` 字段以及车间、生产部、技术部、质量部的字段。当前实现把四个部门 Tabs 放在 Modal 内部，并且保存时把状态设置为当前 Tab 对应状态，导致流程不会真正流向下一部门。

目标是让页面本身成为流程工作台：用户进入 `quality-rework-repair` 后直接看到按部门拆分的待办 Tabs；每个 Tab 下的表格只显示当前部门需要处理的记录。

## Workflow Rules

| 当前阶段             | 页面 Tab       | 允许操作                     | 提交后状态           |
| -------------------- | -------------- | ---------------------------- | -------------------- |
| `workshop_pending`   | 车间发起       | 新建/编辑车间申请并提交      | `production_pending` |
| `production_pending` | 生产部确认     | 填写生产部审核意见并确认     | `technical_pending`  |
| `technical_pending`  | 技术部确认     | 填写技术意见和改进措施并确认 | `quality_pending`    |
| `quality_pending`    | 质量部最终确认 | 填写验证结果并最终确认       | `completed`          |
| `completed`          | 已完成         | 查看/维护已有记录            | `completed`          |

车间新建记录默认保存到 `workshop_pending`；在车间 Tab 中提交已有记录时，流转到 `production_pending`。

## UI Design

- 页面主体使用 Ant Design `Tabs`：车间发起、生产部确认、技术部确认、质量部最终确认、已完成。
- Tab 切换更新 URL 中的 `workflowStatus`，并重置页码与已选记录。
- 搜索区保留类别和关键词；流程状态由页面 Tab 控制，避免同一状态出现两个入口。
- 顶部主按钮根据当前 Tab 变化：
  - 车间发起：显示“新建返工返修记录”和“提交生产部”。
  - 生产部确认：显示“生产部确认”。
  - 技术部确认：显示“技术部确认”。
  - 质量部最终确认：显示“质量部最终确认”。
  - 已完成：显示“查看/维护”。
- 删除按钮保持现有批量删除能力。
- 弹窗只展示当前阶段表单字段，不再包含内部 Tabs。

## Implementation Notes

- 使用现有 `useQualityReworkRepairList` 的 `workflowStatus` 查询参数，无需新增 Query Hook。
- 将状态流转集中到页面常量中，避免散落在保存逻辑内。
- 编辑生产/技术/质量阶段时，表单仍随 payload 带上已有字段，避免更新接口覆盖为空。
- 不实现部门权限控制和回退流程；后续如果接入 RBAC/RLS，再把 UI 动作限制和后端策略同步收紧。

## Verification

- `bun run build` 验证 TypeScript 和 Vite 构建。
- 手动检查 Tab 状态、提交按钮文案、状态流转映射和搜索参数一致性。
