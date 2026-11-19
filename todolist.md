# 前端界面风格统一 todolist（全站 83 页）

> **唯一视觉规范**：[docs/前端页面风格规范与设计指南.md](docs/前端页面风格规范与设计指南.md)
> **交互与反馈规范**：[docs/前端交互与反馈规范.md](docs/前端交互与反馈规范.md)

## 执行规则（必读）

1. **按阶段/批次推进**：每次只执行用户明确指定的阶段或子批次，**禁止自行开始下一步**。
2. **完成 → 验证 → 打勾 → 等确认**：每批完成后运行对应检查与测试，将完成项的 `[ ]` 改为 `[x]`，向用户汇报改动与验证结果，**等用户确认后再继续**。
3. **强制更新日志**：遵循 [AGENTS.md](AGENTS.md) 规则，每次实际改动记入 `CHANGELOG.MD`；业务用户可感知的视觉或交互变化同步更新 `src/pages/dashboardChangelog.ts`。

---

## Phase 0：规范文档收口 & 自动化风格守卫建基

- [x] **P0-1** 落盘唯一视觉规范 `docs/前端页面风格规范与设计指南.md`；消除 `docs/前端交互与反馈规范.md` 冲突条目；归档标注 `docs/UI设计调研与改版指南.md`、`docs/UI改版-逐页问题分析与改进方案.md`；更新 `AGENTS.md`、`src/ui/CLAUDE.md` 与 `scripts/engineering-guards.vitest.ts` 引用
- [x] **P0-2** 重置 `todolist.md` 为覆盖全站 83 个路由页的分阶段任务清单（补齐 `jintan` 14 页、`syney-materials` 5 页与移动端/公开页）
- [x] **P0-3** 新增渐进式风格守卫测试 `src/ui/uiStyleConventions.vitest.ts`（校验 `.ant-*`、`@ant-design/icons`、非 `slate` 灰阶、宋体字体、任意圆角/阴影、手写 `<svg>`、3 档外 Modal 宽度与卡片套娃）

---

## Phase 1：全局 Token、共享按钮与核心 UI 抽象（改一处惠全站）

- [x] **P1-1** 统一 `src/App.tsx` `TABLE_TOKENS` 紧凑密度分层（标准紧凑 `13px/6px/10px`，极密 `small` `12px/4px/6px`），核对 `useTableHeight` 行高测算；新增 `src/ui/tableStyles.ts` 导出暗色兼容斑马纹 `zebraRowClassName`
- [x] **P1-2** 升级共享工具栏按钮主次层级：`AddButton` 默认 `variant="primary"`（保留 `variant="text"`）；`EditButton`、`DeleteButton`、`ImportButton`、`ExportButton`、`PrintButton`、`DownloadTemplateButton` 图标配色收口到语义 Token
- [x] **P1-3** 共享基建去异味：`TableState.tsx` 与 `AppErrorView.tsx` 清理 `@ant-design/icons`；`SelectedSummaryBar.tsx` 去掉重辉光阴影改克制样式；`AppLogo.tsx` 去任意阴影；`AppLayout.tsx` 清理 `message.useMessage()`；`AppHeader.tsx` 统一图标为 `16/solid`
- [x] **P1-4** 新增 3 个高复用共享壳组件及单测：`src/ui/FilterBar.tsx`（扁平轻灰底筛选栏）、`src/ui/ExcelImportModal.tsx`（统一 Excel 导入弹窗）、`src/ui/PublicQrPageShell.tsx`（统一免登录二维码页视觉壳）

---

## Phase 2：高感知冲突域优先治理（消除“双卡套娃”与“外边距叠加”）

- [ ] **P2-A 优迈（`youmai`，7 页）**：货品资料、成品库存、成品入库、成品出库、原料库存、原料入库、原料出库 —— 去搜索白卡/蓝点标题与表格白卡套娃；改用 `FilterBar`；统一原料 3 页密度与斑马纹；工具栏排序与 `ExcelImportModal` 对齐
- [ ] **P2-B 金檀木业（`jintan`，13 个管理端页）**：配件资料/库存/入库/出库、型材资料/库存/入库/出库、素材资料/库存/入库/出库、月报（公开扫码出库页见 P4-B） —— `JintanFieldSearch` 接入 `FilterBar`；12 列表页去双白卡套娃；月报对齐 D 类报表骨架；导入接入 `ExcelImportModal`
- [ ] **P2-C 西尼材料（`syney-materials`，5 页）**：材料资料、库存、入库、出库、月报 —— 去表格白卡套娃；`SyneyMaterialsSearch` 接入 `FilterBar`；补齐标准斑马纹；导入接入 `ExcelImportModal`
- [ ] **P2-D 外边距叠加与 `<Card>` 嵌套域（6 页）**：
  - `machine-runtime`（设备运行时间 1 页）：去外层 `p-4` 与 `<Card>`，改 B 类轻量分栏头，补 `TableState`
  - `access-management`（权限管理 1 页）：去外层 `p-4`，清 `@ant-design/icons` 与 `gray-*`
  - `attendance`（考勤明细 / 考勤统计 2 页）：去外层 `p-4`，补 `TableState` / `TableEmpty` / `StatusPill` / 暗色模式，清 `message.useMessage` 与手写彩色 pill
  - `tooling-fixture`（工装资料 / 出入记录 2 页）：`FixtureRecordsPage` 去外层 `p-4` 与 `<Card>`，补 `TableState` / `StatusPill` / 暗色模式；`FixtureDataPage` 改用 `FilterBar`（工装公开页见 P4-B）

---

## Phase 3：其余桌面业务域分批对齐

- [ ] **P3-A 刀具与劳保（6 个管理端页）**：`tooling`（刀具资料 / 库存 / 入库 / 出库 4 页）+ `labor-protection`（劳保资料 / 领料单 2 页；公开页见 P4-B） —— 补 `TableState` / `TableEmpty` / `FormErrorAlert` / `FilterBar`；状态 `<Tag>` → `StatusPill`；清 `labor-protection` 33 处非 `slate` 灰阶；导入接 `ExcelImportModal`
- [ ] **P3-B 质量、包装与别墅梯（8 页）**：`quality`（返工返修 / 质量问题记录 2 页）+ `packaging-process`（员工管理 / 标准工时 / 生产工单 3 页）+ `villa-lift`（订单管理 / 切割工序 / 加工工序 3 页） —— 全部补齐 `TableState` / `TableEmpty` / `FormErrorAlert` / 暗色斑马纹；`<Tag>` → `StatusPill`；清 `villa-lift` 21 处非 `slate` 灰阶与冗余内联 style；Modal 宽度收敛
- [ ] **P3-C 挤压生产与车间基础资料（9 页）**：`extrusion-production`（挤压生产单 / 挤压生产日报表 2 页）+ `workshop`（订单管理 `WorkshopOrderProduction` / 订单现状 `OrderStatusDashboard` / 订单排产 `ProductionScheduling` / 员工管理 `EmployeeList` / 成本核算 `StandardTimeList` / 岗位基础数值 `JobBaseSetting` / 设备维护 `MachineEquipmentMaintenance` 7 页） —— 补 `TableState` / `TableEmpty` / 暗色适配；清 24 处手写 `<svg>` 与 `@ant-design/icons`；状态 `<Tag>` 收口 `StatusPill`；`OrderStatusDashboard` 去外层 `p-4`；统一 `FilterBar`
- [ ] **P3-D 西尼与生产流转报表（12 页）**：`syney`（订单列表 / 订单详情 / 入库单列表 / 入库单详情 / 踏板规格 / 件号配置 / 编号设置 7 页）+ `material-transfer`（1 页）+ `precision-cutting-transfer`（1 页）+ `precision-finishing-cutting`（1 页）+ `production-order`（桌面工单 1 页）+ `production-report`（生产日报表 1 页） —— 清 9 处手写 `<svg>` 与 `@ant-design/icons`；`PoDetail` / `ReportDetail` 去多余 `p-4` 对齐 C 类详情页；`ProductionOrder` 补 `TableState` / `StatusPill` 并去冗余 `<Card>`；筛选栏统一 `FilterBar`

---

## Phase 4：员工手机端、公开扫码页 & 系统页视觉统一

- [ ] **P4-A 员工手机端壳与 7 个移动端页**：重塑 `EmployeeMobileLayout.tsx`（去径向渐变、`rounded-4xl`、70px 重阴影与黑底导航，补齐暗色模式与品牌主色激活态 + 文字标签）；对齐 `MobileScanHubPage`、`MobileProductionOrderScanPage`、`MobileProductionOrderCreatePage`、`MobileProductionOrderDetailPage`、`MobileProductionOrderEditPage`、`MobileMaterialTransferScanPage`、`MobilePrecisionFinishingCuttingScanPage`、`EmployeeMobileChangePasswordPage`
- [ ] **P4-B 4 个免登录公开二维码页**：`LaborProtectionPublicRequisitionPage`、`ToolingStockOutPublicPage`、`JintanPartsStockOutPublicPage`、`ToolingFixturePublicPage` 统一接入 `PublicQrPageShell`（去宋体标题、光斑、不同渐变背景与深黑头图，统一亮/暗色与 44px+ 触控表单）
- [ ] **P4-C 登录、首页与兜底页（6 页）**：`Login.tsx`（清 `@ant-design/icons` 与任意圆角/阴影）、`Dashboard.tsx`、`PageNotFound.tsx`、`AccessDenied.tsx`、`RouteErrorPage.tsx`、`WorkshopOrderQrDetail.tsx` 清理残留 `@ant-design/icons` 并对齐标准圆角与按钮层级

---

## Phase 5：全站原子收口 & 永久防回退上线

- [ ] **P5-1** Modal 宽度全站收敛至 `520 / 720 / 960` 三档（极少数特殊宽排产/打印预览弹窗须在守卫白名单注明原因）
- [ ] **P5-2** 非搜索表单布局核对统一 `layout="vertical"`，清理残留日期 `.toLocaleString()` 替换为 `formatDate` / `formatDateTime`
- [ ] **P5-3** `src/ui/uiStyleConventions.vitest.ts` 切换为全仓库强制门槛（覆盖 `src/features/`、`src/pages/`、`src/ui/`），并在 `CHANGELOG.MD` 与 `src/pages/dashboardChangelog.ts` 记录全站风格统一收官
