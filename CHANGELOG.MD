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

## 2026-08-17

- **类别**：修复
- **范围**：`src/features/workshop/ProductionScheduling/index.tsx`（仅注释）
- **摘要**：修复 `bun run test` 唯一失败项 —— `src/ui/antdSemanticStyles.vitest.ts` 的整文件正则 `not.toMatch(/\.ant-/)` 误匹配到 E3 注释中的 `.ant-` 文字（该注释只是解释为何不覆盖 antd 私有 DOM 类，并非实际使用）；将注释措辞由 `.ant-` 改为「antd 私有 DOM 类」，测试守卫逻辑与覆盖面不变。
- **验证**：`bun run test` 全量 492/492 通过（110 文件，此前唯一失败项消除）；`bun run test src/ui/antdSemanticStyles.vitest.ts` 7/7 通过；`bun run typecheck` 通过。

- **类别**：修复
- **范围**：`src/services/apiSyneySpecs.ts`
- **摘要**：修复 `bun lint` 失败 —— `getSyneySpecs` 全量分页循环中 `let totalCount = 0` 的初始值从未被读取（`while (true)` 每轮都先执行 `totalCount = count ?? 0` 再可能 `break`），触发 `no-useless-assignment`；改为纯声明 `let totalCount: number`（TS 确定性赋值分析可证明 return 处必已赋值），运行时行为不变。
- **验证**：`bun lint` 0 errors（仅剩 `dashboardRenderUtils.tsx` 13 个既有 react-refresh warnings，不阻断）；`bun run typecheck` 通过；`bun run test` 全量 491/492，唯一失败仍为既有 `antdSemanticStyles.vitest.ts` 的 `.ant-` 断言（与本次无关）。

- **类别**：变更
- **范围**：`src/features/workshop/StandardTimeList/`（`StandardTimeTable.tsx`、`StandardTimeCostDetail.tsx`）
- **摘要**：UI 改版 E5 —— 成本核算 StandardTimeList 成本/金额列右对齐：① 表格 8 个数字列补 `align: 'right'`（`#` 序号、长度、标准工时（秒）、日标准产能、理论工时（秒）、装夹次数、装夹数量（支）、人数），等宽数字 tabular-nums 由 A3 全局 `index.css` 表格样式覆盖；② 标准工时相关 3 列从条件展开 `...(hideStandardSeconds ? [] : [...])` 中提取为带 `TableColumnsType<StandardTime>` 类型注解的局部变量 `standardTimeColumns`（条件展开让数组字面量失去上下文类型，`align: 'right'` 会被推断为 string 触发 TS2322，提取后保证字面量类型正确）；③ 成本详情面板 `StandardTimeCostDetail` 的金额数字（人工/设备/刀具辅料/检验成本、单品分摊额、合计成本、日管理总费用、日总工时）补 `tabular-nums`（这些金额在卡片而非 `<table>` 内，A3 的 `table >` 选择器不覆盖）。
- **验证**：`bun run typecheck` 通过（0 错误）；`bun run test` 全量 491/492 通过，唯一失败为既有 `src/ui/antdSemanticStyles.vitest.ts` 对 `ProductionScheduling/index.tsx` 的 `.ant-` 断言（匹配到该文件内注释文字，与本次改动无关），`StandardTimeList` 模块用例 5/5 通过；`bun run build` 通过（exit 0）；`bun lint` 改动文件 0 问题（全量 lint 仍有既有 `apiSyneySpecs.ts` `no-useless-assignment` 1 error 与 `dashboardRenderUtils.tsx` 13 react-refresh warnings，均非本次改动文件）。

- **类别**：变更
- **范围**：`src/features/tooling-fixture/FixtureDataPage.tsx`、`ToolingFixtureTable.tsx`、`useToolingFixtures.ts`、`queryKeys.ts`、`src/services/apiToolingFixture.ts`（+`apiToolingFixture.vitest.ts`）
- **摘要**：工装资料列表新增首列“更新日期”，并在搜索条件中新增“更新日期”范围筛选；筛选参数同步接入 TanStack Query key、分页列表查询和“打印二维码”的当前筛选全量查询。`updated_at` 为时间戳字段，结束日期按 `< 次日` 处理，保证用户选择的结束日期整天都被包含。
- **验证**：`bun run test src/services/apiToolingFixture.vitest.ts` 通过（13/13，新增 updated_at 范围 red-green 用例）；`bun run typecheck` 通过；`bun run build` 通过；`bunx antd lint src/features/tooling-fixture/FixtureDataPage.tsx --format json` 与 `bunx antd lint src/features/tooling-fixture/ToolingFixtureTable.tsx --format json` 均 0 issues；`bun run test` 全量仍失败于既有 `src/ui/antdSemanticStyles.vitest.ts` 对 `src/features/workshop/ProductionScheduling/index.tsx` 的 `.ant-*` 断言，`bun lint` 仍失败于既有 `src/services/apiSyneySpecs.ts` 的 `no-useless-assignment`（另有 13 个既有 react-refresh warnings），均非本次改动文件；浏览器访问 `/fixture-data` 因无认证会话重定向到 `/login?redirect=%2Ffixture-data`，未能直接目测受保护表格。

## 2026-08-14

- **类别**：修复
- **范围**：`src/services/apiPrecisionCuttingTransfers.ts`、`apiMaterialTransfers.ts`、`apiPrecisionFinishingCuttings.ts`、`apiOrderStatusDashboard.ts`、`apiLaborProtectionRequisitions.ts`、`apiStandardTimes.ts`、`apiYoumaiRawMaterialInventory.ts`、`apiEmployees.ts`、`apiAttendanceDetails.ts`、`apiSyneySpecs.ts`、`apiToolingFixture.ts`（+`apiToolingFixture.vitest.ts`）、`apiProductionOrders.ts`、`apiWorkshopOrders.ts`、`apiDashboard.ts`
- **摘要**：修复"订单数据超过 1000 条无法获取"问题（PostgREST `db-max-rows=1000`，显式 limit 也无法突破）：① 用户点名两处 —— 精切转移单导出（`getPrecisionCuttingTransfersForExport` filters 分支）与数量统计（`getPrecisionCuttingTransferQuantityStats`）改为 while+range 1000/页循环拉取；订单现状导出（`getOrderStatusDashboardForExport`）原传 `pageSize: total` 但 RPC 内部 `least(...,200)` 截断，改为按 200/页循环调用 RPC 直至 total。② 全库排查同类问题并修复 13 个文件 16 处：物料转移单/精加工切割单的导出与统计 filters 分支（同构双分支仅补 filters 分支、ids 分支保持不动）、劳保领料单导出、成本核算导出、优迈原料库存导出、`getAllEmployees` 全表下拉、考勤月度导出（两分支合并为分页循环）、西尼规格 `isAll` 分支 `limit(1000)` 改循环、工装 `getAllToolingFixtures` 由"超 1000 直接抛错"改为分页拉全（同步更新 vitest：断言 `select('*')` 无 count、新增翻页终止断言）、`getProductionItemsByProjectNo`/`getPrecisionCuttingTransferItemsByProjectNo` 单项目明细循环、车间订单出库统计（`material_transfers` 多项目 in 聚合）循环、首页 KPI 近 14 天 created_at 扫描循环。全部复用项目既有 `while(true) + .range(from, to)` 模式（PAGE_SIZE=1000）
- **验证**：`bun run typecheck` 通过（0 错误）；`bun run test` 全量 489/490 通过（唯一失败为 pre-existing `antdSemanticStyles.vitest.ts`，stash 验证与本次改动无关；`apiToolingFixture.vitest.ts` 3 个旧断言已随行为变更更新并单独跑通 11/11）；未做浏览器端导出回归（需登录态与测试环境，缺口说明）


## 2026-08-14

- **类别**：变更
- **范围**：`src/features/workshop/ProductionScheduling/index.tsx`
- **摘要**：UI 改版 E3 布局改版 —— 订单排产 ProductionScheduling 一屏 10 行：① 布局压缩 —— 外层 `gap-3 p-3` → `gap-1.5 p-1`；标题卡去掉副标题 + `py-2`→`py-1` + 竖条缩小（仅留标题一行）；搜索区移除"筛选条件"标签行 + `p-2`→`p-1` + 全部控件 `size="small"` + label 缩短（订单状态→状态、当前进度→进度、计划开工→开工、订单日期→日期）收紧为 2 行；② 摘要卡（5 张 KPI 卡）合并进操作条 —— 删除 `SummaryCard` 组件，汇总统计（订单数/数量/进行中/已完工/延期）改为操作条左侧内联数字；③ 紧凑行高 —— `components.body.cell` 注入 `paddingTop/Bottom: 2px`（行高 35→31px；经 components 注入而非 index.css `.ant-` 全局覆盖，避免触发 `appShellConfig.vitest` 约定）；④ 客户名称、负责班组/人员列补 `ellipsis: true`（修复长文本在窄列换行成 2 行把整行撑高、导致首行 43px 异常）
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run test` 通过（490 用例中 489 通过，1 个 pre-existing 并发 flaky `remoteEmployeeSelect.vitest`——与本次改动零交集、单独运行通过）、浏览器实测 1366×768 一屏 10 行完整显示（scrollY 311、行高统一 31px、第 10 行 bottom 657 ≤ 表体 662、分页完整）

## 2026-08-14

- **类别**：修复
- **范围**：`src/hooks/useTableHeight.ts`、`src/features/workshop/EmployeeList/`（`index.tsx`、`EmployeeTable.tsx`、`EmployeeSearch.tsx`）
- **摘要**：UI 改版 E4 —— 员工管理 EmployeeList 布局改版 + 修复一屏 10 行截断：① **useTableHeight 根因修复** —— `scrollY` 与 `rowHeight` 由两个独立 state 改为合成单一对象 state 原子更新（原实现连续重算时可能交叉不同步，出现"行高 50px 而表体视口仅 435px"，10 行内容被截断末行；共享 hook，全页面受益）；② **绑定账号列单行化** —— `flex flex-col`（Tag+邮箱两行堆叠，内容高度 51px 把 43px 计算行高撑开）改为 `flex items-center` 单行（Tag + 截断邮箱），行高 43px 真正落地；③ 布局压缩 —— 外层 `grid-rows-[auto_auto_1fr] gap-4` → `[auto_1fr] gap-2`，工具栏与搜索栏合并为一行（`justify-between` + `flex-wrap`，宽屏单行、窄屏自动换行），表格容器内 `gap-4`→`gap-2`；④ 搜索控件 `size="small"` + 宽度收紧（Input 220→180、Select 140→120）；⑤ 通用清单核对 —— `#` 序号列、岗位时薪、系数列补 `align: 'right'`（tabular-nums 由 A3 全局覆盖），查询/搜索即时反馈 `loading` 由 `isLoading` 改 `isFetching`
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run test` 通过（110 文件 / 490 用例，含 useTableHeight 2 用例）、`bun run build` 通过（exit 0）、浏览器实测 1366×768（10 行完整可见、第 10 行 bottom 682 ≤ 表体 687、分页完整）与 1920×768（工具栏+搜索合并一行、10 行完整、无滚动溢出）

## 2026-08-14

- **类别**：变更
- **范围**：`src/features/workshop/ProductionScheduling/index.tsx`
- **摘要**：UI 改版 E3 —— 订单排产 ProductionScheduling：① 操作反馈 <300ms —— 表格 `loading` 由仅首屏（`isLoading && orders.length === 0`）改为任意请求中即遮罩（`isFetching`），查询/筛选切换/翻页/刷新时旧数据上立即出现加载反馈；移除不再使用的 `isLoading` 解构；② 修正 A1 遗留旧主色 —— 标题装饰条 `from-[#1677ff]`、快速筛选激活态 `!border-[#1677ff] !from-[#1677ff]` 改用 B1 桥接的 `-primary` 工具类（跟随 antd `colorPrimary` #2563eb，暗色自动切换）；③ 数字列 tabular-nums 由 A3 全局 `index.css` 表格等宽数字样式覆盖（本页订单数量/转移数量/转移进度列已右对齐），核对无需逐列处理；编辑保存已有 modal `confirmLoading` 即时反馈（核对确认）
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run test` 通过（110 文件 / 490 用例）、`bun lint` 本次改动文件 0 error、`bun run build` 通过（exit 0）

## 2026-08-14

- **类别**：修复
- **范围**：`src/hooks/useTableHeight.ts`（+`useTableHeight.vitest.tsx`）、`src/features/workshop/OrderStatusDashboard/index.tsx`
- **摘要**：修复表格最后一行被视口截成"半行"：① `useTableHeight` 行高计算由 `Math.round` 改为 `Math.floor`（保证 `rowHeight × targetRowCount ≤ 表体高度`，消除所有使用页面的半行风险；共享 hook，其他页面行高仅 0-1px 差异、语义更正确）；② 订单现状页 `minRowHeight` 30→24（表体 <300px 时允许更矮行高，保证 10 行完整）；③ 更新 `useTableHeight.vitest.tsx` 断言（33→32，并新增 `rowHeight × 10 ≤ scrollY` 不变量断言）
- **验证**：`bun run test` 通过（110 文件 / 490 用例）、`bun run typecheck` 通过（0 错误）、`bun lint` 改动文件 0 error、`bun run build` 通过（exit 0）

## 2026-08-14

- **类别**：变更
- **范围**：`src/features/workshop/OrderStatusDashboard/index.tsx`
- **摘要**：E2 布局调整 —— 表格一屏展示 10 条：① `useTableHeight` 目标行数 14 → 10（行高按 10 行撑满容器计算）；② 压缩全部固定区高度（外层 `gap-3 p-4`→`gap-2 p-3`、header 卡片 `py-4`→`py-2.5` + 图标 `size-12`→`size-9` + 标题 `text-xl`→`text-base`、搜索区移除"筛选条件"标签行 + 表单 `p-4`→`p-3`、Tabs 按钮 `py-2`→`py-1.5`、表格表头装饰行与分页 `py-2.5`/`py-3`→`py-2`），KPI 收起态下 1366×768 一屏可完整显示 10 行
- **验证**：`bun run typecheck` 通过（0 错误）、受影响用例 `bun run test` 20/20 通过、`bun lint` 改动文件 0 error、`bun run build` 通过（exit 0）

## 2026-08-14

- **类别**：修复
- **范围**：`src/features/workshop/OrderStatusDashboard/`（`OrderStatusKpiGrid.tsx`、`index.tsx`）
- **摘要**：E2 布局回归修复 —— 主表格被 KPI 看板挤压不可见：① KPI 区由 2 行大卡改为紧凑一行（5 数字卡 `grid-cols-10` + 生产状态分布通栏条），高度约 240px → 130px；② 页头新增"看板"开关按钮（`DocumentChartBarIcon`），默认按可视高度自适应（≥800px 展开、小屏收起保表格），收起时 KPI 区不渲染、表格获得全部空间，`useTableHeight` 的 ResizeObserver 自动重算表格高度
- **验证**：`bun run typecheck` 通过（0 错误）、受影响用例 `bun run test` 20/20 通过、`bun lint` 改动文件 0 error、`bun run build` 通过

## 2026-08-14

- **类别**：变更
- **范围**：`supabase/migrations/20260814120000_add_order_status_dashboard_kpis.sql`、`src/services/apiOrderStatusDashboard.ts`、`src/features/workshop/OrderStatusDashboard/`（`OrderStatusKpiGrid.tsx` 新增、`index.tsx`）
- **摘要**：UI 改版 E2 —— 订单现状 OrderStatusDashboard Bento Grid KPI 看板：① RPC `get_order_status_dashboard_v2` 新增 `kpis` 全局聚合输出（在完整筛选集上统计 正常/预警/延期 订单数、平均完工率、平均成品率、生产明细数、物料转移数，随筛选条件联动、非分页切片），直连 push 链路不可用按 db:doctor 建议改走 Supabase MCP 应用；② 服务层新增 `OrderStatusDashboardKpis` 类型 + `EMPTY_ORDER_STATUS_DASHBOARD_KPIS` 兜底 + kpis 映射；③ 页面新增 `OrderStatusKpiGrid` Bento Grid KPI 区（6 卡：订单总数 / 生产状态分布分段条 / 平均完工率 / 生产明细 / 平均成品率 / 物料转移，图表配色走 antd `theme.useToken()` 随主题切换，数字 tabular-nums，加载态骨架屏）；④ 移除头部 4 个冗余统计 pill，岗位数移至表格头部
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run test` 通过（110 文件 / 490 用例，+2 新增 kpis 映射用例）、`bun lint` 改动文件 0 error、`bun run build` 通过；RPC 远程执行验证 kpis 返回正常（totalOrderCount=4144 等）

## 2026-08-14

- **类别**：修复
- **范围**：`eslint.config.js`
- **摘要**：ESLint ignores 增加 `.opencode/ponytail` —— 该目录为 ponytail skill 的运行时钩子脚本（`catch (e) {}` 吞错误等有意写法），不属于应用代码；此前仅忽略 `dist`，导致 `bun lint` 报 25 个 pre-existing error。排除后 `bun lint` 0 errors
- **验证**：`bun lint` 通过（0 errors，13 warnings 均为 pre-existing 的 react-refresh 提示）

## 2026-08-14

- **类别**：变更
- **范围**：`src/features/workshop/OrderList/`（`orderStatus.ts`、`WorkshopOrderTable.tsx`、`WorkshopOrderProductionStats.tsx`）
- **摘要**：UI 改版 E1 —— 订单管理 OrderList 状态流转 pill 徽章：① `orderStatus.ts` 新增 `WORKSHOP_ORDER_STATUS_PILL` / `getWorkshopOrderStatusPill` 语义色映射（生产中=琥珀、已结案=绿，含 `bg/text/dot` 三组类名，S2 状态徽章体系落地）；② `WorkshopOrderTable.tsx` 状态列由 antd `Tag`（`color=success/processing`）改为 pill 徽章（`rounded-full` + 语义色底 + 圆点，与 syney PoTable/PoDetail 已确立模式一致），列宽 66→78 适配；③ `WorkshopOrderProductionStats.tsx` 下半面板订单状态同步改 pill 徽章；④ 数字列右对齐 + tabular-nums 由 A3 全局样式覆盖（`index.css` 表格 `font-variant-numeric: tabular-nums`），核对无需逐列处理
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run test` 通过（110 文件 / 488 用例）、`bun lint` 本次改动文件 0 error（其余 25 error 均来自 `.opencode/ponytail/` 插件目录，pre-existing）

## 2026-08-14

- **类别**：变更
- **范围**：`src/pages/SyneySetting.tsx`
- **摘要**：UI 改版 D7 —— 编号设置 SyneySetting 重构：① 页面改版为 `app-card` 业务卡片（白底 + 1px 边框 + 浅影 + 12px 圆角，暗色自动降级）；② 裸 Input + onBlur 直存改为 antd Form + 内联校验（编号 required + `whitespace` + 非负整数 `pattern`，错误内联展示）；③ 显式"保存"按钮提交（替代 onBlur 静默保存），保存成功经 `App.useApp()` message 提示；加载态 Spin 居中保留。页面标题"编号设置"由 AppHeader 展示，卡片内保留"西尼相关设置"小标题
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run test` 通过（110 文件 / 488 用例）

## 2026-08-14

- **类别**：变更
- **范围**：`src/features/syney/SafePartSetting/SafePartSettingPage.tsx`
- **摘要**：UI 改版 D6 —— 件号配置 SafePartSetting 长表单分组 + 内联校验：① 新增/编辑 Modal 内表单按 Divider 分两组（"基本信息"：件号/名称/产品型号/编号前缀/英文名称；"配置说明"：需打印标签/为安全部件/分解单列/备注），与 StandardTimeForm/EmployeeForm 已确立的长表单分组模式一致（`titlePlacement="left"`）；② 内联校验 —— 件号规则补 `whitespace: true`（防纯空格提交），编辑态禁用件号输入（`disabled={Boolean(editing)}`，与 SpecForm 编辑锁件号惯例一致，避免 upsert `onConflict: 'part_no'` 误新建记录）；③ 表格 `#` 序号列补 `align: 'right'` + `tabular-nums`（通用清单第②条）
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run test` 通过（110 文件 / 488 用例）

## 2026-08-14

- **类别**：变更
- **范围**：`src/features/syney/SpecList/SpecTable.tsx`
- **摘要**：UI 改版 D5 —— 踏板规格列表 SpecList 过通用列表核对清单：`#` 序号列补 `align: 'right'` + `tabular-nums`（与 PoTable/ReportTable/DetailTable 已确立的数字列右对齐标准一致）。核对结论：规格表无数字/金额/状态列（②③项跳过）、新增/编辑走 Modal（✅）、件号搜索走筛选条件栏（✅）、选中摘要条与 PoList/ReportList 同款（✅）、表格密度/表头样式与基准一致（✅）、加载/空态/错误重试三态属 S1 表格三态通用化范围（本项未重复实施）
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run test` 通过（110 文件 / 488 用例）

## 2026-08-14

- **类别**：修复
- **范围**：`src/features/syney/ReportDetail/index.tsx`
- **摘要**：修复入库单详情"首次加载选中数据后点击编辑，表单无数据填充"的 bug。根因：antd Modal 默认惰性挂载（`forceRender=false`），首次打开时表单实例尚未挂载，原 `useEffect([isModalOpen, reportItem])` 触发时 `detailFormRef.current` 仍为 null，导致 `setFieldsValue` 落空；后续打开因表单已挂载而正常。修复：移除该 `useEffect`，改用 Modal `afterOpenChange` 回调（与 villa-lift `FinishingRecordEditModal` 同款模式）在弹窗真正打开后填充表单，`reportItem` 由选中行即时计算保证闭包值正确
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run test` 通过（110 文件 / 488 用例）、lsp_diagnostics 0 诊断

## 2026-08-14

- **类别**：变更
- **范围**：`src/features/syney/ReportDetail/index.tsx`、`src/features/syney/ReportDetail/useDetail.ts`、`src/features/syney/ReportDetail/DetailTable.tsx`、`src/services/apiSyneyStoreReports.ts`
- **摘要**：UI 改版 D4 —— 入库单详情 ReportDetail：① 字段分区 —— 顶部新增"对账单信息"卡片（复用 `app-card` 统一样式），字段按 2/4 列响应式 grid 展示对账单号/创建日期/明细条数，总金额用 18px 粗体 `tabular-nums` 大数字突出，右上角状态 pill 徽章（语义色与 ReportList STATUS_STYLES 一致：已校对=emerald / 未校对=rose）；为支撑卡片新增 `getSyneyStoreReportHeader`（查询 `syney-store-reports` 的 `id, No, Status, TotalAmount, created_at`），`useDetail` 并行追加 `reportInfo` 查询（queryKey `syney-store-report-info`）；② 操作区吸底 —— 原顶部工具栏改为底部固定操作条（`border-t` 分割线）：左侧"返回列表"按钮（ArrowLeft + `navigate(-1)`），右侧"编辑"+"删除"；③ 数字列右对齐 —— `DetailTable` 的 `#` 序号列补 `align: 'right'` + `tabular-nums`。打印入口说明：详情页无独立打印入口（打印统一在列表页"打印对账单/打印入库单"走 PrintButton），本项无打印改动
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run test` 通过（110 文件 / 488 用例）、lsp_diagnostics 0 诊断

## 2026-08-14

- **类别**：变更
- **范围**：`src/features/syney/ReportList/ReportTable.tsx`
- **摘要**：UI 改版 D3 —— 入库单列表 ReportList 过通用列表核对清单：`#` 序号列补 `align: 'right'` + `tabular-nums`（与 PoTable/DetailTable 已确立的数字列右对齐标准一致）。核对结论：对账金额列已右对齐 + `tabular-nums`（✅）、汇总行已 `tabular-nums`（✅）、状态列已是 pill 徽章（✅）、新增走 Modal、按钮反馈均已走 `App.useApp()` 主题 context（✅）、加载/空态/错误重试三态属 S1 表格三态通用化范围（本项未重复实施）
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run test` 通过（110 文件 / 488 用例）、lsp_diagnostics 0 诊断

## 2026-08-13

- **类别**：变更
- **范围**：`src/features/syney/PoList/ExcelUpload.tsx`、`src/features/syney/PoList/PoTable.tsx`
- **摘要**：UI 改版 D1 —— 订单列表 PoList 过通用列表核对清单：① 导入反馈统一 —— `ExcelUpload` 从 antd 静态 `message`（不走主题 context）改为 `App.useApp()` 的 `messageApi`（与主容器一致），错误文案升级为"原因+影响+建议"（文件格式不支持/文件过大/解析失败均说明原因与处理建议），成功反馈带解析条数（"共 N 条明细，请核对预览数据后提交"）；② 数字列右对齐 —— `PoTable` 的 `#` 序号列、数量（Qty）、编号（SerialNo）加 `align: 'right'`，序号与编号补 `tabular-nums`，汇总行数量加千分位 `toLocaleString()`。核对结论：状态列已是 pill 徽章（✅）、表格密度随全局 G3 token 改善（✅）、新增/编辑保持 Modal 720（含 Excel 预览大表，Drawer 不必要）、加载/空态/错误重试三态属 S1 表格三态通用化范围（本项未重复实施）
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run test` 通过（110 文件 / 488 用例；首次运行 1 例"选择人员 Select loading"时序 flaky 失败，重跑全绿，与本次改动无交集）、lsp_diagnostics 0 诊断

## 2026-08-13

- **类别**：变更
- **范围**：`src/features/syney/PoDetail/index.tsx`、`src/features/syney/PoDetail/DetailTable.tsx`
- **摘要**：UI 改版 D2 —— 订单详情 PoDetail：① 详情分区卡片 —— 顶部新增"订单信息"卡片（复用 `app-card` 统一样式：白底/边框/浅影/12px 圆角，暗色适配），字段按 2/4 列响应式 grid 展示订单号/生产号/规格/交货日期/商标/工艺要求/编号/备注，数量列用 18px 粗体 `tabular-nums` 大数字突出，右上角状态 pill 徽章（语义色与 PoTable STATUS_STYLES 一致：已创建=rose / 部分送货=amber / 已入库=emerald / 暂停=pink / 作废=slate）；② 操作区吸底 —— 原顶部工具栏改为页面底部固定操作条（`border-t` 分割线）：左侧"返回列表"按钮（ArrowLeft + `navigate(-1)`），右侧"编辑"按钮；③ 数字列右对齐 —— `DetailTable` 的 `#` 序号列补 `align: 'right'` + `tabular-nums`，数量列补 `align: 'right'`（汇总行此前已右对齐）
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run test` 通过（110 文件 / 488 用例）、lsp_diagnostics 0 诊断

## 2026-08-13

- **类别**：修复
- **范围**：`src/pages/Login.tsx`
- **摘要**：修复登录页暗黑模式下背景未适配：页面根 `bg-white`、右侧表单区 `bg-slate-50/60`、登录卡片 `bg-white`/`border-slate-100` 等硬编码浅色值补 `dark:` 变体（根 `dark:bg-slate-950`、表单区 `dark:bg-slate-900/60`、卡片 `dark:bg-slate-900`/`dark:border-slate-800`/`dark:shadow-none`）；标题 `dark:text-slate-100`、副标题 `dark:text-slate-400`、表单标签 `dark:text-slate-300`、复选框 `dark:text-slate-300`；邮箱/密码输入框补 `dark:border-slate-700`/`dark:bg-slate-800`/`dark:text-slate-100`/`dark:placeholder:text-slate-500`/`dark:hover:border-slate-600`
- **验证**：`bun run typecheck` 通过（0 错误）、lsp_diagnostics 0 诊断、页面级回归（浏览器实测：`html.dark` 生效，根背景 oklch(0.129)=slate-950、表单区 slate-900/60、卡片 slate-900，暗色下文字/输入框对比度正常）

## 2026-08-13

- **类别**：变更
- **范围**：`src/pages/AccessDenied.tsx`
- **摘要**：UI 改版 C3 —— 403 无权限页与 404 / 错误页视觉统一：`AccessDenied` 从独立 antd Card（默认 8px 圆角、无插画、固定 `bg-slate-100` 背景、暗色不适配）改为复用 `AppErrorView`（variant="permission"，rose 语义色系 + 盾牌插画 + 渐变背景 + 32px 圆角卡片 + 明暗适配）；动态描述（未登录/未绑定员工/账号停用/无角色/无权限）映射到"错误摘要"，账号邮箱映射到"诊断信息"，按钮组映射到操作区（返回登录页 + 有登录态时显示退出当前账号）。至此 404（PageNotFound）、403（AccessDenied）、运行时错误（RouteErrorPage）三个兜底页全部由 `AppErrorView` 统一渲染
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run test` 通过（110 文件 / 488 用例）、eslint 0 告警、页面级回归（dev server：`/access-denied` 未登录态渲染 permission 变体 —— 权限限制徽章、盾牌插画、动态描述"当前登录信息已失效"、诊断"账号邮箱：未登录"、32px 圆角卡片、rose 渐变背景；404 页同源渲染正常）

## 2026-08-13

- **类别**：变更
- **范围**：`src/pages/Login.tsx`
- **摘要**：UI 改版 C2 —— 登录页硬编码蓝色替换为品牌 token：`bg-blue-600`（2 处 JJG logo）→ `bg-primary`、`hover:bg-blue-700`（登录按钮）→ `hover:bg-primary-hover`、`focus:border-blue-500`（邮箱/密码输入框）→ `focus:border-primary`；3 处按钮/logo 阴影的硬编码 `rgba(37,99,235,…)` 改为 `color-mix(in_srgb,var(--jjg-color-primary)_xx%,transparent)` 动态引用品牌色。色值来源统一为 `App.tsx BASE_TOKENS`（当前 `#2563eb`），后续换主色登录页自动跟随
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run build` 通过、`bun run test` 通过（110 文件 / 488 用例）、eslint 0 告警、页面级回归（dev server 登录页：2 处 logo 与登录按钮实际渲染 `rgb(37,99,235)` = `#2563eb`，阴影为品牌色 20%/32%/40% 透明度，主色变量 `--jjg-color-primary` 正确）

## 2026-08-13

- **类别**：变更
- **范围**：`src/pages/Dashboard.tsx`、`src/services/apiDashboard.ts`（含 `apiDashboard.vitest.ts`）
- **摘要**：UI 改版 C1 —— 首页 Dashboard 由"欢迎使用"空卡改为决策优先看板：新增 `apiDashboard.ts` 聚合查询（5 张核心业务表 sales_orders / production_orders / syney-pos / material_transfers / employees，并行 count 总数 + 近 14 天每日新增），纯函数 `buildDailyTrend`（按日桶计数，忽略 null/非法/越界日期）与 `computeDeltaPercent`（后 7 天 vs 前 7 天环比，前段为 0 返回 null）；`Dashboard.tsx` 重写为 KPI 卡 Grid（CSS Grid `repeat(auto-fill, minmax(200px,1fr))`），每卡 = 28px 粗体 tabular-nums 大数字 + 环比标签（▲绿/▼红/持平）+ 内联 SVG 趋势迷你图（无第三方图表依赖，面积填充 + 折线 + 末点高亮），卡片复用 `app-card` 统一样式；含加载骨架屏、错误 Alert + 重试、AbortSignal 传递（queryClient 全局处理）
- **验证**：`bun run test` 通过（110 文件 / 488 用例，新增 7 用例）、`bun run typecheck` 通过（0 错误）、eslint 0 告警、页面级回归（dev server 登录后 /dashboard 渲染 5 张 KPI 卡真实数据：车间订单 4,136 / 生产工单 4,755 / 西尼订单 542 / 物料转移 2,732 / 员工 69，环比与迷你图正常，控制台无新增错误）

## 2026-08-13

- **类别**：变更
- **范围**：`src/features/tooling-fixture/FixtureDataPage.tsx`、`useToolingFixtures.ts`、`queryKeys.ts`、`src/services/apiToolingFixture.ts`（含 `apiToolingFixture.vitest.ts`）
- **摘要**：工装资料页新增"按制作日期范围筛选"。页面搜索栏增加 `DatePicker.RangePicker`（占位"制作开始日期 / 制作结束日期"），选择后按 `manufactured_date` 的 `gte`/`lte` 过滤列表；`getToolingFixtureList` 与 `getAllToolingFixtures`（打印二维码路径）均支持 `manufacturedDateRange` 参数，queryKey 同步纳入日期范围以保证缓存隔离；补测试覆盖日期范围筛选
- **验证**：`bun run test` 通过（apiToolingFixture 相关 14 用例）、`bun run typecheck` 通过（0 错误）

## 2026-08-13

- **类别**：修复
- **范围**：`src/App.tsx`
- **摘要**：修复 B1 遗留风险 —— antd cssVar 变量默认挂在组件根元素（`.css-var-*`）上，作用域外元素（脱离 antd 组件的裸 DOM、portal 内容）解析不到 `--jjg-*` 变量、会回退到 CSS 兜底值。新增 `SyncThemeTokens` 组件（置于 `AntdApp` 内），用 `theme.useToken()` 获取计算后的 token，将 `@theme inline` 引用的 11 个变量（主色/语义色/圆角/文本灰/分割线）显式写入 `document.documentElement`（:root），任意位置均可解析；主题/暗色切换时 token 变化自动同步，值仍以 `App.tsx BASE_TOKENS` 为唯一来源。顺带修正：`--color-text-tertiary` 旧硬编码 `rgba(0,0,0,0.25)` 与 antd 6 默认 `0.45` 不一致（旧值实为 quaternary 语义），桥接后以 antd 为准
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run test` 通过（109 文件 / 480 用例）、页面回归（:root 上 11 个变量齐全；body 直挂元素 `bg-primary` 解析为 `#2563eb`、`rounded-lg` 为 12px；暗色切换后 `--jjg-color-text-secondary` 自动更新为 `rgba(255,255,255,0.65)`）

## 2026-08-13

- **类别**：变更
- **范围**：`src/index.css`、`src/App.tsx`、`package.json`
- **摘要**：UI 改版 B1 —— antd 与 Tailwind 主题打通：① `index.css` 顶部声明 `@layer theme, base, antd, components, utilities;`（在 `@import 'tailwindcss'` 之前），antd 样式经 `StyleProvider layer` 包入 `@layer antd`，Tailwind utilities 可覆盖 antd 样式；② `App.tsx` 的 `ConfigProvider` 开启 `cssVar: { prefix: 'jjg' }`，token 输出为 `--jjg-*` CSS 变量（暗色模式自动切换）；③ `index.css` 的 `@theme inline` 改为桥接引用 antd 变量（`--color-primary: var(--jjg-color-primary, #2563eb)` 等，含语义色/圆角/文本灰/分割线，均带与 App.tsx 一致的兜底值），消除 CSS 侧硬编码色值——修复 A1 遗留的 `--color-primary: #1677ff` 与 App.tsx `#2563eb` 不一致问题，颜色/圆角以 `App.tsx BASE_TOKENS` 为唯一来源；④ `package.json` 显式声明 `@ant-design/cssinjs`（antd 已有依赖，供 `StyleProvider` 直接引用）
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run test` 通过（109 文件 / 480 用例）、页面级回归（dev server 确认 `@layer antd` 生效、`--jjg-color-primary` 变量生成、主色/圆角渲染正常）

## 2026-08-13

- **类别**：变更
- **范围**：`src/App.tsx`（Menu token）、`src/ui/MainMenu.tsx`
- **摘要**：UI 改版 A7 —— 菜单激活态改圆角高亮块：Menu 组件 token 配置 `itemBorderRadius: 8` + `itemSelectedBg: rgba(37,99,235,0.08)`（主色 8%）+ `itemSelectedColor: #2563eb`；暗色模式激活块 `darkItemSelectedBg: rgba(37,99,235,0.16)` + `darkItemSelectedColor: #bfdbfe`，并统一暗色菜单背景 `darkItemBg/darkSubMenuItemBg/darkPopupBg: #0f172a` 与 Sider slate-900 一致；分组标题：`MainMenu` 过滤逻辑中带子菜单的父级（submenu 分组）label 包装为 12px 灰字（`text-xs text-slate-500`，暗色 slate-400）与叶子导航项区分；`groupTitle*` token 预留（当前菜单为 submenu 结构、无 group type）
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run test` 通过

## 2026-08-13

- **类别**：变更
- **范围**：`src/ui/AppHeader.tsx`
- **摘要**：UI 改版 A6 —— Header 精简定制：底部增加 1px 分割线（`border-b border-slate-200`，暗色 `dark:border-slate-700`，与卡片边框色系一致）；页面标题由硬编码 `text-neutral-900/dark:text-neutral-50` 改为 antd token 色 `token.colorText`（随主题自动深浅切换）
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run test` 通过

## 2026-08-13

- **类别**：变更
- **范围**：`src/ui/AppLayout.tsx`、`src/ui/MainMenu.tsx`、`src/ui/AppLogo.tsx`
- **摘要**：UI 改版 A5 —— 侧边栏定制：Sider 由 antd 默认深色改 `theme="light"` + 背景 `bg-white`（暗色 `dark:bg-slate-900`），与 Header 同色系；`collapsedWidth={64}`；MainMenu 菜单主题由写死 `theme="dark"` 改为跟随 `isDarkMode`（浅色模式菜单浅底深字，暗色保持深底）；AppLogo 适配浅色（亮色浅底深字卡片，暗色保持原深色样式）并支持折叠态（collapsed 时隐藏文字只留图标，避免 64px 下溢出）
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run test` 通过

## 2026-08-13

- **类别**：变更
- **范围**：`src/ui/AppLayout.tsx`、`src/index.css`
- **摘要**：UI 改版 A4 —— 内容区页面背景与卡片分层：外层/内容区 Layout 背景改 `bg-slate-100`（暗色 `bg-slate-900`），Content 由纯白无边框改为 `app-card` 业务卡片（白底 + 1px slate-200 边框 + 浅影 `0 1px 3px rgba(0,0,0,0.08)` + 12px 圆角；暗色 slate-800 底 + slate-700 边框）；`index.css` 新增 `--shadow-card` token 与 `@utility app-card` 通用卡片类，供后续页面搜索栏/表格/表单容器统一复用
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run test` 通过

## 2026-08-13

- **类别**：变更
- **范围**：`src/index.css`（全局表格样式）
- **摘要**：UI 改版 A3 —— 表格数字列全局启用 `tabular-nums`：对所有表格单元格（`table > thead > tr > th` / `table > tbody > tr > td` / `table > tfoot > tr > td`，含 antd 表格）应用 `font-variant-numeric: tabular-nums`，金额/数量/工时/百分比等数字列自动等宽防跳动。仅影响数字字形，中文/字母文本无影响。使用通用元素选择器而非 `.ant-*` 私有类，规避 `appShellConfig.vitest.ts` 架构守卫（全局 CSS 禁 `.ant-`）且不依赖 antd 内部 DOM；列级右对齐按业务语义留待逐页改造通过 `column.align` 处理。已手工使用 `tabular-nums` 的 span 不受影响（叠加）
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run test` 最终全量 109 文件 / 480 用例通过。过程记录：临时 `.ant-` 选择器方案违反 `appShellConfig.vitest.ts` 架构守卫（全局 CSS 禁 `.ant-`）被否决，改用通用元素选择器并通过；`remoteEmployeeSelect.vitest.tsx` 选项顺序断言在全量并发下偶发失败（单独运行通过，与本次 CSS 改动无关，属既有 flaky）

## 2026-08-13

- **类别**：变更
- **范围**：`src/App.tsx`（TABLE_TOKENS）
- **摘要**：UI 改版 A2 —— 表格密度 token 升级：默认/中等密度由 12px 字 / 4px 行高 / 6px 内边距放松为 13px / 8px / 12px；SM 变体（`size="small"`）保留原紧凑密度（12/4/6）作为密集页面局部降级档
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run test` 通过

## 2026-08-13

- **类别**：变更
- **范围**：`src/App.tsx`（BASE_TOKENS）
- **摘要**：UI 改版 A1 —— 全局主题 token 升级：主色 `#1677ff`（antd 出厂默认蓝）→ 品牌色 `#2563eb`，并新增 `colorInfo: '#2563eb'` 跟随主色；圆角基准 6→8（SM 4→6 / LG 8→12）；新增 `controlHeight: 34`（默认 32 升级，更舒展）。改动后全站 antd 主色与登录页 Tailwind `blue-600/700`（= #2563eb）统一，消除"两套蓝并存"。src 其余硬编码 `#1677ff`（ProductionScheduling / WorkshopOrderProductionStats / SafePartSetting / index.css `--color-primary`）分别由后续 E3 / E1 / D6 / B1 任务处理
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run test` 通过（见下方命令输出）

## 2026-08-13

- **类别**：重构
- **范围**：`src/features/syney/ReportList/usePrintSyneyStoreReceipt.ts`、`useFetchSyneyStoreReport.ts`
- **摘要**：优化清单 #17 —— 评估 2 处原始 `useMutation` 是否迁移 `useMutationWithMessage`，结论为**保留并注释说明原因**：两处 `mutationFn` 均为 `fetchSyneyStoreReportFromScm`（只读「从 SCM 拉取入库单数据」，非 CRUD 写入），无缓存失效需求，且提示逻辑高度定制——`usePrintSyneyStoreReceipt` 需先 `printWindow?.close()` 再提示并含多个 warning 分支（未获取到数据/浏览器阻止弹窗/回退 PDF 预览）、`useFetchSyneyStoreReport` 的成功/失败提示由 `index.tsx` 的 `handleFetchStoreReport` 按业务分支处理；`useMutationWithMessage` 的「自动失效 + 自动提示」语义不适用，分别加注释说明
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run test` 480/480 通过

## 2026-08-13

- **类别**：性能
- **范围**：`src/features/quality/ReworkRepair/index.tsx`
- **摘要**：优化清单 #14 —— 返工返修页 4 个内联 render 函数（`renderWorkshopFields`/`renderProductionFields`/`renderTechnicalFields`/`renderQualityFields`）抽取为模块级 `memo` 子组件（`WorkshopFields`/`ProductionFields`/`TechnicalFields`/`QualityFields`），消除每次父组件渲染重建 JSX 树：3 个无 props 组件（生产/技术/质量）memo 后父组件重渲染完全跳过；`WorkshopFields` 以 props 传入 4 个依赖（`isFetchingDocumentNo`/`isLoadingOrderOptions`/`projectNoOptions`/`onProjectNoChange`）；删除 `renderModalFields` 调度函数，改为 Modal 内 JSX 按 `processingStageKey` 条件渲染对应组件
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run test` 480/480 通过

## 2026-08-13

- **类别**：性能
- **范围**：`src/features/production-order/ProductionOrderForm.tsx`、`ProductionOrderItemForm.tsx`、`MobileProductionOrderCreatePage.tsx`、`workshop/OrderList/WorkshopOrderForm.tsx`、`villa-lift/CuttingProcess/CuttingProcessForm.tsx`、`villa-lift/FinishingProcess/FinishingProcessForm.tsx`、`machine-runtime/MachineRuntimeSearch.tsx`
- **摘要**：优化清单 #13 —— 8 处 `initialValues` 每次渲染新建对象改为按内容分类缓存：(1) 纯静态提为模块级常量（`ProductionOrderForm` 工序明细 `ITEM_FORM_INITIAL_VALUES`、`CuttingProcessForm`/`FinishingProcessForm` 的 `{ rows: [{...DEFAULT_ROW}] }` → `DEFAULT_FORM_INITIAL_VALUES`）；(2) 含 `dayjs()` 动态日期改 `useMemo` 空依赖（`ProductionOrderForm` 主表单、`MobileProductionOrderCreatePage`、`MachineRuntimeSearch`，消除每次渲染新建 dayjs）；(3) 含动态 prop 改 `useMemo` 依赖 prop（`ProductionOrderItemForm` `[orderId]`、`WorkshopOrderForm` `[initialValues]`）。destroyOnClose 场景已核对：`ProductionOrderForm` 主表单 `order_date` 由 useEffect 在 open 时 `setFieldsValue(dayjs())` 覆盖，initialValues 中 dayjs 冗余、无跨天风险
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run test` 480/480 通过

## 2026-08-13

- **类别**：性能
- **范围**：`src/features/machine-runtime/MachineRuntimeSearch.tsx`、`syney/SpecList/SpecForm.tsx`、`syney/ReportList/ReportForm.tsx`、`attendance/AttendanceDetail/AttendanceDetailForm.tsx`、`tooling/ToolingStockOut/ToolingStockOutForm.tsx`、`youmai/FinishedGoodsStockOut/YoumaiFinishedGoodsStockOutForm.tsx`、`villa-lift/OrderList/VillaLiftOrderForm.tsx`、`quality/IssueRecord/IssueRecordForm.tsx`、`production-order/ProductionOrderForm.tsx`
- **摘要**：优化清单 #12 —— 9 处 Form `onFinish`/`handleFinish` 由每次渲染重建改为 `useCallback` 包裹并补全依赖数组：`MachineRuntimeSearch`（`[onSearch]`）、`SpecForm`（`[onFinishFunc]`）、`ReportForm`（`[message, syneySpecs, createReport, handleCancel]`）、`AttendanceDetailForm`（`[onFinish]`）、`ToolingStockOutForm`（`[onFinish]`）、`YoumaiFinishedGoodsStockOutForm`（`[onFinish]`）、`VillaLiftOrderForm`（`[onFinish]`）、`IssueRecordForm`（`[onSubmit, employeeNameMap]`）、`ProductionOrderForm` 两处 `handleFinish`（`[onSubmit, items, form]`）与 `handleItemFinish`（`[modelsMap, itemForm, editingItemIndex, items]`）
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run test` 480/480 通过

## 2026-08-13

- **类别**：性能
- **范围**：`src/features/access-management/UserPermissionList/index.tsx`、`UserPermissionDetail.tsx`、`PermissionRegistry/index.tsx`
- **摘要**：优化清单 #11 —— 权限管理 3 处 `columns` 与内联 `filter` 用 `useMemo` 包裹消除每次渲染全量重算：(1) `UserPermissionList` 的 `filtered`（`allEmployees.filter` 每次渲染重算）与 `columns` 均 `useMemo`（依赖 `[allEmployees, search]` / `[getRoleLabel]`），并把 `columns` 定义从 `if (selectedEmployee) return` 之后上提到 return 之前（修正潜在条件 Hook 隐患）；(2) `UserPermissionDetail` 的 `columns` `useMemo`（依赖 `[rolePermissionIds, overrideMap]`）；(3) `PermissionRegistry` 的 `filtered` 与 `columns` 均 `useMemo`（依赖 `[allPermissions, keyword, scopeFilter]` / `[]`）
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run test` 480/480 通过（首次运行 `remoteEmployeeSelect.vitest.tsx` 1 例并发 flaky 失败，重跑全量通过，确认与本次改动无关）

## 2026-08-13

- **类别**：性能
- **范围**：`src/features/workshop/EmployeeList/index.tsx`、`src/features/workshop/StandardTimeList/index.tsx`、`src/features/workshop/JobBaseSetting/index.tsx`、`src/features/workshop/OrderList/index.tsx`、`src/features/workshop/MachineEquipmentMaintenance/index.tsx`
- **摘要**：优化清单 #10 —— 全部 5 个 workshop 列表页把 `FormInstance` 存在 `useState` 的问题改为 `useRef`：EmployeeList 4 个表单实例（员工/开通账号/重置密码/重新绑定）、StandardTimeList 1 个、JobBaseSetting 1 个、OrderList 1 个、MachineEquipmentMaintenance 1 个，均改为 `useRef` + 稳定的 `useCallback` setter（`formRef.current = form`），消除表单实例写入时触发的父组件多余重渲染；所有 `formRef?.xxx()` 调用点改为 `formRef.current?.xxx()`，`useCallback` 依赖数组同步精简（移除不再变化的 `formRef` 依赖）
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run test` 480/480 通过

## 2026-08-13

- **类别**：性能
- **范围**：`src/features/villa-lift/OrderList/index.tsx`
- **摘要**：优化清单 #9 —— 别墅梯订单列表 3 个文本搜索框（客户/项目名称/产品名称）由受控 `useState` 改为 uncontrolled（`defaultValue` + `InputRef` + 重挂载 `key`），消除"每击键重渲染整个 827 行父组件"的问题；提交时从 ref 读取值（`handleSearch`），重置与切换 Tab 时递增 `searchInputKey` 使输入框重挂载清空；日期范围选择器保持受控不变（仅选择时触发查询，非逐击键场景）；表格本身已由 `memo` 保护不受影响
- **验证**：`bun run typecheck` 通过（0 错误）、`bun run test` 480/480 通过

## 2026-08-13

- **类别**：文档
- **范围**：`docs/UI改版-逐页问题分析与改进方案.md`（新建）、`todolist.md`（新建）
- **摘要**：基于 `docs/UI设计调研与改版指南.md` 与现有代码（`App.tsx` 主题 token、`AppLayout`、`AppHeader`、`MainMenu`、`Login`、`Dashboard`、路由/菜单）做全站逐页 UI 问题诊断：确认 4 个全局根因（默认蓝 `#1677ff`、表格 12px/4px 过紧、Content 纯白无分层、Sider 深色未定制）+ 登录页与主站两套蓝并存问题；产出 21 个功能域约 60 页的逐页"问题+方案"表，并按 P0/P1/P2 整理为可勾选执行清单 `todolist.md`（规则：完成一项打勾 → 用户确认 → 再继续下一项）。不改动任何运行代码
- **验证**：纯文档新增，无需构建/测试；已核对页面清单与 `router.tsx`、`MainMenu.tsx`、`lazyPages.ts` 中路由/菜单一一对应

## 2026-08-13

- **类别**：修复
- **范围**：`supabase/migrations/20260813100000_fix_tooling_stock_out_public_insert_allow_no_machine.sql`（新建）、`tooling_stock_out` 表 RLS 策略
- **摘要**：修复刀具出库扫码登记 H5 页面（无需登录）提交时报"没有权限执行当前操作"的问题。根因：H5 表单提供"无机器"选项（`machine_equipment_id` 为 null），但远程库中 `Tooling stock out public insert` 策略漂移回严格校验 `machine_equipment_id is not null`（20260510084535 已放宽过该策略，远程库其后被改回），RLS 校验失败被 `errorHandler` 映射为权限错误。修复：重建该策略，允许 `machine_equipment_id is null`，非空时校验其存在于 `machine_equipment_maintenances`，其余校验（刀具资料、领用人、用途、数量、状态、领用方式）保持不变
- **验证**：`anon` 角色实测——无机器插入成功、伪造机器 UUID 插入仍被 RLS 拒绝；策略已同步到远程 Supabase 并记录迁移

## 2026-08-13

- **类别**：文档
- **范围**：`docs/UI设计调研与改版指南.md`（新建）
- **摘要**：调研 2025-2026 年主流后台管理系统 UI 设计趋势（Calm Design 克制极简、Bento Grid、密度分层、暗色标配、微交互、决策优先看板等），结合本项目 React 19 + antd 6 + Tailwind 4 技术栈与现有代码（`App.tsx` 主题 token、`AppLayout`、`AppHeader`）做现状诊断，产出可落地的 UI 改版指南：品牌色/圆角/表格密度等 token 规格、antd 与 Tailwind 的 `@layer` + CSS 变量桥接方案、布局与组件细化方向、P0-P3 优先级路线图。作为全站视觉升级的参考规范，不改动任何运行代码
- **验证**：纯文档新增，无需构建/测试；已核对与既有 `docs/UI设计风格.md`（物料转移单局部规范）不冲突、互相引用

## 2026-08-13

- **类别**：修复
- **范围**：`src/services/apiProcessStandards.ts`、`src/services/apiExtrusionProductions.ts`、`src/services/apiQualityReworkRepair.ts`、`src/services/apiQualityIssueRecords.ts`、`src/services/apiProcessStandards.vitest.ts`
- **摘要**：修复"生产工单 / 成本核算"输入项目号 105-350 带不出来的 bug。根因：`getSalesOrdersProjectNos()` 等 4 个选项查询改为单次查 `v_sales_order_project_options` 视图后丢失了分页，而项目配置了 PostgREST `db-max-rows = 1000`（显式 limit 也无法突破），按 `created_at DESC` 排序只返回最新 1000 条"生产中"订单（共 2822 条），105-350（`26052603-01/02`，创建于 5 月 26 日，排第 1391 位）及所有 6 月 22 日前创建的订单均被截断。修复：恢复 while + `.range()` 分页循环拉取（同 `apiMaterialTransfers` 既有模式），保留视图去重逻辑；同步修复同款问题的 `getExtrusionSalesOrdersProjectNos()`（挤压生产单）、`getQualityReworkRepairOrderOptions()`（质量返工）、`getQualityIssueRecordOrderOptions()`（质量问题记录，无 status 过滤、全量 4111 行，截断最严重）。更新 `apiProcessStandards.vitest.ts` 分页测试（断言跨页 range 调用与去重）
- **验证**：`bun run test` 全量通过（480/480）；`bun run typecheck` 通过；lint 与基线一致（25 errors 均为既有问题，本次改动未新增）；PostgREST 分页实测 3 页拉满 2822 条且含 26052603-01/02（105-350）

## 2026-08-12

- **类别**：性能
- **范围**：`src/features/syney/PoList/ExcelUpload.tsx`、`src/features/syney/PoList/lazyDocumentModules.vitest.ts`
- **摘要**：优化清单 #20 落地：修复 `check:bundle` 基线失败（CI 红）。根因：`PoList` 页面静态依赖链含 `xlsx-js-style`（约 800KB）——`ExcelUpload.tsx` 静态 import `@utils/excelUtils`（其静态依赖 xlsx），导致 xlsx 进入 PoList 动态页面静态依赖图，触发预算脚本 "动态页面静态依赖图不应包含 PDF/XLSX 模块"。改法：`ExcelUpload.tsx` 将 `importExcelOrder` 改为 `import('@utils/excelUtils')` 动态加载（`TransformedOrderData` 保持 type-only import），并新增挂载即 `void loadExcelUtils()` 预加载——保留原"避免上传时才拉 chunk 失败"的设计意图（挂载时预热，用户选文件时已缓存）；同步更新 `lazyDocumentModules.vitest.ts` 保护测试（断言动态 import + 预加载 + type-only 保持）
- **验证**：`bun run build` 成功；`bun run check:bundle` 通过（`Bundle budget passed: assets/index-*.js gzip 25.0 KB`，此前基线失败）；`bun run test` 全量通过（480/480）；未做浏览器端 Excel 上传流程回归（需登录态与测试环境，缺口说明）

## 2026-08-12

- **类别**：性能
- **范围**：`vite.config.ts`
- **摘要**：优化清单 #8 落地：Vite 8（Rolldown 内核）下 `manualChunks` 已移除/弃用，改用 `build.rolldownOptions.output.codeSplitting.groups` 手动分包，为核心 vendor 提供稳定 chunk（内容不变则 hash 不变，浏览器缓存友好）：`vendor-react`（react/react-dom/react-router/zustand/immer）、`vendor-antd-core`（antd 基础组件，入口链常用白名单）、`vendor-antd-deps`（@ant-design/@rc-component/rc-* 依赖树，dayjs 亦归入此组）、`vendor-query`（@tanstack）、`vendor-supabase`。重型组件（table/date-picker/select 等）与 PDF/XLSX 库不匹配任何组，保持 Rolldown 按需懒加载拆分，避免首屏拉取整包 antd；入口静态依赖由原先 30+ 散件收敛为 5 个 vendor chunk + 业务链，入口 index gzip 24.85 KB
- **验证**：`bun run build` 成功（tsc -b + vite build，无循环依赖/警告）；`bun run check:bundle` 仍失败但为**基线既有问题**（HEAD 配置构建同样报 `PoList -> xlsx.min` 静态依赖违规，xlsx 不匹配任何分组、行为未变，已在清单追加 #20）；`bun run test` 全量通过（480/480）

## 2026-08-12

- **类别**：性能
- **范围**：`supabase/migrations/20260812110000_add_missing_indexes.sql`（新建）、`src/services/database.types.ts`（自动生成，无 diff）
- **摘要**：优化清单 #7 落地：为 4 张业务表补充高频组合查询复合索引（核对 `pg_indexes` 现有索引后确认均缺失）。(1) `production_order_items(product_model, customer_model, data_category)` —— 生产工单列表 inner join `item_filters` 过滤与生产日报按型号/类别过滤的组合路径；(2) `production_orders(order_date, created_at)` —— 工单列表按 `order_date` 范围过滤 + `created_at DESC, order_date DESC` 排序（原仅有 `order_date` 单列索引，排序仍需额外 sort）；(3) `sales_orders(order_date, project_no)` —— 车间订单/排产页日期范围与项目号组合过滤（原仅单列索引）；(4) `material_transfers(project_no, created_at)` —— 物料转移单按项目号过滤 + `created_at DESC` 排序。4 张表均 <1 万行，索引构建即时完成，均为 CREATE INDEX IF NOT EXISTS 幂等写法；仅加索引，无应用代码改动
- **验证**：`bun run db:push` 应用 migration（API 模式，直连超时自动回退，推送 1 个 migration 成功）；MCP 只读 SQL 确认 4 个索引已存在于 `pg_indexes`；`bun run db:types` 成功（database.types.ts 无 diff）；`bun run typecheck` 通过；`bun run test` 全量通过（480/480）

## 2026-08-12

- **类别**：性能
- **范围**：`src/services/apiWorkshopOrders.ts`、`src/services/apiProductionOrders.ts`、`src/services/apiMaterialTransfers.ts`、`src/services/apiPrecisionFinishingCuttings.ts`、`src/services/apiPrecisionCuttingTransfers.ts`
- **摘要**：优化清单 #6 落地（5/6）：5 处列表查询由 `select('*')` 改为显式指定列，避免大字段（如 `sales_orders.process_schedules` JSON）随列表全量下传。`getWorkshopOrders` 指定 20 列（核对表格 dataIndex、编辑表单回填、打印/Excel 消费字段后选定，删除字段无消费端）；`getProductionOrders` 主表指定 9 列（employee/items join 保持原样）；`getMaterialTransfers` 指定 18 列、`getPrecisionFinishingCuttings` 指定 29 列、`getPrecisionCuttingTransfers` 指定 30 列（逐一核对桌面/移动表格与编辑表单字段，`audited_at` 为移动列表消费已补入）。`getExtrusionProductions` 保留 `*`：表仅 1 行 + 编辑表单需明细全字段回填，指定列无收益
- **验证**：`bun run typecheck` 通过；`bun run test` 全量通过（480/480）

## 2026-08-12

- **类别**：性能
- **范围**：`src/services/apiMachineRuntime.ts`
- **摘要**：优化清单 #5 落地：`getMachineRuntimeSummary` 消除无界拉行 JS 聚合。原实现把日期范围内全部 `v_machine_runtime_items` 明细行（实测 6058 行）拉回前端逐个求和；改为 PostgREST 原生聚合 `select('machine_equipment_id, total_runtime_seconds:runtime_seconds.sum()')`（SQL 侧 GROUP BY `machine_equipment_id`，过滤条件不变），删除前端 Map 循环求和；聚合后每台设备一行（≤80 行），纯前端查询改写，无 DB/migration 改动。返回结构 `MachineRuntimeSummaryItem` 与调用方 `useMachineRuntimeSummary` 不变
- **验证**：`bun run typecheck` 通过；`bun run test` 全量通过（480/480）；MCP 只读 SQL 核对 `production_order_items` 明细 6058 行、去重后 80 台设备，聚合行数上限与预期一致（MCP 会话无 `page:machine-runtime` 权限故视图聚合查询返回空，属预期权限行为）

## 2026-08-12

- **类别**：性能
- **范围**：`supabase/migrations/20260812100000_add_sales_order_project_options_view.sql`（新建）、`src/services/database.types.ts`（自动生成）、`src/services/apiProcessStandards.ts`、`src/services/apiExtrusionProductions.ts`、`src/services/apiQualityIssueRecords.ts`、`src/services/apiQualityReworkRepair.ts`、`src/services/apiProcessStandards.vitest.ts`、7 个 options hook（`workshop/StandardTimeList/useStandardTimes.ts`、`production-order/useProcessStandards.ts`、`packaging-process/WorkOrderList/useWorkOrders.ts`、`packaging-process/StandardTimeList/useStandardTimes.ts`、`extrusion-production/useExtrusionProductions.ts`、`quality/IssueRecord/useQualityIssueRecords.ts`、`quality/ReworkRepair/useQualityReworkRepair.ts`）
- **摘要**：优化清单 #4 落地：消除 4 处 `sales_orders` 项目号选项 while 分页全表扫描。(1) 新建视图 `v_sales_order_project_options`（覆盖 `project_no/product_model/length_mm/material_code/customer/customer_model/weight_per_meter_kg/order_quantity/created_at/status`，`where project_no 非空`；`sales_orders.project_no` 已有 partial unique 索引，视图天然一行一项目号，并显式 `grant select` 给 anon/authenticated），migration 已应用、`bun run db:types` 已重新生成类型。(2) `getSalesOrdersProjectNos`（保留 `status='生产中'` 过滤与 Set 去重）、`getExtrusionSalesOrdersProjectNos`（保留 status 过滤）、`getQualityIssueRecordOrderOptions`、`getQualityReworkRepairOrderOptions`（后两者保留 trim+Map 去重与 project_no 排序）全部改为单次查视图，删除 while 循环、`range` 分页与 `PAGE_SIZE` 常量（`EXTRUSION_PROJECT_OPTIONS_PAGE_SIZE`、两处 `ORDER_OPTIONS_PAGE_SIZE`）；查询排序保持原 `created_at desc, project_no asc` 不变，下拉选项顺序与原来一致。(3) 7 个 options hook 统一由 `queryConfig.list`（30s）改为 `queryConfig.static`（1h 长 TTL）+ `refetchOnMount: 'always'`（挂载时取最新、常驻不轮询），与清单 #1 岗位字典模式对齐。(4) 测试：`apiProcessStandards.vitest.ts` 分页用例重写为单次视图查询（断言无 `range` 调用、查 `v_sales_order_project_options`、去重与 status 过滤保留）
- **验证**：`bun run db:push` 应用 migration（API 模式，直连超时自动回退）；`bun run db:types` 成功；`bun run typecheck` 通过；`bun run test` 全量通过（480/480）；`bunx eslint` 12 个改动文件无错误

## 2026-08-12

- **类别**：变更
- **范围**：`opencode.jsonc`、本地开发环境（npm 全局）
- **摘要**：安装 TypeScript LSP：全局安装 `typescript-language-server@5.3.0` 与 `typescript@5.9.3`（项目 typescript@6.0.3 为原生版无 `tsserver.js`，7.0.2 亦无，LSP 后端需经典版），并在 `opencode.jsonc` 新增 `lsp.typescript` 配置（`--tsserver-path` 指向全局 5.9.3 的 tsserver.js，覆盖同名内置配置）；`lsp_diagnostics` 对 apiProcessStandards/apiProductionOrderItems/apiStandardTimes 及其测试文件均返回无诊断
- **验证**：`lsp_diagnostics` 4 个文件全部 "No diagnostics found"

## 2026-08-12

- **类别**：性能
- **范围**：`src/services/apiProcessStandards.ts`、`src/services/apiProductionOrderItems.ts`、`src/services/apiStandardTimes.ts`、`src/services/apiProcessStandards.vitest.ts`
- **摘要**：优化清单 #3 落地：消除标准秒解析 N+1 查询。(1) `apiProcessStandards.ts` 新增模块级标准秒缓存（key=归一化的 model::operation::length::partNo，TTL 1h 对齐 queryConfig.static 语义，上限 1000 条满则清空）与 `clearStandardSecondsCache()` 导出；`getStandardSeconds` 接入缓存（单组场景不再重复查库）；新增 `resolveStandardSecondsBatch`——按 (model, operation) 组合去重后一次 `in()` 预取全部 A/B 候选行，JS 内按与 `fetchMatchedProcessStandards` 一致的匹配口径（A 类型料号+长度精确优先，B 类型型号回退取首行）解析，批量预取失败整体静默降级 0（与原逐组 try/catch 语义一致）不写缓存。(2) `apiProductionOrderItems.ts` 的 `resolveProductionOrderItemStandardSeconds` 由逐组 `getStandardSeconds`（每组最多 2 次查询）改为单次批量预取，原函数内批级缓存删除，跨详情页/列表/写操作共享模块级缓存。(3) `apiStandardTimes.ts` 的 `createStandardTime`/`ensureStandardTimeExists`/`updateStandardTime`/`deleteStandardTimes` 写入成功后调 `clearStandardSecondsCache()`，避免"改完标准秒页面仍显示旧值"；`updateStandardTimesLastProcess`（仅 is_last_process）与工艺图上传（仅图片字段）不影响秒数匹配，无需清缓存。(4) 测试：mock QueryBuilder 补 `in` 方法、`beforeEach` 清缓存防用例污染，新增批量匹配/缓存复用/失败降级 2 个用例
- **验证**：`bun run typecheck` 通过（EXIT 0）；`bun run test` 全量通过（480/480，含新增 2 例）

## 2026-08-12

- **类别**：修复
- **范围**：`src/features/workshop/ProductionScheduling/index.tsx`（路由 `/order-scheduling` 订单排产页）
- **摘要**：适配暗黑模式：页面根容器、标题区、搜索区、摘要卡、操作条、表格区、分页条、Modal 及表单 label 的硬编码浅色 Tailwind 类（bg-white、text-slate-*、border-slate-*、ring-white 等）全部补充 `dark:` 变体；Modal header 硬编码颜色 `#f1f5f9/#fafbfc/#ffffff` 改用 `theme.useToken()` 的 `colorBgElevated`/`colorBorderSecondary`/`colorFillQuaternary`，随主题自动切换
- **验证**：`bun run typecheck` 通过；`bun run test` 478 个测试全部通过

## 2026-08-12

- **类别**：文档
- **范围**：`docs/性能与代码规范优化清单.md`
- **摘要**：使用规则新增第 6 条：修复完一个问题并验证通过后，须停下向用户汇报，经用户确认后才能开始修复下一个问题，禁止连续批量修复多个问题
- **验证**：纯文档文本调整，无代码验证

## 2026-08-12

- **类别**：性能 / 数据库
- **范围**：`supabase/migrations/20260812090000_add_production_scheduling_aggregate_views.sql`（新增）、`src/services/apiProductionScheduling.ts`、`src/services/database.types.ts`（重新生成）、`src/services/apiExtrusionProductions.ts`
- **摘要**：优化清单 #2 落地：新增聚合视图 `v_production_quantity_by_project`（production_order_items 按 project_no SUM qualified_quantity）与 `v_material_transfer_summary_by_project`（material_transfers 按 project_no 统计条数/总量/最近转移时间与车间，latest_workshop 取最近 created_at 子查询），migration 已应用；`fetchProductionQuantities`/`fetchTransferSummaries` 改为查询视图（每个 project_no 一行聚合结果，去掉原 1000 行/页循环拉取 + JS 求和），`fetchProcessStandardCapacityRows` 保留（按 model 过滤小查询）；`bun run db:types` 重新生成类型。连带修复 `apiExtrusionProductions.ts`：其 `SupabaseTableClient = ReturnType<typeof supabase.from>` 会解析到 `from` 的 Views 重载，新增视图（无 id 列）破坏了原视图集公共键交集导致 `.eq('id', id)` 报 never 类型错误——改为直接类型化 `supabase.from('extrusion_productions')`（表本就在 database.types.ts 中）
- **验证**：`bun run typecheck` 通过（EXIT 0）；`bun run test` 全量通过（478/478）；视图 SQL 实测返回正确聚合数据

## 2026-08-12

- **类别**：规范
- **范围**：`src/utils/excelUtils.ts`、`src/services/apiPrecisionFinishingCuttings.ts`、`src/services/apiPrecisionCuttingTransfers.ts`、`src/services/youmaiOptions.ts`、`src/services/toolingDataOptions.ts`、`src/services/apiPackagingWorkOrders.ts`
- **摘要**：优化清单 #15 落地：消除 10 处 `any` 类型断言/注解。(1) excelUtils 用局部变量 `specInferred` 替代 `(excelData as any)` 中间标记（2 处）；(2) 两个 precision 表名确认在 database.types.ts 中，`(supabase as any).from(...)` 直接改为类型化 `supabase.from(...)`（2 处，顺带消除了原本会推断为"所有表 Row 联合"的逃生舱写法）；(3) youmaiOptions/toolingDataOptions 的 `initialQuery: any` 改为最小结构接口 `OptionsQueryBuilder`（声明 or/order/limit/abortSignal 链式方法 + PromiseLike<{data,error}> 结果形态，4 处）；(4) apiPackagingWorkOrders 的 `Promise<any>` RPC 泛型化 `rpc<TData>`（新增 `PackagingWorkOrderBatchRow` 类型）、`(item: any)` 改为 `PackagingWorkOrderExportRow` 行类型（2 处）
- **验证**：`bun run typecheck` 通过（EXIT 0）；`bun run test` 全量通过（478/478）

## 2026-08-12

- **类别**：性能 / 规范
- **范围**：`src/contexts/PermissionProvider.tsx`、`src/features/workshop/ProductionScheduling/index.tsx`、`src/features/production-order/index.tsx`、`src/services/apiSyneySpecs.ts`
- **摘要**：优化清单 #16、#19 落地：(1) 3 处内联 staleTime 的 useQuery 统一改用 queryConfig 预设——权限查询改 `queryConfig.detail`（10min）、排产页员工全量映射改 `queryConfig.detail`、员工端"今日是否已录工单"检查改 `queryConfig.realtime` 并显式 `refetchInterval: undefined`（保留 staleTime:0 挂载即最新语义、不引入 30s 轮询，创建工单后已有 invalidate 联动）；(2) 删除 `apiSyneySpecs.ts:62` 注释残留 `// console.log(newSyneySpec);`。复查确认 #18 为误报（ReportForm/ReportList 的 4 处 console.error 均已配套 message 提示），未改动
- **验证**：`bun run test` 全量通过（478/478）；`bun run typecheck` 通过

## 2026-08-12

- **类别**：文档
- **范围**：`docs/性能与代码规范优化清单.md`（新增）
- **摘要**：新增性能与代码规范优化跟踪清单：汇总此前调研发现的 19 项问题（P0-P3 性能项 14 项 + 规范项 5 项，含文件位置与优化建议），并写入使用规则——修复问题时携带本文档、完成一项勾一项（`[ ]`→`[x]`）、同步更新 CHANGELOG.MD；#1（dashboard 岗位行缓存化）已勾选完成
- **验证**：纯文档新增，无代码改动

## 2026-08-12

- **类别**：性能 / 变更
- **范围**：`src/services/apiOrderStatusDashboard.ts`、`src/features/workshop/OrderStatusDashboard/useOrderStatusDashboard.ts`（含新增 vitest）、`src/features/workshop/StandardTimeList/useStandardTimes.ts`（含新增 vitest）、`src/services/apiOrderStatusDashboard.vitest.ts`
- **摘要**：订单现状仪表盘岗位行（process_standards 全表，现 1387 行/1000 行每页循环拉取）缓存优化：新增 `useProcessStandardJobRows()`，以 `['process-standards', 'job-rows']` 为 queryKey + `queryConfig.static`（1h staleTime），上提至 hook 层由 React Query 缓存，`getOrderStatusDashboard` 增加可选 `processRows` 参数（传入时跳过内部全表查询），dashboard 查询以 `enabled: processRows !== undefined` 等待岗位行就绪——翻页/改筛选不再重复拉取岗位行；为保证数据更新后缓存立即刷新，`useCreateStandardTime`/`useDeleteStandardTimes` 的 invalidateQueries 补充 `['process-standards']` 前缀（与既有 update/末道标记一致，前缀命中 job-rows 缓存立即重拉），编辑/新增/删除/末道标记后仪表盘岗位列即时重算，无需等 staleTime 过期
- **验证**：`bun run test` 全量通过（466/466）；`bun run typecheck` 通过

## 2026-08-12

- **类别**：修复
- **范围**：`src/features/workshop/StandardTimeList/`（index.tsx、StandardTimeTable.tsx、StandardTimeCostDetail.tsx、StandardTimeSearch.tsx、StandardTimeMobileList.tsx、StandardTimeForm.tsx）
- **摘要**：standard-time-list 成本核算页面补齐暗黑模式适配：所有硬编码浅色 Tailwind 类（容器 bg-white/bg-slate-50、边框 border-slate-200、文字 text-slate-500~900、彩色强调 text-*-600）按项目惯例追加 `dark:` 变体——容器 `dark:border-slate-700 dark:bg-slate-800`、正文 `dark:text-slate-300`、标题 `dark:text-slate-100`、徽章 `dark:bg-slate-600/700`、彩色文字 `dark:text-*-400`、彩色渐变卡 `dark:from-*-500/10` 等；覆盖管理端（表格+成本详情+表单）与班组长移动端（筛选面板+卡片列表）。表格行高亮/警示背景由 index.css 的 CSS 变量自动适配，未改动
- **验证**：`bun run typecheck` 通过；全目录 grep 确认无遗漏浅色类；未跑全量测试（纯样式类名改动，无逻辑变更）

## 2026-08-12

- **类别**：变更
- **范围**：`src/features/workshop/OrderStatusDashboard/dashboardRenderUtils.tsx`（renderJobOutputCell）、`src/features/workshop/OrderStatusDashboard/dashboardRenderUtils.test.tsx`（新增）
- **摘要**：订单现状主列表工序列单元格补齐"非末道工序有数据时可点击查看"：主列表数字口径保持不变（jobOutputs 仅累加末道工序合格数量，非末道本就显示 '-'）；本次在 quantity<=0 但有生产明细（productionDetails 存在该岗位记录）时，单元格由 '-' 改为可点击"查看"链接，打开现有岗位生产工单明细弹窗（含非末道工序汇总与明细）；无任何明细时仍显示 '-'。不涉及服务层聚合逻辑、列集、路由与导出
- **验证**：`bun run test -- dashboardRenderUtils` 新增 4 条用例通过（- / 查看链接 / 纯数字 / 可点数字）；`bun run test` 全量通过；`bun run typecheck` 通过

## 2026-08-12

- **类别**：重构 / 修改
- **范围**：`src/features/syney/SafePartSetting/SafePartSettingPage.tsx`、`src/features/packaging-process/WorkOrderList/useWorkOrders.ts`、`src/features/packaging-process/StandardTimeList/useStandardTimes.ts`
- **摘要**：收尾遗留优化项：(1) SafePartSettingPage 的 3 个裸 useMutation（保存/删除/图纸上传）迁移到 useMutationWithMessage——复用 App.useApp() 的 messageApi，成功提示/错误提示/缓存失效统一由共享 hook 处理，移除手写 message 与 invalidate 样板及 useMutation/useQueryClient 依赖；(2) packaging 两个"生产号选项"查询键统一为 ['process-standards', 'project-nos']，与 workshop 共享同一缓存，消除同接口（getSalesOrdersProjectNos）跨域重复请求，workshop 侧失效可联动刷新
- **验证**：`bun run typecheck` 通过；`bun run test` 463/463 通过；eslint 改动文件 0 错误
## 2026-08-12

- **类别**：重构 / 修改
- **范围**：`src/features/workshop/OrderStatusDashboard/`（index.tsx 拆分 + 新增 dashboardRenderUtils.tsx / ProductionDetailModal.tsx / TransferDetailModal.tsx / PrecisionCuttingDetailModal.tsx / ExtrusionDetailModal.tsx）、`package.json`、`AGENTS.md`
- **摘要**：执行第四周期：(1) OrderStatusDashboard 2741 行巨型组件拆分——4 个明细弹窗（生产/物料转移/精切/挤压，共 ~1080 行）拆为独立文件，共享渲染基础设施（render helpers、密集表格组件、类型、VIEWER 隐藏列常量）收拢到 dashboardRenderUtils.tsx，主组件 index.tsx 降至 ~1150 行，消除循环依赖；(2) 依赖清单瘦身——@tanstack/react-query-devtools（DEV 条件渲染）与 supabase CLI 从 dependencies 移至 devDependencies；react-icons 与双 QR 库经核查用途真实（4 处 BiScan 图标 / 扫码 vs 生成），保留；(3) 经用户决策，AGENTS.md 废除接口 I 前缀要求（与 ~230 个无前缀接口现状对齐，legacy syney 8 个 I 前缀接口保留为历史命名）
- **验证**：`bun run typecheck` 通过；`bun run test` 463/463 通过；eslint 拆分文件 0 错误（13 个 fast-refresh 警告与拆分前一致，非新增问题）
## 2026-08-12

- **类别**：重构
- **范围**：`src/services/functionInvokeHelpers.ts`（新增）、`apiSyneyStoreReports.ts`、`apiYoumaiPurchaseOrder.ts`、`apiEmployees.ts`、`apiAdminManagementPassword.ts`、`apiProductionOrderExport.ts`、`src/features/syney/useSyneySafePartSettings.ts`（新增）、`PoList/index.tsx`、`PoList/useExportSafePartInfoAsExcel.ts`、`SafePartSetting/SafePartSettingPage.tsx`、`src/utils/helps.ts`、`utils/pdfUtils.ts`、`syney/ReportList/ReportTable.tsx`、`syney/ReportDetail/DetailTable.tsx`
- **摘要**：执行第三周期"一致性"：(1) 新建共享 hook useSyneySafePartSettings（queryConfig.static 1h 缓存 + 常量键），替换 3 处重复的 syney_safe_part_settings 裸 useQuery（原 5min/5min/30s 三种配置），设置变更仍由 SafePartSettingPage 的 invalidate 驱动刷新；(2) 新建 functionInvokeHelpers.ts 收拢 5 个服务文件重复的 Edge Function 错误提取（extractFunctionInvokeErrorMessage 合并 JSON body.error + 401/403/404 状态码映射，401 文案参数化）、withTimeout、getFunctionRegion；(3) helps.ts 的 formatNumber 改名 formatNumberPadded（消除与 format.ts 展示版 formatNumber 的同名不同义），更新 3 个调用文件
- **验证**：`bun run typecheck` 通过；`bun run test` 463/463 通过；eslint 改动文件 0 错误
## 2026-08-12

- **类别**：删除（数据库）
- **范围**：`supabase` 远程库（notifications 表、3 个触发器、3 个函数、realtime publication、权限种子数据）、`docs/sql-drafts/20260812_cleanup_notifications.sql`、`src/services/database.types.ts`
- **摘要**：经用户 3 次确认后清理通知功能数据库残留：从 supabase_realtime publication 移除 notifications；删除 create_notification_for_production_order / create_notification_for_material_transfer / sync_notification_read_at 三个触发器与函数；DROP notifications 表（级联 RLS 策略与索引）；删除 permissions 中 feature:admin-notifications.view 行及 role_permissions 的 admin 关联。清理脚本保留在 docs/sql-drafts/ 备查
- **验证**：数据库核对全部为 0（表/触发器/函数/权限行/角色关联/realtime 成员）；`bun run db:types` 重新生成类型（notifications 残留 0）；`bun run typecheck` 通过
## 2026-08-12

- **类别**：删除 / 修改
- **范围**：`src/services/apiNotifications.ts`（删除）、`src/hooks/useAdminNotifications.ts`（删除）、`src/ui/AppHeader.tsx`、`src/config/permissionRegistry.ts`
- **摘要**：应业务要求整体移除管理端通知功能：删除通知服务层与 hooks（含 30s 轮询查询、postgres_changes realtime 订阅、已读/全部已读 mutation）；AppHeader 移除通知铃按钮、Popover 通知列表、realtime 系统弹窗及 NotificationItem 组件；permissionRegistry 移除 `feature:admin-notifications.view` 权限注册。数据库 notifications 表与历史 migration 种子数据保留（已执行迁移不改动，前端不再引用）
- **验证**：`bun run typecheck` 通过；`bun run test` 463/463 通过
## 2026-08-12

- **类别**：重构 / 修改
- **范围**：`src/hooks/useAdminNotifications.ts`、`src/features/workshop/StandardTimeList/useStandardTimes.ts`、`src/features/packaging-process/WorkOrderList/useWorkOrders.ts`、`src/features/packaging-process/StandardTimeList/useStandardTimes.ts`
- **摘要**：执行第二周期"网络瘦身"：(1) 通知双通道合一——管理端通知查询从 30s 轮询（queryConfig.realtime）改为 queryConfig.detail，由 realtime postgres_changes 通道的 invalidate 驱动刷新，消除 App 常驻期间每 30s 2 个冗余请求；(2) 三个"生产号选项"查询（workshop/packaging 标准工时、包装工单）从 30s 轮询降级为 queryConfig.list + refetchOnMount: 'always'，仅在表单打开时刷新，常驻页面不再轮询；(3) keep-alive 隐藏页轮询问题随前两项降级消除（剩余轮询仅存于员工手机端生产工单视图，为合理实时业务场景，且不走 keep-alive 布局）
- **验证**：`bun run typecheck` 通过；`bun run test` 463/463 通过
## 2026-08-12

- **类别**：重构 / 删除 / 修复
- **范围**：`src/pages/`（删除 10 个未引用页面组件）、`src/routes/lazyPages.ts`、`src/ui/AppHeader.tsx`、`src/store/index.ts`、`src/features/syney/`（PoList / ReportList / PoDetail）、`src/hooks/useMutationWithMessage.ts`、`useMutationWithInvalidation.ts`
- **摘要**：执行第一周期优化：(1) 删除 10 个无引用页面组件（EmployeeList/StandardTimeList/SyneyPoList/SyneyPoDetail/SyneySpecList/SyneyStoreReportList/SyneyStoreReportDetail/WorkshopOrderList/ComingSoonPage/WorkshopOrderClosed）及 lazyPages 中 3 个未路由导出，缩小打包体积；(2) AppHeader 退出登录失败时弹出错误提示（原为空 catch 吞错）；(3) 移除全局 Zustand isLoading 标志，PoList/ReportList/PoDetail 改为组件本地 state + 回调通知，消除跨页串扰；(4) useMutationWithInvalidation 改为 useMutationWithMessage 薄包装（新增 showErrorMessage 参数），统一 mutation 单一实现
- **验证**：`bun run typecheck` 通过；`bun run test` 通过
## 2026-08-12

- **类别**：变更
- **范围**：`src/features/syney/PoList/shippingListExcelDocument.ts`、`shippingListExcelDocument.vitest.ts`
- **摘要**：发货清单标题日期由导出当天改为导出日期往后一天（如 8.12 导出 → 标题"8.13发货清单"），文件名仍用当天日期。
- **验证**：`bun run test`（shippingListExcelDocument 2 用例通过）；`bun run typecheck` 通过。

## 2026-08-12

- **类别**：修复
- **范围**：`src/features/syney/PoList/shippingListExcelDocument.ts`、`shippingListExcelDocument.vitest.ts`
- **摘要**：修复导出发货清单时工艺等空字段显示字面 `null`：数据库 null 经 `getSelectedPosWithItems` 的 key 模板字符串拼接后变成字符串 `"null"`，现于导出层统一归一化为空字符串（`null`/`undefined`/`"null"` 均转空）。
- **验证**：`bun run test`（shippingListExcelDocument 2 用例通过，含 `"null"` 归一化场景）；`bun run typecheck` 通过。

## 2026-08-12

- **类别**：新建
- **范围**：`src/features/syney/PoList/`（`shippingListExcelDocument.ts`、`useExportShippingListAsExcel.ts`、`ExportShippingListButton.tsx`、`index.tsx`、`shippingListExcelDocument.vitest.ts`、`lazyDocumentModules.vitest.ts`）
- **摘要**：西尼订单列表页新增"导出发货清单"功能：勾选订单后导出 Excel（标题行 `{M.D}发货清单` + 表头 序号/采购单号/生产编号/送货单号/商标/规格/工艺/备注），字段映射自选中订单（No/SONo/Brand/Spec/Technique/Remark），送货单号列留空由用户导出后自行填写；宋体边框样式、自动列宽、冻结前两行、工艺/备注列自动换行；按钮复用 `feature:syney-po-list.export` 权限，Excel 模块动态加载（lazy import + hover 预加载），导出成功清空选中。
- **验证**：`bun run typecheck` 通过；`bun run test` 通过（新增 shippingListExcelDocument 2 个用例 + lazyDocumentModules 断言更新）。

## 2026-08-12

- **类别**：修复
- **范围**：`src/features/syney/`（SpecList、PoList、PoDetail、ReportList、ReportDetail、SafePartSetting 全部组件）
- **摘要**：西尼模块暗黑模式适配：为表格（表头/行悬停/合计行）、筛选/搜索栏、状态徽章（slate/rose/amber/emerald/pink）、链接、图标与文字颜色补充 `dark:` Tailwind 变体（深色背景 slate-800/900 系、深色边框、浅色文字），遵循模块既有约定；`ExcelUpload.tsx` 警告 Alert 的硬编码 `#fffbe6`/`#faad14` 改为 antd 主题 token（`colorWarningBg`/`colorWarningBorder`），随暗黑算法自动切换。
- **验证**：`bun run typecheck` 通过；`bun run test` 105 个文件 / 460 个用例全部通过（首次运行存在 1 个 packaging-process 异步用例偶发失败，复跑与隔离运行均通过，判定为 flaky 与本次改动无关）；`eslint` 检查通过。

## 2026-08-11

- **类别**：修复
- **范围**：`src/ui/Loading.tsx`
- **摘要**：修复暗黑模式下加载画面出现黑色小方块：原实现用 Spin 嵌套模式包裹空 div，antd 会在容器上叠加 `colorBgContainer` 背景遮罩（spinning 时 opacity 0.4），暗色算法下呈近黑色块。改为非嵌套 `<Spin size="large" description="加载中..." />`（antd 6 已用 `description` 取代 `tip`），消除遮罩。
- **验证**：`bun run typecheck` 通过；浏览器暗黑模式实测加载画面无黑色方块。

## 2026-08-11

- **类别**：修复
- **范围**：`src/features/precision-cutting-transfer/MaterialTransferForm.tsx`
- **摘要**：精切转移单添加/编辑表单适配暗黑模式：各 section 卡片、外协信息卡片、数量差异只读字段、底部操作栏补充 `dark:` 变体（slate 深色背景/边框、amber/red 深色主题色、文字颜色），与模块内表格/详情页暗色约定一致。
- **验证**：`bun run typecheck` 通过。

## 2026-08-11

- **类别**：变更
- **范围**：AI 工具链配置：`opencode.jsonc`；新增 `.opencode/ponytail/`（`.opencode/plugins/`、`hooks/`、`skills/`）
- **摘要**：安装 Ponytail skill（[DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail)，让 AI agent 按"最懒资深工程师"模式写最小代码：YAGNI → 复用现有 → 标准库 → 原生平台能力 → 已装依赖 → 一行 → 最小可用；同时注册 `/ponytail lite|full|ultra|off`、`/ponytail-review`、`/ponytail-audit`、`/ponytail-debt`、`/ponytail-gain`、`/ponytail-help` 命令并注入 6 个 skill）。采用本地 checkout 方式：复制仓库 `.opencode/`、`hooks/`、`skills/` 到 `.opencode/ponytail/`（保持相对结构），`opencode.jsonc` 新增 `"plugin": ["./.opencode/ponytail/.opencode/plugins/ponytail.mjs"]`，由插件在每次对话注入规则集并注册命令，无需 npm 依赖。默认强度 `full`。
- **验证**：`node --check` 通过全部插件/hook JS 文件；node 直接 require `ponytail-config`/`ponytail-instructions` 验证默认模式 `full` 与指令生成（含 ladder/YAGNI）；`parseCommandFile` 解析全部 6 个命令文件 OK。

## 2026-08-11

- **类别**：修复
- **范围**：物料转移单模块：`src/features/material-transfer/MaterialTransferForm.tsx`
- **摘要**：修复物料转移单添加/编辑表单暗黑模式适配：① 表单分区卡片 `sectionClassName` 补 `dark:border-slate-700 dark:bg-slate-800/90`；② 分区标题 `sectionTitleClassName` 补 `dark:text-slate-200`；③ 底部固定操作栏 Form.Item 补 `dark:border-slate-700 dark:bg-slate-900/95`。修复前卡片/标题/操作栏为硬编码浅色（`bg-white/90`、`text-slate-700`、`border-slate-100`），暗黑模式下与黑色输入框混搭、对比度不足。
- **验证**：`bun run typecheck` 通过（`tsc -b` 无错误）；grep 确认该文件无剩余缺少 dark 变体的浅色硬编码类。

## 2026-08-11

- **类别**：变更
- **范围**：生产工单模块桌面端：`src/features/production-order/{index.tsx, ProductionOrderList.tsx}`；删除 `ProductionOrderInlineDetail.tsx`；测试 `index.vitest.tsx`、`src/utils/keyboardTableIntegration.vitest.ts`
- **摘要**：取消生产工单页面"点击表格行查看工单详情"功能：① index.tsx 移除行点击相关状态（`activeRecordId`/`activeRecord`/`handleRowClick`）、搜索/重置时清理逻辑与失效校验 effect，移除 `Splitter` 上下分栏布局及底部 `ProductionOrderInlineDetail` 详情面板，表格容器改为占满剩余高度；② ProductionOrderList.tsx 移除 `onRowClick`/`activeRowId` props、`handleRow` 行点击绑定与 `createKeyboardTableRowProps` 引用；③ 删除不再使用的 `ProductionOrderInlineDetail.tsx` 组件文件，并同步移除测试中对应 mock；④ `keyboardTableIntegration.vitest.ts` 将 ProductionOrderList 移出交互式表格清单（该表格已无行点击交互）。"眼睛"图标查看详情（弹窗）不受影响。
- **验证**：`bun run typecheck` 通过（`tsc -b` 无错误）；`bun run test` 通过。

## 2026-08-11

- **类别**：修复
- **范围**：生产工单模块移动端列表/表单 5 个组件：`src/features/production-order/{ProductionOrderMobileList,ProductionOrderItemMobileList,ProductionOrderItemForm,projectNoSelect,ProjectNoScanButton}.tsx`；另补充桌面端 `ProductionOrderDetail.tsx` 备注行、移动端 `MobileProductionOrderDetailPage.tsx` 工序明细标题区、`ProductionOrderInlineDetail.tsx` 备注 Card 边框的遗漏项
- **摘要**：修复生产工单移动端列表/表单暗黑模式适配：① MobileList 未选中卡片补 `dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100`，信息行 `bg-black/5` 补 `dark:bg-white/10`（选中深色卡片保持不动）；② ItemMobileList 卡片补 `dark:border-slate-700 dark:bg-slate-800`、7 处标签 `dark:text-slate-500`、10 处数值 `dark:text-slate-100`、6 处信息行 `dark:bg-slate-800`；③ ItemForm 红色警示框补 `dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400`、提示条补 `dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300`；④ projectNoSelect 文字补 `dark:text-slate-200/400`；⑤ ProjectNoScanButton 深色容器仅补 `dark:border-slate-700`、提示条补 `dark:bg-slate-800 dark:text-slate-300`；另修复扫描验证发现的 3 处遗漏（Detail 备注行 `dark:bg-slate-800`、DetailPage 工序明细标题 `dark:text-slate-500/100`、InlineDetail 备注 Card `dark:border-slate-700`）。未改动已带 `dark:` 的行、深色选中卡片、antd 内部主题。
- **验证**：`bun run typecheck` 通过（`tsc -b` 无错误）；grep 全模块扫描确认两模块无缺少 dark 变体的浅色残留类、无重复 `dark:` 类。

## 2026-08-11

- **类别**：修复
- **范围**：生产工单模块桌面端 6 个组件：`src/features/production-order/{index,ProductionOrderList,ProductionOrderItemTable,ProductionOrderForm,ProductionOrderDetail,ProductionOrderSearch}.tsx`
- **摘要**：修复生产工单桌面页面暗黑模式适配：为硬编码浅色 Tailwind 类追加 `dark:` 变体（遵循优迈模块既有约定）——① index.tsx 页面标题区渐变容器、搜索区/统计条/表格容器/分页条卡片补 `dark:border-slate-700/80 dark:bg-slate-800 dark:shadow-none` 与渐变 `dark:from-slate-800 dark:via-slate-800 dark:to-slate-800`，工具按钮（修改密码/锁定/批量审核/批量反审核）补 `dark:text-slate-400 dark:hover:bg-slate-700` 等 hover 变体，分隔线 `dark:bg-slate-700`，图标与弱标签 `dark:text-slate-400/500`；② ProductionOrderList 斑马 badge（白班/夜班）补 `dark:bg-amber-900/30 dark:text-amber-300` / `dark:bg-indigo-900/30 dark:text-indigo-300`，数值列 `dark:text-emerald-400`/`dark:text-blue-400`/`dark:text-red-400`，选中行 `dark:bg-blue-900/30`、hover 行 `dark:hover:bg-slate-700/60`，查看按钮 `dark:text-slate-500 dark:hover:bg-blue-900/30 dark:hover:text-blue-300`；③ ItemTable 弱标签 `dark:text-slate-500`；④ Form 分区卡片补 `dark:border-slate-700 dark:bg-slate-800 dark:shadow-none`，6 个信息行补 `dark:bg-slate-800`、标签 `dark:text-slate-500`、数值 `dark:text-slate-100`，外协警告框补 `dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400`；⑤ Detail 与 Form 相同模式；⑥ Search 重置按钮/移动端展开按钮补 `dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300` 及 hover/active 变体，禁用操作人 Input 补 `dark:bg-slate-800`。antd 内部主题（Card/Table/Form 表面）由 darkAlgorithm 自动适配，未改动；未改动已带 `dark:` 的行与彩色主按钮。
- **验证**：`bun run typecheck` 通过（`tsc -b` 无错误）。

## 2026-08-11

- **类别**：修复
- **范围**：生产日报表模块（路由 `/production-daily-report`）：`src/features/production-report/{index.tsx, ProductionDailyReportTable.tsx, ProductionDailyReportSearch.tsx, ProductionDailyReportMobileList.tsx}`
- **摘要**：修复生产日报表模块暗黑模式适配：为硬编码浅色 Tailwind 类补充 `dark:` 变体（遵循优迈模块既有约定）——① 导出按钮、筛选容器（index.tsx）补 `dark:border-slate-700/dark:bg-slate-800` 等；② Table 合格率/数据类别 tone 与 dot 字符串字面量补 `dark:bg-*-900/30 dark:text-*-300` / `dark:bg-*-400`、徽章容器补 `dark:shadow-none`、12 处 `text-slate-700 tabular-nums` 文本单元格补 `dark:text-slate-300`、合格/不良数值补 `dark:text-emerald-400` / `dark:text-rose-400`；③ Search 移动端展开按钮补 `dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300`；④ MobileList 卡片、tiles（`dark:bg-slate-800/50`）、标签、数值、工序/工时徽章、空状态渐变全部补 `dark:` 变体。未改动已带 `dark:` 的行（index.tsx 选中汇总条 L312-378、Table 汇总行）与 antd 内部主题（由 darkAlgorithm 自动适配）；Excel 导出（utils/productionDailyReportExcel*）保持颜色中性，未改动。
- **验证**：`bun run typecheck` 通过；grep 确认 4 个文件无缺少 dark 变体的目标浅色类残留（tone 字面量 6/6、`text-slate-700 tabular-nums` 12/12、tiles 11/11、labels 11/11、`text-slate-900` 10/10 均含 dark 变体，无重复 `dark:`）。

## 2026-08-11

- **类别**：修复
- **范围**：生产工单模块 6 个移动端/内联组件：`src/features/production-order/{MobileScanHubPage,MobileProductionOrderScanPage,MobileProductionOrderEditPage,MobileProductionOrderDetailPage,MobileProductionOrderCreatePage,ProductionOrderInlineDetail}.tsx`
- **摘要**：修复生产工单移动端页面暗黑模式不适配问题：为所有硬编码浅色 Tailwind 类追加 `dark:` 变体——页面卡片/分区容器补 `dark:border-slate-700/80 dark:bg-slate-900/90`，信息行补 `dark:border-slate-700 dark:bg-slate-800/60`，固定底部栏补 `dark:border-slate-700 dark:bg-slate-900/95`，主文字 `dark:text-slate-100`、次级 `dark:text-slate-300/400`、弱标签 `dark:text-slate-500`，步骤圆点 `dark:bg-slate-600`，徽章（蓝/绿/黄/靛/玫瑰/灰）补对应 `dark:bg-*-900/30 dark:text-*-300/400`，antd Card 仅补 `dark:border-slate-700` 与更暗阴影、Select/Input 补 `dark:border-slate-700`；内联详情卡补渐变 `dark:from-slate-800 dark:to-slate-800` 与 hover 变体。未改动效率计算/图表颜色（efficiencyColor）等业务逻辑。
- **验证**：`bun run typecheck` 通过（`tsc -b` 无错误）。

## 2026-08-11

- **类别**：修复
- **范围**：刀具与劳保模块：`src/features/tooling/{ToolingData,ToolingInventory,ToolingStockIn,ToolingStockOut}/` 与 `src/features/labor-protection/{LaborProtectionData,LaborProtectionRequisition}/` 全部页面组件，及共享组件 `src/ui/mobile/MobileBottomSelectSheet.tsx`
- **摘要**：修复刀具与劳保模块暗黑模式不适配问题（两模块此前 0 个 `dark:` 变体）：① 6 个 Table 斑马纹 `rowClassName` 由硬编码 `'bg-white' : 'bg-slate-50/60'` 补充 `dark:bg-slate-800` / `dark:bg-slate-800/60` 变体；② 3 个刀具表单"刀具信息"面板容器补 `dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300`、15 处字段标签补 `dark:text-slate-500`，库存表待入库/待出库数字补 `dark:text-slate-500`；③ bottom-sheet 选择按钮（ToolingStockOutForm、LaborProtectionRequisitionForm）补 `dark:border-slate-700/stone-700 dark:bg-slate-800/stone-800 dark:text-slate-100`；④ 6 个页面"搜索："标签补 `dark:text-slate-400`；⑤ 2 个公开 H5 扫码页（刀具出库登记、劳保领用登记）背景渐变、卡片、徽章、说明框、底部栏全部补 `dark:` 变体；⑥ 共享组件 MobileBottomSelectSheet 选项按钮与描述文字补 dark 变体。打印海报/出库单（usePrint*）为打印输出保持浅色属设计意图，未改动。
- **验证**：`bun run typecheck` 通过；`bun run test` 通过（105 文件 / 461 用例）；grep 确认两模块源码无缺少 dark 变体的浅色残留类。

## 2026-08-11

- **类别**：修复
- **范围**：优迈 4 个模块：`src/features/youmai/{ProductData,FinishedGoodsInventory,FinishedGoodsStockIn,FinishedGoodsStockOut}/`（货品资料 / 成品库存 / 成品入库 / 成品出库）
- **摘要**：修复上述模块暗黑模式下内容区表格/物料信息面板仍为白色背景的问题：4 个 Table 组件（`YoumaiProductDataTable.tsx`、`YoumaiFinishedGoodsInventoryTable.tsx`、`YoumaiFinishedGoodsStockInTable.tsx`、`YoumaiFinishedGoodsStockOutTable.tsx`）的斑马纹 `rowClassName` 由硬编码 `'bg-white' : 'bg-slate-50/60'` 补充 `dark:bg-slate-800` / `dark:bg-slate-800/60` 变体，暗色下不再覆盖 antd 深色行背景；3 个表单内"物料信息"面板（`YoumaiFinishedGoodsInventoryForm.tsx`、`YoumaiFinishedGoodsStockInForm.tsx`、`YoumaiFinishedGoodsStockOutForm.tsx`）的 `bg-slate-50` 补充 `dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700`，与 RawMaterial 系列既有暗色样式一致。
- **验证**：`bun run typecheck` 通过；`bun run test` 通过（105 文件 / 461 用例）。

## 2026-08-10

- **类别**：修复
- **范围**：`src/features/workshop/OrderStatusDashboard/index.tsx`（订单现状页面，路由 `/production-scheduling`）
- **摘要**：修复订单现状页面暗黑模式适配：标题区、状态 Tabs、搜索区、表格区、分页区等所有硬编码浅色 Tailwind 类补充 `dark:` 变体（容器 `dark:bg-slate-800/*` + `dark:border-slate-700/*`，标题文字 `dark:text-slate-100/200`，次级文字 `dark:text-slate-400/500`）；统计胶囊（订单/岗位/明细/转移及四个明细弹窗内的各色胶囊）补 `dark:bg-*-900/30 dark:ring-*-900/50` 与 `dark:text-*-200/300`；搜索输入框/DatePicker/Select 显式浅色覆盖补 `dark:!bg-slate-900/60` 等，不再覆盖 antd 暗色主题；表格状态行（延期/预警）补 `dark:bg-*-950/30`；表头文字补 `dark:text-slate-400`；四个明细 Modal 的 header 渐变（`from-slate-50 to-white`）、统计摘要条、表容器全部补 dark 变体；同时清理 replaceAll 误生成的非法类 `dark:bg-slate-800/80/60` 与重复 `dark:` 类。
- **验证**：`bun run typecheck` 通过；`bun run build` 通过；浏览器暗色模式实测主页面与明细弹窗均无浅色残留、文字对比正常。

## 2026-08-10

- **类别**：修复
- **范围**：8 个页面的选中汇总条：`src/features/material-transfer/index.tsx`、`precision-cutting-transfer/index.tsx`、`production-report/index.tsx`、`syney/{SpecList,SafePartSetting,ReportList,PoList,ReportDetail}/index.tsx`(SafePartSetting 为 SafePartSettingPage.tsx)
- **摘要**：修复选中数据后"已选 X 条 / 合计"汇总条在暗黑模式下背景仍为浅蓝渐变、文字对比度不足看不清的问题：汇总条容器补充 `dark:border-blue-900/50 dark:from-blue-950/60 dark:via-indigo-950/60 dark:to-blue-950/60`，图标底块补 `dark:bg-*-900/40`，文字/数字补 `dark:text-slate-300` / `dark:text-blue-400` / `dark:text-rose-400` / `dark:text-emerald-400` / `dark:text-amber-400`。
- **验证**：浏览器（暗色模式）实测选中行后汇总条背景变为深蓝、文字清晰可读；`bun run typecheck` 待跑（见汇报）。

## 2026-08-10

- **类别**：修复
- **范围**：`src/index.css` 及 11 个表格组件（`syney/*`、`workshop/*`、`material-transfer`、`precision-cutting-transfer`、`precision-finishing-cutting`、`extrusion-production`）
- **摘要**：全局修复表格 active 行高亮在暗黑模式下显示浅色的硬编码问题：在 `index.css` 新增 `--table-active-row-bg` / `--table-active-row-bg-alt` / `--table-warning-row-bg` 三个 CSS 变量（浅色为原值，`.dark` 下切换为 `#172554` 深蓝，与 antd 暗色 `rowSelectedBg` 一致），11 处表格内联样式中的 `#f0f7ff` / `#e6f4ff` / `#fffbeb` 全部替换为 `var()` 引用。
- **验证**：`bun run typecheck` 通过；`bun run test` 全量通过（105 files / 461 tests）；grep 确认源码无残留硬编码颜色。

## 2026-08-10

- **类别**：修复
- **范围**：`src/features/precision-cutting-transfer/MaterialTransferTable.tsx`
- **摘要**：修复精切转移单表格在暗黑模式下"当前页合计"汇总行显示白色的问题：`Table.Summary.Row` 背景 `bg-slate-50` 补充 `dark:bg-slate-800/80`，合计文字/数字补充 `dark:text-slate-300/100`；同步修复该表格表头覆写类（thead 背景、边框、文字、行 hover 高亮）无 dark 变体导致暗黑模式下的浅色问题。
- **验证**：`bun run typecheck` 通过；`bun run test` 全量通过（105 files / 461 tests）。

## 2026-08-10

- **类别**：修复
- **范围**：`src/features/precision-cutting-transfer/MaterialTransferDetail.tsx`
- **摘要**：修复精切转移单详情面板（Splitter 底部面板）未适配暗色模式的问题：Header 卡片渐变背景、白底头部、审核状态徽章、Descriptions 标签与内容、空状态图标与文字均补充 `dark:` 变体（与物料转移单详情面板修复保持一致）。
- **验证**：`bun run typecheck` 通过；`bun run test -- src/features/precision-cutting-transfer` 通过。

## 2026-08-10

- **类别**：修复
- **范围**：`src/features/material-transfer/MaterialTransferDetail.tsx`
- **摘要**：修复物料转移单详情面板（Splitter 底部面板）未适配暗色模式的问题：Header 卡片渐变背景、白底头部、进度/状态区块、审核状态徽章、Descriptions 标签与内容、空状态图标与文字均补充 `dark:` 变体（`dark:bg-slate-800` 系背景、`dark:text-slate-300/400` 系文字、`dark:bg-emerald-900/40` / `dark:bg-amber-900/40` 徽章）。
- **验证**：`bun run typecheck` 通过；暗色模式视觉回归待页面级验证（详见汇报）。

## 2026-08-05

- **类别**：文档
- **范围**：`openspec/changes/`、`openspec/specs/`
- **摘要**：归档 2 个已完成的 OpenSpec change：`add-standard-time-process-fields`（16/16 任务）与 `packaging-work-order-batches`（9/9 任务），移至 `openspec/changes/archive/2026-08-05-*`；同步 delta specs 到 main specs，新增 `standard-time-process-fields`、`precision-finishing-process-export`、`packaging-work-order-batches` 3 个 capability spec。
- **验证**：`bun run spec:list` 确认 active changes 为空（归档成功）。

## 2026-08-05

- **类别**：删除
- **范围**：`ENV_SETUP.md`、`README.md`、`src/main.tsx`、`.github/copilot-instructions.md`、`.github/ai-task-matrix.md`、`.github/prompts/task-exec.prompt.md`
- **摘要**：删除 `ENV_SETUP.md`（环境变量配置唯一文档），将其核心内容（`.env` 创建步骤、Supabase 变量说明表、`SUPABASE_DB_URL` 回退说明、安全注意事项）精简合并进 `README.md` 新增"环境配置"章节，并在"相关文件"补充 `.env.example`；`src/main.tsx` 环境变量错误提示由"参考 ENV_SETUP.md"改为"参考 README.md 环境配置说明"；同步清理 3 处规则文档中的 ENV_SETUP 引用。
- **验证**：`bun run typecheck`、`bun run lint` 通过；`grep ENV_SETUP` 确认除 CHANGELOG 记录外无残留引用。

## 2026-08-05

- **类别**：删除
- **范围**：`pack/`
- **摘要**：删除 `pack/` 目录下的 Intel 芯片组驱动安装包（`SetupChipset.exe`、`InstUpd.exe`、`mup.xml`、`WEBInstall_info.xml`、`WixLicenseNote.txt`），该目录为误提交的第三方驱动文件，与项目业务无关；`git rm` 取消跟踪并删除本地文件。
- **验证**：确认目录已删除（Test-Path 为 False），未执行构建/测试（纯文件删除，无代码影响）。

## 2026-08-05

- **类别**：变更
- **范围**：`src/features/tooling-fixture/FixtureDataPage.tsx`、`FixtureRecordsPage.tsx`
- **摘要**：美化工装资料与出入记录页面的批量"删除选中"按钮 UI，改为 `type="text" danger` + Heroicons `TrashIcon`，对齐 villa-lift 模块批量删除风格；表格行内"删除"按钮保持原有 `type="link" danger` 纯文字样式不变。
- **验证**：`bun run lint`、`bun run build` 通过。

## 2026-08-05

- **类别**：修复
- **范围**：`src/features/syney/PoList/PoTable.tsx`、`src/features/precision-cutting-transfer/MaterialTransferTable.tsx`
- **摘要**：移除 PoTable"入库日期"列与 MaterialTransferTable"转移单号"列的 `defaultSortOrder: 'ascend'` 默认排序，避免列表首次加载即强制升序、与用户预期及后续排序操作冲突。
- **验证**：补记历史提交（commit e33e791、004dec4）；`bun run lint`、`bun run build` 于 2026-08-05 工装按钮美化验证时一并覆盖通过。

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
