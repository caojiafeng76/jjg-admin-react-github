# 更新日志

本文件记录项目的所有重要修改。每次修改完成后，必须在本文件顶部追加一条记录，最新记录置顶；仅修改本文件以补充日志时无需重复记录。

## 记录格式

```markdown
## YYYY-MM-DD

- **类别**：新建 / 变更 / 修复 / 重构 / 性能 / 文档
- **范围**：受影响的模块或文件
- **摘要**：本次修改的内容与目的
- **验证**：执行过的检查、测试或构建命令；未执行时说明原因
```

## 2026-08-04

- **类别**：变更
- **范围**：`coverage/`、`graphify-out/`
- **摘要**：删除两个可再生的构建产物目录：`coverage/`（Vitest 测试覆盖率 HTML 报告，约 16.7MB，`bun run test:coverage` 生成）、`graphify-out/`（graphify 代码索引 `graph.json`，约 5.2MB，`bun run graphify:build` 生成）。两者均在 `.gitignore` 中、未被 git 跟踪，删除后可按需重新生成。
- **验证**：删除后确认目录不存在；未运行测试/索引构建（无必要）。

## 2026-08-04

- **类别**：修复
- **范围**：`src/features/syney/ReportDetail/DetailTable.tsx`、`src/features/syney/PoDetail/DetailTable.tsx`、`src/features/precision-cutting-transfer/MaterialTransferTable.tsx`
- **摘要**：修复表格汇总行（`Table.Summary`）与列错位问题。根因：三张表均启用 `rowSelection`，antd 实际渲染列数 = 数据列 + 复选框列，而汇总行单元格的 `index` 是按含复选框列的 flattenColumns 计算的，原汇总行单元格数不足（各缺 1~4 格），导致金额/数量合计显示在左侧相邻列下方、末列无汇总格。现补齐单元格：入库单明细汇总金额归位"小计"列（`index 9`）、采购单明细数量合计归位"数量"列（`index 9`）、切割转序"转移数量"合计归位"转移数量"列（`index 12`），金额单元格补 `align="right"` 与列对齐一致。
- **验证**：`bun run typecheck`、`bun run lint` 通过；浏览器打开 `/syney-store-report-list/K202608030011` 截图核对汇总行对齐。


## 2026-08-04

- **类别**：重构
- **范围**：`server/`（新目录）、`api/syney-store-report.ts`、`api/youmai-purchase-order.ts`、`vite.config.ts`、`tsconfig.node.json`、`src/services/viteProxySecurity.vitest.ts`、`src/services/proxyHandlers.vitest.ts`
- **摘要**：将根目录 4 个外部系统对接/开发代理文件移入新建 `server/` 目录（`syneyStoreReportServer.ts`、`youmaiPurchaseOrderServer.ts`、`viteSyneyStoreReportProxy.ts`、`viteYoumaiPurchaseOrderProxy.ts`），保持根目录整洁。同步更新 `vite.config.ts`、`api/` 两个 Vercel handler、`tsconfig.node.json`（include 改为 `server/**/*.ts`）及两个 vitest 测试文件的引用路径。
- **验证**：`bun run typecheck`、`bun run lint` 通过；`bun run test` 通过（105 文件/461 用例）。

## 2026-08-04

- **类别**：重构
- **范围**：`.omo/`、`.codegraph/`、`.serena/cache/`
- **摘要**：清理根目录点文件夹中的无用缓存与 AI 会话痕迹。删除 `.omo/`（oh-my-opencode 会话证据/便签/运行延续，13 个被追踪文件，无代码引用）；删除 `.codegraph/`（graphify 代码索引缓存约 30MB，未追踪，可 `bun run graphify:build` 重建）；删除 `.serena/cache/`（Serena TS 语言服务缓存约 42MB，未追踪，下次启动自动重建）。保留 `.git`、`.github`、`.agents`、`.claude`、`.opencode`（配置）、`.serena`（memories/project.yml）、`.spec-workflow`、`.vscode`、`.codex`、`.cursor`。
- **验证**：`bun run typecheck`、`bun run lint` 通过；删除前后 `git status` 仅显示 `.omo` 13 个删除项（另两项未追踪不可见）。

## 2026-08-04

- **类别**：重构
- **范围**：`src/test/testing-library.smoke.vitest.tsx`、`src/test/setup.vitest.ts`、`scripts/generate-round7-final-import.mjs`、`scripts/generate-tooling-data-import-20260504.mjs`、`scripts/generate-villa-lift-import.mjs`、`scripts/import-round3-missing-process-orders.mjs`、`scripts/import-safe-production-orders.mjs`、`scripts/diff-villa-lift-2026.mjs`、`scripts/compare-villa-lift-2026.mjs`、`temp_check.rcutil.ps1`、`excel_import_analysis.json`、`tmp-rc-util-10101/`
- **摘要**：清理无效残留文件。删除 2 个环境冒烟测试（`testing-library.smoke.vitest.tsx`、`setup.vitest.ts`，仅验证测试环境本身、不覆盖业务代码）、7 个一次性数据导入/对比脚本（generate-*/import-*/diff-*/compare-*，无任何代码/文档引用）、1 个临时诊断脚本（`temp_check.rcutil.ps1`）、1 个一次性 Excel 导入分析产物（`excel_import_analysis.json`，业务数据已有 `docs/imports/` 存档）及未追踪的临时 node_modules 目录（`tmp-rc-util-10101/`，35MB）。保留全部真实业务测试（105 个文件）及 `src/test/setup.ts`、`src/test/vitest.d.ts` 等测试基础设施。
- **验证**：`bun run typecheck`、`bun run lint` 通过；`bun run test` 通过（105 文件/461 用例，较删除前减少 2 个冒烟测试用例）。

## 2026-08-04

- **类别**：变更
- **范围**：`package.json`、`bun.lock`、`scripts/fix-typescript6-alias.mjs`
- **摘要**：全量升级 33 个依赖至最新版。生产依赖：antd 6.3.7→6.5.3、react/react-dom 19.2.7→19.2.8、@ant-design/icons→6.3.2、@supabase/supabase-js→2.112.0、supabase→2.111.0、@tanstack/react-query→5.101.4、react-router-dom→7.18.2、react-qr-code→2.2.0、immer→11.1.15、react-icons→5.7.0、pinyin-pro→3.28.2 等；开发依赖：typescript 6.0.3→7.0.2（Go 原生版，通过 npm alias 双编译器方案：`typescript` 指向 `@typescript/typescript6@6.0.2` 保留 TS6 API 供 typescript-eslint 与 AST 测试使用，新增 `@typescript/native`（TS7）提供 `tsc` 二进制）、jsdom 29→30、@testing-library/jest-dom 6→7、@types/node 25→26、vite 8.0.16→8.2.0、eslint 10.4→10.8、vitest 4.1.8→4.1.10、prettier 3.8→3.9、tailwindcss 4.3.0→4.3.3、typescript-eslint 8.61→8.66 等。新增 `postinstall` 脚本 `fix-typescript6-alias.mjs` 修复 bun 1.3.14 将 `@typescript/typescript6` 的内部依赖 `@typescript/old` 误解析为自身 shim 的问题（导致 TS7 无法解析 TS6 声明文件）。
- **验证**：`bun run typecheck`、`bun run lint`、`bun run test`（107 文件/463 用例全部通过）、`bun run build` 全部通过；`bun run check:bundle` 失败为既有问题（升级前后行为一致，根因：`ExcelUpload.tsx` 有意静态引入 excelUtils 以规避上传时 chunk 拉取失败，与预算检查脚本规则冲突，与本次升级无关）。

## 2026-08-04

- **类别**：变更
- **范围**：`AGENTS.md`、`.github/copilot-instructions.md`、`.github/ai-task-matrix.md`、`.github/prompts/task-exec.prompt.md`、`.github/prompts/feature-impl.prompt.md`、`.github/prompts/bugfix.prompt.md`、`.github/prompts/db-change.prompt.md`
- **摘要**：修复 AI 助手反复遗漏 `CHANGELOG.MD` 更新的问题。根因：日志规则只存在于 `copilot-instructions.md` 末尾独立小节，未纳入编号执行流程、Fast lane 清单、任务矩阵与各类 prompt。现改为多层强制：默认执行流程新增第 8 步（改动后必须更新 CHANGELOG）；最终汇报模板新增「是否已更新 CHANGELOG.MD」检查项；Fast lane 强制清单、任务矩阵 Fast Lane 段、4 个任务 prompt（task-exec / feature-impl / bugfix / db-change）同步补充；`AGENTS.md` 增加显式加粗强制项。
- **验证**：文档类改动，无代码验证；已人工核对全部改动点与权威规则一致。

## 2026-08-04

- **类别**：变更
- **范围**：`src/features/tooling-fixture/FixtureRecordsPage.tsx`
- **摘要**：工装出入记录页分页新增每页条数选择器（10/20/50/100 条/页），切换页面大小后自动回到第 1 页。
- **验证**：`bun run typecheck` 通过。

## 2026-08-04

- **类别**：变更
- **范围**：`src/features/tooling-fixture/FixtureDataPage.tsx`
- **摘要**：工装资料页分页优化：支持动态页面大小（10/20/50，切换后回到第 1 页），表格改为自适应高度布局（复用 `useTableHeight` 计算滚动区域高度），内容超高时表格内部滚动、分页器固定在底部。
- **验证**：本条目仅补录日志，无代码变更（对应功能改动已于提交 `c2a9ad9` 完成）。

## 2026-08-03

- **类别**：新增
- **范围**：`src/features/tooling-fixture/FixtureRecordsPage.tsx`、`src/features/tooling-fixture/useToolingFixtures.ts`、`src/services/apiToolingFixturePublic.ts`
- **摘要**：工装模具记录页新增删除功能。支持单行删除（行内「删除」按钮）与批量删除（勾选 + 「删除选中」按钮），删除前弹出确认框；删除仅影响工装出入记录，不影响工装当前状态。新增 API `deleteToolingFixtureUsageRecords` 与 hook `useDeleteToolingFixtureUsageRecords`，删除成功后自动刷新工装记录列表与工装资料列表。
- **验证**：`bun run typecheck`、`bun lint` 通过，相关 Vitest 用例通过。

## 2026-08-03

- **类别**：新增
- **范围**：`src/features/tooling-fixture/`（工装资料页）、`src/services/apiToolingFixture.ts`、`src/utils/toolingFixtureExcel.ts`（新增）、`src/features/tooling-fixture/ToolingFixtureExcelImport.tsx`（新增）
- **摘要**：工装资料页新增批量导入功能。支持上传 Excel 文件（兼容「工装模具总台账」带说明行与重复表头的格式，按表头名称定位并忽略序号/数量/状态列），懒加载解析并在弹窗中预览、错误提示后确认导入；提供单行表头下载模板。解析规则：编号必填且文件内去重，年月类日期（如 2024.10→2026.07）归一化为当月 1 号，无效日期/保养周期置空并警告，寿命默认「正常」；`createToolingFixturesBatch` 校验批内重复与库中已存在编号后批量插入。
- **验证**：`bun run typecheck`、`bun lint` 通过；`toolingFixtureExcel.vitest.ts` 8 项、`apiToolingFixture.vitest.ts` 批量导入 4 项用例通过，全量 `bun run test` 463 项通过；用 `docs/工装模具总台账.xlsx` 实测解析 17 行全部成功。

## 2026-08-03

- **类别**：新增
- **范围**：`src/features/precision-cutting-transfer/`（精切转移单）、`src/services/apiPrecisionCuttingTransfers.ts`、`src/utils/precisionCuttingTransferExcel.ts`、Supabase migration
- **摘要**：精切转移单新增「数据错误责任人」字段（`data_error_responsible`），通过 MCP 执行迁移并重新生成 `database.types.ts`，表单可编辑，表格/详情/导出同步展示；新增编辑表单中「与流程卡长料数量差异」「与ERP长料数量差异」自动计算（实际长料数量 减去 参考数量，参考为空时显示 `-`），只读不可编辑；导出报表新增「数据错误责任人」列。
- **验证**：MCP 迁移应用成功；`bun run typecheck`、`bun lint` 通过；`precisionCuttingTransferExcel.vitest.ts` 2/2 通过（含新列断言）。

## 2026-08-03

- **类别**：变更
- **范围**：`src/features/tooling-fixture/`（工装资料页）、`src/services/apiToolingFixture.ts`
- **摘要**：工装资料二维码打印改为「直接打印当前筛选结果」：工具栏「打印二维码」按钮常驻，不再依赖勾选行，点击后按当前关键字/状态筛选条件全量查询（上限 1000 条，超限提示缩小范围）并打印；保留表格单行「打印」按钮与「删除选中」按钮。
- **验证**：新增 `getAllToolingFixtures` 4 项 Vitest 用例（无筛选全量、关键字/状态过滤与中止信号、超限拒绝、非法状态拒绝）全部通过；`bun run typecheck`、`bun lint` 通过。

## 2026-08-03

- **类别**：新增
- **范围**：`src/features/tooling-fixture/`（工装资料页）
- **摘要**：工装资料页新增二维码标签打印功能。每个标签三行（二维码、工装模具编号、产品名称），A4 一页打印 10 个（2 列 × 5 行），超出自动分页；支持表格选中批量打印与单行打印，二维码链接生成逻辑统一收敛到 `fixtureDomain.ts` 复用。
- **验证**：新增 6 项 Vitest 用例（fixtureDomain 2 个、标签 HTML 构建 4 个）全部通过；`bun run typecheck` 与 `bun lint` 通过；打印窗口流程沿用既有海报打印模式，未做浏览器端人工验证。

## 2026-08-03

- **类别**：变更
- **范围**：精切转移单、精切转移单导出、Supabase migration
- **摘要**：将“长料数量”明确为“实际长料数量”，新增流程卡及 ERP 长料数量的录入/展示字段；导出表新增两项数量与按“实际/对照”自动计算的差异公式。
- **验证**：新增导出回归测试并完成 RED→GREEN 用例；远端 migration 已应用并核验三个字段的类型、可空性与中文注释，`database.types.ts` 已通过 Supabase 生成器刷新；`bun run typecheck`、`bun lint`、`bun run build` 和 Ant Design lint 均通过。完整 Vitest 套件 434/439 个断言通过后遭遇无归属 worker 退出。

## 2026-08-02

- **类别**：修复
- **范围**：`src/features/tooling-fixture/ToolingFixturePublicPage.tsx`
- **摘要**：为公开工装扫码 H5 页面建立独立的视口滚动容器，避免全局 `body` 禁止滚动时长内容被裁切。
- **验证**：新增 H5 滚动布局回归测试，并完成目标测试、类型检查、lint、构建和移动端浏览器验证。

## 2026-08-02

- **类别**：新增
- **范围**：工装管理模块、Supabase 工装资料与出入记录迁移、路由菜单与权限
- **摘要**：新增工装资料 CRUD、唯一二维码、公开扫码使用/归还页面、原子状态流转与出入记录查询；保留现有刀具模块不变。
- **验证**：目标测试 5 个文件的测试通过；`bun run typecheck`、`bun lint`、`bun run build`、Ant Design lint 均通过；远端迁移已应用并以事务回滚方式验证匿名 RPC 的使用、重复使用拒绝、归还和状态一致性。最终 `bun run test` 102/103 个文件、431/436 个测试通过，剩余 1 个既有 `apiWorkshopOrderOptions` Vitest worker 异常，与本次改动无关。

## 2026-07-25

- **类别**：修复
- **范围**：`src/features/syney/SpecList/`
- **摘要**：修复规格创建 Modal 首次打开后“确定”偶发不触发表单提交的问题；改为在操作发生时读取最新 Form ref，并恢复创建成功/失败消息容器，避免后端拒绝时无可见反馈；新增首次提交与失败提示回归测试。
- **验证**：`bun run test`（8 个文件、29 个测试）、`bun run typecheck`、`bun lint`、`bun run build` 均通过；真实浏览器成功路径首次点击仅发送 1 次请求并关闭 Modal，失败路径显示“创建规格失败”；Graphify 增量更新、Ant Design lint、TypeScript no-excuse 检查通过；独立 Visual QA 双审查均为 PASS/HIGH。

## 2026-07-24

- **类别**：重构
- **范围**：`src/routes/AppRoutes.tsx`、`src/ui/PageLoading.tsx`、`src/utils/format.ts`、`src/utils/googleFontLoader.ts`、`src/utils/pdfUtils.ts`
- **摘要**：移除已确认无仓库消费者的旧路由占位文件、未使用加载组件及三个未使用导出，保留可能被外部调用或仅由文档引用的候选项。
- **验证**：删除前的 `bun run typecheck`、`bun run test`、`bun lint`、`bun run build` 均通过；删除批次逐项完成零引用扫描与类型检查；`git diff --check` 通过。

## 2026-07-24

- **类别**：变更
- **范围**：`src/features/workshop/StandardTimeList/StandardTimeTable.tsx`
- **摘要**：调整标准工时列表列顺序，将标准工时、日标准产能、理论工时紧跟在料号列之后。
- **验证**：目标表格测试通过；`bun run typecheck`、`bun run build`、`bun lint`、`bunx antd lint src/features/workshop/StandardTimeList/StandardTimeTable.tsx --format json` 通过。完整 `bun run test` 仅有既存的 `src/features/packaging-process/WorkOrderList/remoteEmployeeSelect.vitest.tsx` 失败，与本次改动无关。

## 2026-07-23

- **类别**：文档
- **范围**：`AGENTS.md`
- **摘要**：补充 Graphify、Spec Workflow 和数据库 CLI 命令，确保项目指令清单与 `package.json` 脚本保持一致。
- **验证**：执行命令脚本一致性检查和 `git diff --check`。

## 2026-07-22

- **类别**：文档
- **范围**：项目更新日志文件名及相关指令引用
- **摘要**：将根目录更新日志文件名统一为全大写扩展名，并同步更新仓库内相关引用。
- **验证**：已完成旧文件名残留扫描、目标文件存在性检查及 `git diff --check`。

## 2026-07-22

- **类别**：修复
- **范围**：Serena MCP 配置、Codex / VS Code 用户级 MCP 配置、启动脚本
- **摘要**：将 Serena 从每个任务独立启动的 stdio 模式统一切换为固定 Streamable HTTP 单例；关闭自动打开的原版 Dashboard，改为仅在需要时手动通过浏览器访问。
- **验证**：已验证单例启动脚本可启动 `http://127.0.0.1:9121/mcp`，重复执行不会创建第二个监听实例；MCP 端点可访问，并已核对 Codex 项目级配置不再包含 Serena stdio 启动命令。

## 2026-07-22

- **类别**：文档
- **范围**：项目更新日志规范与 AI 任务指令
- **摘要**：新增根目录 `CHANGELOG.MD`，并在 `AGENTS.md` 与 `.github/copilot-instructions.md` 中建立每次修改完成后记录更新日志的统一规则。
- **验证**：已检查项目指令文档、工作区状态及本文件格式。
