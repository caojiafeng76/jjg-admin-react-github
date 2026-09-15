# JJG Admin React

基于 React 19 + TypeScript + Vite 的企业管理后台系统，主要覆盖“西尼”扶梯踏板与“车间”生产相关业务。

## 技术栈

- React 19.2
- TypeScript 6.0
- Vite 8
- Ant Design 6
- Tailwind CSS 4
- TanStack Query 5
- Zustand 5
- Supabase

## 开发命令

```bash
bun dev
bun run build
bun run typecheck
bun run test
bun run test:watch
bun run test:coverage
bun preview
bun lint
bun lint:fix
bun format
bun run ai:doctor
bun run graphify:build
bun run graphify:update
bun run db:doctor
bun run db:push
bun run db:push:dry-run
bun run db:query -- --file docs/sql-drafts/example.sql
bun run db:types
```

说明：

- 项目使用 bun 作为包管理器
- 已配置 Vitest + Testing Library + jsdom，日常验证默认先跑 `bun run test`
- 运行测试请使用 `bun run test`，不要用 Bun 内置的 `bun test` 代替
- 完成任务后必须确保测试通过才能交付；涉及前端或 TypeScript 改动时，继续按风险补充 `bun run build`、lint 和局部回归
- `bun run typecheck` 只做 TypeScript 项目级类型检查（`tsc -b`），比完整 `bun run build` 快，适合作为改动后的快速校验
- 推送到 GitHub 后，CI（`.github/workflows/ci.yml`）会自动执行 lint、typecheck、test、build 兜底校验
- `bun run ai:doctor` 用于检查 AI 工具链、MCP 配置、环境变量 和 Graphify 索引状态

Supabase 数据库命令补充：

- `bun run db:push`: 默认走远程 linked 项目，执行 migration
- `bun run db:push:dry-run`: 预演待执行 migration
- `bun run db:query -- --file <sql-file>`: 执行单个 SQL 文件，适合数据修复或只读核对
- `bun run db:doctor`: 检查 CLI、登录、query 链路、push 链路分别是否正常
- `bun run db:types`: 从远程 linked 项目重新生成 `src/services/database.types.ts`；任何 migration 执行成功后都应运行一次，保持类型与 schema 一致

说明：本仓库已确认 `supabase start/status` 的本地容器模式依赖 Docker Desktop；如果 Docker 未运行，不影响远程 CLI 和 MCP 路径继续执行数据库脚本。若 `db:push` 失败但 `db:query` 正常，通常不是没登录，而是 linked 直连远程数据库链路失败；这时优先执行 `bun run db:doctor`，必要时配置 `SUPABASE_DB_URL` 作为回退。详见 [docs/Supabase数据库脚本执行说明.md](docs/Supabase数据库脚本执行说明.md)。

## 目录结构

```text
src/
├── features/      # 按业务域组织的功能模块
├── services/      # Supabase 数据访问层
├── hooks/         # 共享 Hooks
├── ui/            # 通用 UI 组件
├── config/        # 全局配置
├── store/         # Zustand 状态
├── routes/        # 路由
└── utils/         # 工具函数
```

常用路径别名：

- `@/` -> `src/`
- `@ui/` -> `src/ui/`
- `@features/` -> `src/features/`
- `@hooks/` -> `src/hooks/`
- `@services/` -> `src/services/`
- `@utils/` -> `src/utils/`

## 开发约定

- API 访问统一放在 `src/services/`
- Supabase 错误统一通过 `handleApiError` 处理
- 列表和详情查询优先复用 `queryClient` 中已有的缓存策略
- Mutation 优先使用 `useMutationWithMessage`
- 错误信息和用户可见文案默认使用中文
- `src/services/database.types.ts` 由工具生成，禁止手动修改

## Copilot 固定流程

本仓库已经为 VS Code Copilot 配置了项目级固定执行流程，目标是让 AI 在日常任务里尽量遵循一致的方法：

1. 先复述目标、约束和预期输出
2. 复杂任务先分析问题、假设、风险和执行顺序
3. 使用文件搜索、`rg` 或可用的语言服务建立上下文
4. 根据任务类型使用相关 skill
5. 仅在信息不足时提出最少必要澄清问题
6. 实施前给出简短计划
7. 保持改动最小化，优先修复根因
8. 改动后做必要验证，完成任务后必须确保 `bun run test` 通过才能交付
9. 最终按固定结构汇报结果

默认规则定义在 [.github/copilot-instructions.md](.github/copilot-instructions.md)，任务类型分流和最低验证矩阵见 [.github/ai-task-matrix.md](.github/ai-task-matrix.md)。工具状态不确定时，先运行 `bun run ai:doctor`。

## MCP 配置

项目级配置位于 [.mcp.json](.mcp.json)、[.codex/config.toml](.codex/config.toml) 和 [opencode.jsonc](opencode.jsonc)，保留 Supabase、Context7 和 Chrome DevTools。

Supabase MCP 使用本机 `SUPABASE_ACCESS_TOKEN` 环境变量，不要把 token 写入仓库。修改配置后重启相应客户端或新建会话，以刷新工具列表。

历史业务规格保留在 `openspec/`，历史工具笔记保留在 `docs/ai-notes/`，仅供查阅；当前任务执行规则以 `.github/copilot-instructions.md` 为准。

## Skill 使用约定

根据任务类型选择相关 skill，复用项目已有实现和约定。

优先使用的 skill 如下：

- `tanstack-query`
  适用于列表查询、详情查询、Mutation、缓存失效、乐观更新、列表与详情联动。
- [.github/skills/supabase-rls-patterns/SKILL.md](.github/skills/supabase-rls-patterns/SKILL.md)
  适用于 RLS、员工数据隔离、角色权限、Auth 绑定。
- [.github/skills/supabase-bulk-operations/SKILL.md](.github/skills/supabase-bulk-operations/SKILL.md)
  适用于 Excel 导入、批量 upsert、历史数据修复、幂等导入。
- [.github/skills/business-rules-engine/SKILL.md](.github/skills/business-rules-engine/SKILL.md)
  适用于状态流转、领域规则、工时/成本/数量计算、编辑约束。
- [.github/skills/mobile-responsive-patterns/SKILL.md](.github/skills/mobile-responsive-patterns/SKILL.md)
  适用于员工手机端、H5 页面、扫码流程、响应式改造、触屏交互。

推荐顺序：选择相关 skill → 搜索并阅读代码 → 按需计划 → 实施、验证和汇报。

## 在 VS Code 中使用项目 Prompt

直接描述任务，或使用下列入口；AI 会先读取相关代码与文档，再按任务风险安排实施和验证。

## Copilot 项目级 Prompt

除了默认规则外，仓库还提供了几个可直接在 VS Code Copilot Chat 使用的项目级 slash prompt，用来约束不同类型任务的执行流程。

### 通用执行

文件： [.github/prompts/task-exec.prompt.md](.github/prompts/task-exec.prompt.md)

适用场景：

- 通用开发任务
- 重构
- 排查问题
- 需要 AI 从头按固定工程流程推进的工作

示例：

```text
/task-exec 给生产工单列表增加按车间筛选
```

### 缺陷修复

文件： [.github/prompts/bugfix.prompt.md](.github/prompts/bugfix.prompt.md)

适用场景：

- 页面报错
- 行为不符合预期
- 回归问题
- 线上问题排查

示例：

```text
/bugfix 修复订单详情页切换分页后数据错乱
```

### 代码评审

文件： [.github/prompts/review.prompt.md](.github/prompts/review.prompt.md)

适用场景：

- 审查某次改动风险
- 查缺陷、回归、测试缺口
- review 某个模块或 PR 范围

示例：

```text
/review 检查最近对员工权限模块的改动风险
```

### 数据库变更

文件： [.github/prompts/db-change.prompt.md](.github/prompts/db-change.prompt.md)

适用场景：

- Supabase / Postgres 迁移
- RLS 策略调整
- SQL 草案
- 数据修复评估
- 查询优化

示例：

```text
/db-change 为员工手机端相关表补充 RLS 策略
```

这个入口会额外约束：

- 先评估影响范围
- 主动使用 `.github/skills/supabase-rls-patterns/` 或 `.github/skills/supabase-bulk-operations/` 对齐数据库场景
- 优先用迁移文件表达 DDL 变更
- 默认不手改 `database.types.ts`
- 明确说明风险、兼容性和回滚方案

### 新功能开发

文件： [.github/prompts/feature-impl.prompt.md](.github/prompts/feature-impl.prompt.md)

适用场景：

- 新增页面
- 新增业务模块
- 新交互或新流程
- 接口接入与功能扩展

示例：

```text
/feature-impl 新增员工手机端工单详情页
```

这个入口会额外要求：

- 先看现有模块和相似实现
- 主动使用 `tanstack-query`、`.github/skills/business-rules-engine/`、`.github/skills/mobile-responsive-patterns/` 中与任务匹配的 skill
- 优先复用现有 feature 结构与 Query / Mutation 模式
- 明确涉及文件、切入点和数据边界
- 做最小必要验证并说明剩余限制

## 环境配置

项目使用环境变量配置 Supabase 后端服务，环境变量存储在 `.env` 文件中，该文件不应提交到版本控制系统。

### 配置步骤

1. 复制 `.env.example` 并重命名为 `.env`：

   ```bash
   cp .env.example .env
   ```

2. 登录 [Supabase Dashboard](https://app.supabase.com/)，进入项目 **Settings** → **API**，填入以下配置：

   | 变量名                        | 说明                          | 示例                        |
   | ----------------------------- | ----------------------------- | --------------------------- |
   | `VITE_REACT_APP_SUPABASE_URL` | Supabase 项目 URL             | `https://xxxxx.supabase.co` |
   | `VITE_REACT_APP_SUPABASE_KEY` | Supabase 匿名密钥 (公开密钥)  | `eyJhbGci...`               |
   | `SUPABASE_DB_URL`             | Supabase CLI 远程数据库连接串 | `postgresql://...`          |

   > `SUPABASE_DB_URL` 可选：仅供 Supabase CLI 使用。如果 `bun run db:push` 的 linked 直连失败（如 WARP/代理环境 TLS 拦截），配置该回退值即可；一次性 SQL 仍可继续使用 `bun run db:query -- --file <sql-file>`。

3. 启动开发服务器验证：`bun dev`；数据库 CLI 链路验证：`bun run db:doctor`。

### 安全注意事项

> [!WARNING]
>
> - **切勿**将 `.env` 文件提交到 Git 仓库
> - **切勿**在代码中硬编码敏感信息
> - 使用 `anon` 密钥而非 `service_role` 密钥
> - 确保 `.gitignore` 包含 `.env`

## 使用建议

- 不确定用哪一个时，优先使用 `/task-exec`
- 明确是 bug 时，用 `/bugfix`
- 明确是评审时，用 `/review`
- 涉及 Supabase、迁移、RLS、SQL 时，用 `/db-change`
- 明确是在做新功能时，用 `/feature-impl`

如果任务本身很小，直接自然语言提问也可以；这些 prompt 的价值主要在于让 Copilot 在复杂任务上更稳定地遵循统一流程。

## 相关文件

- [.github/copilot-instructions.md](.github/copilot-instructions.md)
- [.github/prompts/task-exec.prompt.md](.github/prompts/task-exec.prompt.md)
- [.github/prompts/bugfix.prompt.md](.github/prompts/bugfix.prompt.md)
- [.github/prompts/review.prompt.md](.github/prompts/review.prompt.md)
- [.github/prompts/db-change.prompt.md](.github/prompts/db-change.prompt.md)
- [.github/prompts/feature-impl.prompt.md](.github/prompts/feature-impl.prompt.md)
- [.github/skills/supabase-rls-patterns/SKILL.md](.github/skills/supabase-rls-patterns/SKILL.md)
- [.github/skills/supabase-bulk-operations/SKILL.md](.github/skills/supabase-bulk-operations/SKILL.md)
- [.github/skills/business-rules-engine/SKILL.md](.github/skills/business-rules-engine/SKILL.md)
- [.github/skills/mobile-responsive-patterns/SKILL.md](.github/skills/mobile-responsive-patterns/SKILL.md)
- [AGENTS.md](AGENTS.md)
- [.env.example](.env.example)
