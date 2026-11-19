# JJG Admin React 开发规则

本文件是仓库通用开发规则。项目是基于 React 19、TypeScript 6、Vite 8、Ant Design 6、Tailwind CSS 4、TanStack Query 5、Zustand 5、React Router 7 和 Supabase 的企业管理后台。业务域代码位于 `src/features/`，数据访问位于 `src/services/`，共享组件位于 `src/ui/`。

## 任务执行

1. 简述目标、范围和交付物。改动前检查 `git status --short` 和相关 diff，先理解用户已有的改动，保留本次任务范围之外的工作。
2. 查找相关规则和 skill。用 `rg`、语言服务或可用的 Graphify 索引定位代码，阅读现有实现、调用链、类型和测试。核实业务字段、权限、组件 API 和依赖版本。工具不可用时使用能取得等价证据的本地工具。
3. 业务口径、权限、真实数据写入或关键交互存在实质取舍时，先用交互式选择题给出可行选项和推荐项。范围明确的低风险小改动可按已说明的假设直接推进。中高风险改动先说明切入点、受影响入口和验证方案。
4. 保持改动聚焦。先定位缺陷根因，复用仓库现有入口和约定，保持存量数据、调用方与错误路径的兼容性。影响字段、缓存、路由或业务计量时检查完整链路。
5. 检查最终 diff，完成对应验证和日志后再交付。最终说明关键改动、两份日志的处理、实际验证结果和验证缺口。只有通过的检查可记为通过。
6. 评审任务保持只读，先按严重程度列出有证据的问题、受影响场景和文件位置，再给结论及未验证的范围。

## 验证与更新日志

- 使用 Bun。运行完整测试用 `bun run test`，它包含 Node 脚本测试和 Vitest。单独调试 Vitest 测试可用 `bunx vitest run <path>`。
- 对 ESLint 管理的改动文件先执行 `bunx eslint --fix <files>`，再运行 `bun run lint` 并确认 0 error。项目用 `@antfu/eslint-config` 格式化代码。禁止引入 Prettier、为通过检查关闭规则或扩大格式化范围。
- 前端或 TypeScript 的应用代码改动跑 `bun run test` 和 `bun run typecheck`。涉及页面流程、路由、权限、构建配置或依赖时加跑 `bun run build`。脚本与配置、数据库及纯文档任务按[任务矩阵](.github/ai-task-matrix.md)验证。
- 用户操作流程优先用 GPT in Chrome 复用可用登录态。连接恢复失败后，依次尝试 Chrome DevTools MCP 和隔离的 Playwright。报告实际工具、操作结果及账号或环境的覆盖范围。用获准的测试环境和数据验证写入操作。
- 每次实际改动在根目录 `CHANGELOG.MD` 的首条历史记录之前追加一条记录，填写日期、类别、范围、摘要和实际验证结果。历史记录保留原文。仅补根日志时可直接修订。CI 检查完整的新条目，本地可运行 `bun run changelog:check --base <ref> --head <ref>` 核对已提交的范围。
- 当业务用户能看到或感受到变化时，在同一批改动中更新 `src/pages/dashboardChangelog.ts`。用普通中文说明功能、界面、权限、业务行为或明显的性能变化。同一天追加到该日期，新日期置顶。内部规则、文档、测试和 CI 等日常维护记入根日志。

## 数据库与权限

- Supabase 任务使用仓库 CLI。DDL、RLS、约束、索引、函数和触发器写成 migration，先运行 `bun run db:push:dry-run`，再在授权的目标执行 `bun run db:push`。一次性数据修复和只读校验使用 `bun run db:query -- --file <sql-file>`。连接失败先跑 `bun run db:doctor`。本地容器不可用时，可继续使用获准的已链接 CLI 路径。
- 禁止绕过保护入口使用裸 `supabase db query/push/reset`、`psql` 或数据库 MCP 执行。危险 SQL 或动态执行必须由用户本人在交互终端针对当前目标与 SQL 指纹确认三次。非交互执行会被拦截。禁止助手代填、管道输入、跳过确认或复用旧确认。数据库重置没有自动执行入口。
- 执行 schema 变更后运行 `bun run db:types` 重新生成 `src/services/database.types.ts`，禁止手改生成文件。仅写方案或 migration 时明确区分静态验证、预演、实际执行及其环境。
- 权限检查覆盖页面、路由和实际服务端或 RLS，验证允许和拒绝路径。客户端只使用 publishable 或 anon key，服务端密钥和真实凭据禁止进入前端、示例、提交或验证日志。

## 代码与业务规范

- 服务层统一用 `handleApiError`。用户文案使用中文。用 `App.useApp()` 中的 `message` / `modal` 反馈，错误消息通过 `getUserErrorMessage`。新 mutation 使用 `useMutationWithInvalidation` 并由调用处通过 `feedbackText` 反馈一次。
- 使用项目的 `queryConfig` 和模块 Query Key 工厂。查询键包含决定请求结果的变量，验证 mutation 后受影响的列表、详情和汇总会刷新。需要取消请求时沿调用链传递 `AbortSignal`，全局 queryClient 负责处理 AbortError。
- 保持组件和 Hook 渲染纯净，渲染期间不执行副作用。可由现有 props 或 state 计算的值直接推导。用户操作引发的副作用放在事件处理函数中，Effect 用于同步外部系统。
- TypeScript 使用严格类型和明确的服务接口，运行时输入在边界校验。组件和 Props 使用 PascalCase，Hook 用 `use` 前缀，常量用大写下划线。导入使用仓库已有别名，按 ESLint 排序。
- 新业务模块参考 `src/features/jintan/` 与 `src/features/youmai/` 的容器、表格、表单、搜索、hooks 和 Query Key 组织。改西尼存量模块时，以实际调用方和业务行为为依据。
- 改页面前读[前端页面风格规范与设计指南](docs/前端页面风格规范与设计指南.md)、[前端交互与反馈规范](docs/前端交互与反馈规范.md)和[项目功能域地图](.github/instructions/project-feature-map.instructions.md)。字段改动检查服务层、类型、查询、搜索、表格、表单、详情和导出。路由与权限改动检查 router、routeLabels、MainMenu、AppHeader、access 和权限注册。业务计算或状态流转改动检查写入、展示和汇总。
- 暗色模式同步 Ant Design theme 和 Tailwind `dark` class。导出含中文的 PDF 前 `await initializePDF()` 加载 Noto Sans SC 字体。

## 按任务查阅

- [任务矩阵](.github/ai-task-matrix.md)列出技能触发条件、最低验证和工具选择。优先使用平台原生的 skill 加载方式，必要时直接读取仓库对应的 `SKILL.md`。维护项目 skill 后运行 `bun run skills:sync`，同步 `.agents/skills` 到 `.claude/skills`。
- [数据库脚本执行说明](docs/Supabase数据库脚本执行说明.md)记录连接方式、保护入口、确认过程和验证要求。
- 外部设计稿用官方 Figma MCP 获取上下文和资源。MCP 不可用时，按用户提供的截图或描述推进可确认的部分，并说明验证范围。
- 工具状态有疑问时运行 `bun run ai:doctor`。Graphify 索引供代码导航，必要时用 `bun run graphify:build` 或 `bun run graphify:update` 刷新。
