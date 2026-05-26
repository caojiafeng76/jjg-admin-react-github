# JJG Admin React

基于 React 19 + TypeScript + Vite 的企业管理后台系统，主要覆盖“西尼”扶梯踏板与“车间”生产相关业务。

## 技术栈

- React 19
- TypeScript 5.7
- Vite 7
- Ant Design 6
- Tailwind CSS 4
- TanStack Query 5
- Zustand 5
- Supabase

## 开发命令

```bash
bun dev
bun run build
bun run test
bun run test:watch
bun run test:coverage
bun preview
bun lint
bun lint:fix
bun format
bun run db:doctor
bun run db:push
bun run db:push:dry-run
bun run db:query -- --file docs/sql-drafts/example.sql
bunx spec-workflow-mcp --help
```

说明：

- 项目使用 bun 作为包管理器
- 已配置 Vitest + Testing Library + jsdom，日常验证默认先跑 `bun run test`
- 运行测试请使用 `bun run test`，不要用 Bun 内置的 `bun test` 代替
- 完成任务后必须确保测试通过才能交付；涉及前端或 TypeScript 改动时，继续按风险补充 `bun run build`、lint 和局部回归

Supabase 数据库命令补充：

- `bun run db:push`: 默认走远程 linked 项目，执行 migration
- `bun run db:push:dry-run`: 预演待执行 migration
- `bun run db:query -- --file <sql-file>`: 执行单个 SQL 文件，适合数据修复或只读核对
- `bun run db:doctor`: 检查 CLI、登录、query 链路、push 链路分别是否正常

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
2. 复杂任务必须先用 thinking 拆解问题、假设、风险和执行顺序
3. 建立上下文时必须优先使用 Serena 做符号级检索和引用分析
4. Serena 不可用时立即退回常规搜索，不在工具层卡住
5. 仅在信息不足时提出最少必要澄清问题
6. 实施前给出简短计划
7. 保持改动最小化，优先修复根因
8. 改动后做必要验证，完成任务后必须确保 `bun run test` 通过才能交付
9. 最终按固定结构汇报结果

补充基础规则：所有任务开始前，必须先调用 Sequential Thinking MCP 和 Serena MCP。即使任务很小，也不能跳过；如果 Serena 不可用或返回 `No active project`，需要明确说明已降级后再退回常规搜索。

默认规则定义在 [.github/copilot-instructions.md](.github/copilot-instructions.md)。

## Spec Workflow Integration

仓库已安装 `spec-workflow-mcp`，并在根目录提供 [.mcp.json](.mcp.json) 配置。

`.mcp.json` 同时接入了 Sequential Thinking MCP：使用 `npx -y @modelcontextprotocol/server-sequential-thinking` 启动，用于任务拆解、假设校验、风险分析和方案排序。

Codex Desktop 当前会话如果没有自动加载项目级 [.mcp.json](.mcp.json)，需要在本机 `~/.codex/config.toml` 同步注册：

```toml
[mcp_servers."sequential-thinking"]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-sequential-thinking"]
```

`.mcp.json` 同时接入了 Supabase MCP：使用 `npx -y @supabase/mcp-server-supabase --project-ref mlcptrkvkseyqxxlfcme` 启动，运行前需要在本机环境变量中配置 `SUPABASE_ACCESS_TOKEN`，不要把访问 token 写入仓库。

当前约定：对会修改应用代码、脚本、SQL、配置或指令文件的任务，默认按 Spec Workflow 顺序推进。

阶段状态、active change、apply readiness、archive readiness 的单一事实来源是 repo-local CLI wrapper：

- `bun run spec:list`
- `bun run spec -- status --change <name> --json`
- `bun run spec -- instructions apply --change <name> --json`

`spec-workflow-mcp` 只负责 VS Code MCP 接入与可视化，不作为独立状态来源；如果 MCP 展示与 CLI wrapper 输出不一致，一律以 CLI wrapper 为准。

执行顺序固定为：

1. `explore`：需求不清、范围未定、仍在讨论时先探索，不直接实现
2. `propose`：准备写代码前先建立 change 与 artifacts
3. `apply`：按 tasks 顺序实现，不跳过 proposal / tasks 直接编码
4. `archive`：实现完成且 change 收尾后归档

补充约定：

- 很小且低风险的任务（如单文件小改、文案/说明调整、小范围配置变更）可以跳过完整 Spec Workflow，但需要明确说明原因
- 如果用户已经显式使用 `/opsx:explore`、`/opsx:propose`、`/opsx:apply` 或 `/opsx:archive`，则对应 opsx prompt 视为当前权威流程，不再重复做同一轮阶段判断
- `/opsx:archive` 在只有一个 active change 时可自动选中，只有存在多个候选时才要求用户手动选择

最小验证命令：

```bash
bun run spec:list
bunx spec-workflow-mcp --help
npx -y @modelcontextprotocol/server-sequential-thinking --help
```

其中：

- thinking 用于复杂任务拆解、假设校验、风险分析和方案排序
- Serena 用于符号概览、定义查找、引用分析和精确定位
- 如果 Serena 当前环境不可用，Copilot 会退回常规文件搜索与文本搜索继续推进

## Skill 使用约定

除了 thinking 与 Serena，这个仓库现在还约定在对应场景主动使用 skill，而不是只靠自然语言临时发挥。

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

推荐理解为一条固定顺序：

1. 先用 thinking 拆解问题
2. 再用 Serena 建立上下文
3. 然后根据任务类型加载对应 skill
4. 最后再实施、验证和汇报

## 在 VS Code 里怎么用 Thinking 和 Serena

这套流程不要求你每次手动点某个按钮。正常情况下，你直接在 VS Code Copilot Chat 里使用项目级 prompt，Copilot 会按仓库规则自行决定先走 thinking，再优先尝试 Serena。

推荐用法：

```text
/task-exec 给生产工单列表增加按车间筛选
/bugfix 修复订单详情页切换分页后数据错乱
/review 检查最近对员工权限模块的改动风险
/db-change 为员工手机端相关表补充 RLS 策略
/feature-impl 新增员工手机端工单详情页
```

实际执行顺序应当是：

1. 先做 thinking，拆清楚问题、风险和顺序
2. 再优先尝试 Serena 做符号级定位和引用分析
3. Serena 不可用时，再退回普通搜索
4. 建立足够上下文后，再开始实施或评审

你可以通过 Copilot 的中间进度信息判断它是否按规则执行。正常表现通常包括：

- 先说明会先拆解问题或先收集上下文
- 明确提到要先检查相关符号、调用链、引用关系或模块
- Serena 不可用时，会说明退回常规搜索，而不是停住

如果你发现 Copilot 直接跳过分析开始改代码，通常有三种处理方式：

1. 直接改用对应的项目级 prompt，而不是只发自然语言
2. 在任务里补一句“按仓库固定流程执行，先 thinking，再 Serena”
3. 如果仍未遵守，再把任务描述得更明确一些，例如补上范围、目标文件或预期结果

如果你发现 Copilot 已经进入对应领域，但没有主动利用 skill，可以直接在任务里点明：

```text
按仓库固定流程执行，先 thinking，再 Serena；如果涉及缓存与 Mutation，使用 tanstack-query skill。
```

或者：

```text
按仓库固定流程执行，先 thinking，再 Serena；这是 RLS 与员工隔离场景，使用 supabase-rls-patterns skill。
```

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
