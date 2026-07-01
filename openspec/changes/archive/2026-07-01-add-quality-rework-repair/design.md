## Context

系统现有 PC 端模块通过 [src/ui/MainMenu.tsx](src/ui/MainMenu.tsx)、[src/routes/router.tsx](src/routes/router.tsx)、[src/routes/lazyPages.ts](src/routes/lazyPages.ts) 和 [src/routes/routeLabels.ts](src/routes/routeLabels.ts) 接入页面。权限体系以 `permissions` / `role_permissions` 为注册表，前端通过 `PERMISSION_REGISTRY` 静默同步，路由使用 `PermissionProtectedRoute`，业务表常用 `current_user_has_permission('page:*')` 做 RLS。

用户提供的《返工返修申报表》包含字段：编号、返工返修类别、产品名称、规格型号、责任单位、返工返修数量、计划返工时间、实际返工时间、不合格描述、返工返修申请理由、车间申请人/日期、生产部审核人/日期、技术部审核意见/审核人/日期、改进措施/责任人/日期、返工返修验证结果/质量部验证人/日期。

## Goals / Non-Goals

**Goals:**

- 新增质量一级菜单和返工返修页面入口。
- 新增 `quality_rework_repairs` 数据表，结构化保存 Word 表单中的关键字段。
- 管理员默认拥有页面访问与 CRUD 能力；CRUD 后列表缓存及时刷新。
- 表单和表格遵循现有后台 CRUD 模块风格，保持紧凑、可检索、可分页。

**Non-Goals:**

- 本次不实现审批流、打印/PDF 导出或附件上传。
- 本次不手动修改 `database.types.ts`。
- 本次不为非管理员角色预设质量模块权限；后续可通过权限管理分配。

## Decisions

- **字段建模采用结构化列 + 文本意见列。** 类别、产品、责任单位、数量、日期、人员分别建列，长意见用 `text` 保存。相比保存整份 JSON，结构化列更利于列表展示、搜索和后续统计。
- **项目号使用 `project_no` 关联订单管理。** 与物料转移单等模块保持一致，以 `sales_orders.project_no` 作为业务关联键，不新增硬外键，避免历史订单项目号空值或重复数据阻塞质量记录落地。选择项目号后填充：产品名称 = 订单产品型号，规格型号 = 客户型号 + 长度，责任单位 = 客户；返工返修数量不从订单带出，由用户按实际异常数量填写。
- **编号由数据库序列表生成。** 新增按日期分组的 `quality_rework_repair_document_sequences`，RPC `next_quality_rework_repair_document_no()` 返回 `YYYYMMDD` + 3 位顺序号。前端创建表单打开时预取编号并禁用手改；服务层在编号缺失时兜底调用 RPC；数据库 before insert trigger 在直接插入时兜底生成，唯一索引继续保护非空编号。
- **返工返修类别用固定枚举值。** 表单提供四类：进货检验不合格、过程检验不合格、成品检验不合格、顾客退货。前端用 Select，数据库用 CHECK 约束兜底。
- **RLS 绑定 `page:quality-rework-repair`。** 这样路由、菜单和数据读写权限使用同一个权限源；admin 由现有 `auto_grant_to_admin` trigger 自动获得权限。
- **前端模块放在 `src/features/quality/ReworkRepair`。** 新增 `permissions.ts` 由全局权限注册表导入，页面内部复用 `useTableHeight`、`AppPagination`、`AddButton`、`EditButton`、`DeleteButton` 和 `useMutationWithInvalidation`。

## Risks / Trade-offs

- [Risk] 前端预取编号会在用户取消创建时产生跳号。 → 需求只要求唯一和自动填写，不要求连续无跳号；采用序列表换取并发安全与可见编号一致性。
- [Risk] 订单字段自动带出可能与实际返工责任不完全一致。 → 只作为默认填充，产品、规格和责任单位仍允许用户编辑；数量由用户自行填写。
- [Risk] 新表不更新生成的 Supabase 类型会导致类型不完整。 → 服务层沿用仓库现有 `unknown as { from(table:string): any }` 适配模式，不手动改生成文件。
- [Risk] 若只加前端权限不加 RLS，数据层会漏保护。 → migration 同时注册权限并创建 RLS 策略。
- [Risk] 表单字段较多，弹窗过窄会影响录入效率。 → Modal 使用较宽尺寸，表单分组布局，长文本用 TextArea。
