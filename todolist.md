# UI 改版 todolist

> 详细问题与方案见 `docs/UI改版-逐页问题分析与改进方案.md`；设计规格见 `docs/UI设计调研与改版指南.md`。

## 执行规则（必读）

1. **一次只做一项**：从上往下，每次只处理一条未勾选的项。
2. **完成 → 打勾 → 等确认**：完成一项后，把该项的 `[ ]` 改成 `[x]`，然后停下来，向用户汇报该项做了什么、如何验证，**等用户确认后再继续下一项**。
3. **禁止批量推进**：没有得到用户"继续"的确认前，不要自动开始下一项。
4. **验证要求**：每项完成后按 `.github/copilot-instructions.md` 的最低验证标准执行（`bun run test` / `bun run typecheck` / 页面级回归），并同步更新根目录 `CHANGELOG.MD`。

---

## A. P0 全局基建（先做，影响所有页面）

- [ ] **A1** `App.tsx` BASE_TOKENS：主色 `#1677ff`→品牌色 `#2563eb`（`colorInfo` 跟随），圆角 6→8（SM 6 / LG 12），`controlHeight` 32→34
- [ ] **A2** `App.tsx` TABLE_TOKENS：表格密度 12px/4px/6px → 13px/8px/12px（密集页面后续用 `size="small"` 局部降级）
- [ ] **A3** 数字列全局 `tabular-nums`（金额/数量/工时/百分比右对齐）
- [ ] **A4** `AppLayout.tsx` Content：页面背景改 slate-100，业务卡片白底 + 1px 边框 + 浅影分层
- [ ] **A5** `AppLayout.tsx` Sider：浅色模式改白/浅灰与 Header 同色系，`collapsedWidth=64`
- [ ] **A6** `AppHeader.tsx`：底部加 1px 分割线；页面标题改 antd token 色
- [ ] **A7** `MainMenu.tsx`：菜单激活态改圆角高亮块（主色 8% 背景），分组标题 12px 灰字

## B. P0 基建：antd 与 Tailwind 打通

- [ ] **B1** `index.css` 加 `@layer theme, base, antd, components, utilities;` + `StyleProvider`；`ConfigProvider` 开 `cssVar`，`@theme` 桥接 token，消除两套色值

## C. 首页 / 登录 / 兜底页

- [ ] **C1** 首页 Dashboard：欢迎空卡 → 决策优先看板（4-6 张 KPI 卡，大数字 + 环比 + 趋势迷你图）
- [ ] **C2** 登录 Login：硬编码 `blue-600/700` → 品牌 token，与主站统一
- [ ] **C3** 404 / 403 / 错误页：统一卡片圆角与空态插画风格

## D. 西尼（syney）

- [ ] **D1** 订单列表 PoList（含导入按钮反馈统一）
- [ ] **D2** 订单详情 PoDetail（详情分区卡片 + 数字列 tabular-nums + 操作区吸底）
- [ ] **D3** 入库单列表 ReportList
- [ ] **D4** 入库单详情 ReportDetail（打印入口统一）
- [ ] **D5** 踏板规格列表 SpecList
- [ ] **D6** 件号配置 SafePartSetting（长表单分组 + 内联校验）
- [ ] **D7** 编号设置 SyneySetting（同上）

## E. 车间 / 基础资料（workshop）

- [ ] **E1** 订单管理 OrderList（状态流转 pill 徽章）
- [ ] **E2** 订单现状 OrderStatusDashboard（Bento Grid KPI/图表，图表配色随主题）
- [ ] **E3** 订单排产 ProductionScheduling（数字列 tabular-nums + 操作反馈 <300ms）
- [ ] **E4** 员工管理 EmployeeList
- [ ] **E5** 成本核算 StandardTimeList（成本/金额列右对齐）
- [ ] **E6** 岗位基础数值设定 JobBaseSetting（数值列 tabular-nums + 内联校验）
- [ ] **E7** 机器设备维护 MachineEquipmentMaintenance
- [ ] **E8** 设备运行时间 MachineRuntime（时长 tabular-nums + 图表配色随主题）

## F. 报表（reports）

- [ ] **F1** 物料转移单 MaterialTransfer（选中摘要条提炼为通用组件 + 颜色走 token）
- [ ] **F2** 生产工单 ProductionOrder
- [ ] **F3** 生产日报表 ProductionDailyReport（汇总行突出 + 数字列 tabular-nums）

## G. 质量（quality）

- [ ] **G1** 返工返修 ReworkRepair（状态 pill 徽章）
- [ ] **G2** 质量问题记录 IssueRecord（严重等级语义色徽章）

## H. 精切（precision-cutting）

- [ ] **H1** 精切转移单 PrecisionCuttingTransfer
- [ ] **H2** 精加工切割单 PrecisionFinishingCutting

## I. 刀具（tooling）

- [ ] **I1** 刀具资料 ToolingData
- [ ] **I2** 刀具库存 ToolingInventory（数量列右对齐 + 库存预警语义色）
- [ ] **I3** 刀具入库 ToolingStockIn
- [ ] **I4** 刀具出库 ToolingStockOut

## J. 劳保（labor-protection）

- [ ] **J1** 劳保资料 LaborProtectionData
- [ ] **J2** 领料单 LaborProtectionRequisition（数量列 tabular-nums）

## K. 工装管理（tooling-fixture）

- [ ] **K1** 工装资料 FixtureData
- [ ] **K2** 出入记录 FixtureRecords（进出方向语义色区分）

## L. 别墅梯（villa-lift）

- [ ] **L1** 订单管理 VillaLiftOrderList
- [ ] **L2** 切割工序 CuttingProcess（数字列 tabular-nums + 状态徽章）
- [ ] **L3** 加工工序 FinishingProcess（同上）

## M. 包装工序（packaging-process）

- [ ] **M1** 员工管理 PackagingEmployeeList
- [ ] **M2** 标准工时 PackagingStandardTimeList（工时列 tabular-nums）
- [ ] **M3** 生产工单 PackagingWorkOrderList

## N. 挤压生产（extrusion-production）

- [ ] **N1** 挤压生产单 ExtrusionProduction
- [ ] **N2** 挤压生产日报表 ExtrusionProductionDailyReport（汇总行 + tabular-nums）

## O. 优迈（youmai）

- [ ] **O1** 货品资料 ProductData
- [ ] **O2** 成品库存 FinishedGoodsInventory（数量列 + 预警语义色）
- [ ] **O3** 成品入库 FinishedGoodsStockIn
- [ ] **O4** 成品出库 FinishedGoodsStockOut
- [ ] **O5** 原料库存 RawMaterialInventory（数量列 tabular-nums）
- [ ] **O6** 原料入库 RawMaterialStockIn
- [ ] **O7** 原料出库 RawMaterialStockOut

## P. 考勤（attendance）

- [ ] **P1** 考勤明细 AttendanceDetail（工时/加班时长 tabular-nums）
- [ ] **P2** 考勤统计 AttendanceStats（KPI 卡 + 汇总数字 tabular-nums）

## Q. 权限管理（access-management）

- [ ] **Q1** 权限管理 AccessManagement（权限树展开态优化）

## R. 员工手机端 / 扫码（移动端）

- [ ] **R1** 扫码中心 ScanHub（触控目标 ≥44px + 深色适配）
- [ ] **R2** 物料转移扫码 MaterialTransferScan
- [ ] **R3** 生产工单扫码 ProductionOrderScan
- [ ] **R4** 工单新建/详情/编辑 MobileProductionOrder*（长表单分组 + 底部吸底提交 + inputmode）
- [ ] **R5** 精加工扫码 PrecisionFinishingCuttingScan
- [ ] **R6** 修改密码 EmployeeMobileChangePasswordPage（内联校验）
- [ ] **R7** 3 个公开二维码页（劳保 / 刀具出库 / 工装，统一移动端视觉 + 提交反馈）

## S. P1 组件级（通用化，随逐页改造一并落地）

- [ ] **S1** 表格三态通用化：骨架屏加载 / 引导式空态 / 错误重试
- [ ] **S2** 状态徽章体系化（成功=绿 / 警告=琥珀 / 危险=红 / 中性=灰 pill）
- [ ] **S3** 表单反馈文案："失败原因 + 影响 + 建议"
- [ ] **S4** 选中摘要条提炼为通用组件（来自物料转移单）

## T. P2 体验（远期，按需）

- [ ] **T1** 暗色模式全面打磨（色板对齐 + 对比度 WCAG AA + 200ms 过渡）
- [ ] **T2** 表格密度切换（默认 / 紧凑）
- [ ] **T3** 全局命令面板 / AI 助手（`@ant-design/x`）/ Bento Grid 工作台（探索项）
