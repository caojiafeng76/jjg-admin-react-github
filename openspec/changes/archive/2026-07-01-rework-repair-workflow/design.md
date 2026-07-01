## Context

当前 `quality_rework_repairs` 表存储返工返修记录，包含车间申请、生产部审核、技术部审核、质量部验证等字段。现有 UI 采用单一表单展示所有信息，用户体验不清晰。

**流程说明**：
1. **车间**：填写基础信息、不合格描述、申请理由，提交到生产部
2. **生产部**：审核车间提交的内容，填写审核意见，提交到技术部
3. **技术部**：填写技术审核意见、改进措施，提交到质量部
4. **质量部**：填写验证结果，完成流程

## Goals / Non-Goals

**Goals:**
- 通过 Tab 切换实现流程可视化
- 每个部门只看到/编辑自己负责的字段
- 新增 `production_review_opinion` 字段支持生产部审核意见
- 新增 `workflow_status` 字段追踪流程状态

**Non-Goals:**
- 不实现流程审批的权限控制（本次仅 UI 层面区分）
- 不实现流程回退功能
- 不修改现有数据库表结构（由用户手动执行 SQL）

## Decisions

### 1. Tab 结构设计

使用 Ant Design `Tabs` 组件，4 个 Tab 对应 4 个部门：

```
| 车间 | 生产部 | 技术部 | 质量部 |
```

**每个 Tab 内容**：
- **车间 Tab**：基础信息 + 车间申请字段（只读显示后续流程字段）
- **生产部 Tab**：基础信息（只读）+ 生产部审核字段
- **技术部 Tab**：基础信息（只读）+ 技术部审核字段
- **质量部 Tab**：基础信息（只读）+ 质量部验证字段

**替代方案考虑**：
- 方案 A：4 个独立页面 → 被否决，因为路由管理复杂
- 方案 B：步骤条 + 表单 → 被否决，不如 Tab 直观

### 2. 工作流状态字段

新增 `workflow_status` 枚举字段：

```typescript
type WorkflowStatus = 
  | 'workshop_pending'    // 车间待提交
  | 'production_pending'  // 生产部待审核
  | 'technical_pending'   // 技术部待审核
  | 'quality_pending'     // 质量部待验证
  | 'completed'           // 流程完成
```

**设计理由**：
- 明确标识当前流程阶段
- 支持按状态筛选列表
- 为后续权限控制预留基础

### 3. 表单拆分策略

将 `ReworkRepairForm.tsx` 拆分为：

```
ReworkRepair/
├── index.tsx                    # 主容器（Tabs）
├── ReworkRepairTable.tsx        # 表格（不变）
├── ReworkRepairSearch.tsx       # 搜索（不变）
├── forms/
│   ├── WorkshopForm.tsx         # 车间表单
│   ├── ProductionForm.tsx       # 生产部表单
│   ├── TechnicalForm.tsx        # 技术部表单
│   └── QualityForm.tsx          # 质量部表单
└── useQualityReworkRepair.ts    # hooks（不变）
```

**设计理由**：
- 每个部门表单独立维护，降低耦合
- 共享基础信息组件避免重复代码
- 符合项目 Feature 模块结构规范

### 4. 新增数据库字段 SQL

```sql
-- 新增生产部审核意见字段
ALTER TABLE quality_rework_repairs 
ADD COLUMN production_review_opinion TEXT DEFAULT '';

-- 新增工作流状态字段
ALTER TABLE quality_rework_repairs 
ADD COLUMN workflow_status VARCHAR(50) DEFAULT 'workshop_pending';
```

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| 数据库字段未同步导致运行时错误 | 先执行 SQL 迁移，再部署前端代码 |
| 现有数据无 workflow_status 值 | SQL 默认值设为 'workshop_pending' |
| Tab 切换性能问题 | 使用 `destroyInactiveTabPane` 优化 |

## Open Questions

1. 是否需要在列表页显示 `workflow_status` 列？
2. 是否需要按 `workflow_status` 筛选列表？
