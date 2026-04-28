## Why

当前系统缺少质量管理入口，返工返修申报仍依赖线下 Word 表单，记录难以检索、追踪和权限管控。新增返工返修电子表单可以让管理员在后台统一维护质量异常的申请、审核、改进与验证记录。

## What Changes

- 新增一级菜单“质量”，下设“返工返修”导航链接。
- 按《返工返修申报表》字段新增返工返修申报表单与列表页，覆盖类别、产品信息、责任单位、数量、时间、不合格描述、申请理由、技术审核、改进措施、验证结果等内容。
- 新增 Supabase 数据表保存返工返修记录，并配套索引、约束、更新时间触发器和 RLS 策略。
- 新增权限注册：`nav:quality` 和 `page:quality-rework-repair`，管理员通过现有自动授权机制获得访问和 CRUD 能力。
- 新增前端数据访问层与 TanStack Query hooks，创建、更新、删除后刷新返工返修列表。

## Capabilities

### New Capabilities

- `quality-rework-repair`: 质量模块中的返工返修记录管理，包含页面入口、表单录入、列表查询、管理员 CRUD 和数据持久化。

### Modified Capabilities

- None.

## Impact

- 影响前端菜单、路由、面包屑标题、权限注册表、质量 feature 模块、服务层 API 与 Query/Mutation hook。
- 新增 Supabase migration，创建 `quality_rework_repairs` 表并注册质量菜单/页面权限。
- 不引入新的前端依赖或第三方服务。
