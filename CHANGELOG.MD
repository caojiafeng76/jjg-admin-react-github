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
