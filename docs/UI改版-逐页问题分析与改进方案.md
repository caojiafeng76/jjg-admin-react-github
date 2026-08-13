# UI 改版 — 逐页问题分析与改进方案

> 配套执行清单见仓库根目录 `todolist.md`（规则：完成一项打一个勾 → 用户确认 → 再继续下一项）。
> 本文件是"问题 + 方案"的详细依据；执行顺序与勾选项以 `todolist.md` 为准。
> 设计规格来源：`docs/UI设计调研与改版指南.md`。

---

## 0. 结论速览

全站"看起来像 antd 默认模板"的根因只有 4 个，且都在共享层，改一处全站生效：

1. **品牌主色是 antd 出厂蓝** `#1677ff`（`App.tsx` BASE_TOKENS）。
2. **表格全局压得过紧**：12px 字 / 4px 行内边距（`App.tsx` TABLE_TOKENS）。
3. **Content 是纯白卡片贴页面**：无页面背景分层、无边框、无浅影（`AppLayout.tsx`）。
4. **侧边栏深色 + 未定制**：与浅色模式内容区割裂（`AppLayout.tsx` / `MainMenu.tsx`）。

此外还有一个已确认的**两套蓝并存**问题：登录页用 Tailwind `blue-600/700`（= #2563eb），主站用 antd `#1677ff`，颜色不统一。

绝大多数页面（约 45 个）是同构的 **CRUD 列表页**（搜索栏 + 表格 + 新增/编辑弹层 + 导入导出），它们共享同一套问题，逐页改造本质是"核对并落地同一套列表规范"，而不是各写各的样式。下面先讲全局，再逐域逐页给核对点与方案。

---

## 1. 全局问题（影响所有页面，优先修复）

| # | 位置 | 问题 | 改进方案 |
|---|------|------|----------|
| G1 | `App.tsx` BASE_TOKENS | `colorPrimary: '#1677ff'` 出厂默认蓝，无产品识别度 | 改品牌色 `#2563eb`（备选 `#0d9488`），`colorInfo` 跟随 |
| G2 | `App.tsx` BASE_TOKENS | `borderRadius: 6 / SM:4 / LG:8` 偏小，观感"工程化" | 基准 6→8，SM 6，LG 12；`controlHeight` 32→34 |
| G3 | `App.tsx` TABLE_TOKENS | `cellFontSize:12` + `cellPaddingBlock:4` + `cellPaddingInline:6` 全局压缩，行距拥挤 | 放宽到 13px / 8px / 12px；密集页面用 `size="small"` 局部降级 |
| G4 | 全站表格 | 金额/数量/工时等数字列未启用等宽数字，会跳动、不专业 | 数字列右对齐 + `tabular-nums`（全局或 `span.tabular-nums`） |
| G5 | `AppLayout.tsx` Content | `background: colorBgContainer`（纯白）+ `margin/padding 12px`，无页面背景分层 | 页面背景改 `#f1f5f9`(slate-100)，业务卡片白底 + 1px 边框 + 浅影 `0 1px 3px rgba(0,0,0,.08)` |
| G6 | `AppLayout.tsx` Sider | 深色默认主题，浅色模式与内容区割裂 | 浅色模式改白/浅灰，与 Header 同色系；`collapsedWidth=64`，折叠时图标栏 + tooltip |
| G7 | `AppHeader.tsx` | Header 无底部分割线；页面标题用硬编码 Tailwind 色 `text-neutral-900` | 加 `border-b` 1px；标题改 antd token 色（`colorText`） |
| G8 | `MainMenu.tsx` | 菜单激活态是默认深色高亮，无品牌感 | 激活项改圆角高亮块（8px 圆角 + 主色 8% 背景），分组标题 12px 灰字 |
| G9 | 基建 | antd token 与 Tailwind 两套色值并存（如物料转移单的 `blue/emerald/amber/slate`） | `@layer theme, base, antd, components, utilities;` + `StyleProvider`；`ConfigProvider` 开 `cssVar`，`@theme` 桥接，让 antd token 成为颜色唯一来源 |
| G10 | 全局加载/空态 | 加载多为 spinner，空态多为纯文字 | 表格加载用骨架屏；空态 = 图标 + 一句话 + 引导动作；错误态 = 说明 + 重试按钮 |

> G1–G8 属于 P0"1 天内见效"，只改 `App.tsx` + 少量页面类。G9 是 P0 基建（2-3 天）。G10 是 P1 组件级。

---

## 2. 逐域逐页问题与方案

> 标注 **【已确认】** 的是已读代码/指南确认的具体问题；标注 **【核对】** 的是该页属于通用列表模式、需按 §1 全局规范逐项核对的点。
> 通用列表页核对清单（每个 CRUD 列表页都过一遍）：① 表格密度是否随 G3 自动改善；② 数字列右对齐 + tabular-nums；③ 状态列是否 pill 徽章；④ 加载态是否骨架屏、空态是否有引导、错误态是否有重试；⑤ 新增/编辑是否用 Drawer、确认是否用 Modal；⑥ 反馈文案是否"原因+影响+建议"。

### 2.1 首页 / 登录 / 404 / 403

| 页面 | 路由 | 问题 | 改进方案 |
|------|------|------|----------|
| 首页 Dashboard | `/dashboard` | **【已确认】** 只有一张"欢迎使用"空卡片，无任何业务信息 | 决策优先看板：4-6 张 KPI 卡（大数字 24-28px 粗体 tabular-nums + 环比 + 趋势迷你图），CSS Grid `repeat(auto-fill, minmax(200px,1fr))`；卡片与内容卡片统一样式 |
| 登录 Login | `/login` | **【已确认】** 视觉已较好（slate 底 + 圆角卡），但 `blue-600/700` 硬编码，与主站 `#1677ff` 两套蓝 | 把硬编码蓝替换为品牌 token（`var(--app-color-primary)`），与全站统一 |
| 404 / 403 / 错误页 | `*` `/access-denied` | **【核对】** antd Result 默认样式 | 保持 Result，统一卡片圆角与空态插画风格即可 |

### 2.2 西尼（syney）

| 页面 | 路由 | 问题 | 方案 |
|------|------|------|------|
| 订单列表 PoList | `syney-po-list` | **【核对】** 通用列表页，含 Excel 导入 | 过通用清单；导入按钮/进度反馈统一 |
| 订单详情 PoDetail | `syney-po-list/:PoId` | **【核对】** 详情页，字段多 | 详情分区卡片 + 数字列 tabular-nums；返回/操作按钮区吸底 |
| 入库单列表 ReportList | `syney-store-report-list` | **【核对】** 通用列表页 | 过通用清单 |
| 入库单详情 ReportDetail | `syney-store-report-list/:reportNo` | **【核对】** 详情 + 打印(PDF) | 打印入口统一 PrintButton；字段分区 |
| 踏板规格列表 SpecList | `syney-spec-list` | **【核对】** 通用列表页 | 过通用清单 |
| 件号配置 SafePartSetting | `syney-safe-part-setting` | **【核对】** 配置表单页 | 长表单分组；内联校验 |
| 编号设置 SyneySetting | `syney-setting` | **【核对】** 配置表单页 | 同上 |

### 2.3 车间 / 基础资料（workshop）

| 页面 | 路由 | 问题 | 方案 |
|------|------|------|------|
| 订单管理 OrderList | `workshop-order-list` | **【核对】** 通用列表页（含状态流转） | 过通用清单；状态流转用 pill 徽章 |
| 订单现状 OrderStatusDashboard | `production-scheduling` | **【核对】** 看板类 | 按 Bento Grid 组织 KPI/图表卡；图表配色随主题切换 |
| 订单排产 ProductionScheduling | `order-scheduling` | **【核对】** 排产/表格类 | 数字列 tabular-nums；拖拽/操作反馈 <300ms |
| 员工管理 EmployeeList | `employee-list` | **【核对】** 通用列表页 | 过通用清单 |
| 成本核算 StandardTimeList | `standard-time-list` | **【核对】** 通用列表页 | 过通用清单；成本/金额列右对齐 |
| 岗位基础数值设定 JobBaseSetting | `job-base-setting` | **【核对】** 表单/数值页 | 数值列 tabular-nums；内联校验 |
| 机器设备维护 MachineEquipmentMaintenance | `machine-equipment-maintenance` | **【核对】** 通用列表页 | 过通用清单 |
| 设备运行时间 MachineRuntime | `machine-runtime` | **【核对】** 统计/时间数据页 | 时长数字 tabular-nums；图表配色随主题 |

### 2.4 报表（reports）

| 页面 | 路由 | 问题 | 方案 |
|------|------|------|------|
| 物料转移单 MaterialTransfer | `material-transfer` | **【已确认】** 已是全站亮点（渐变选中摘要条 + Tailwind 色系），但 Tailwind 色与 antd 语义色未打通 | 提炼选中摘要条为通用组件；颜色改走 token（依赖 G9） |
| 生产工单 ProductionOrder | `production-order` | **【核对】** 通用列表页 + Excel 导入导出 | 过通用清单 |
| 生产日报表 ProductionDailyReport | `production-daily-report` | **【核对】** 报表/统计页 | 数字列 tabular-nums；汇总行突出显示 |

### 2.5 质量（quality）

| 页面 | 路由 | 问题 | 方案 |
|------|------|------|------|
| 返工返修 ReworkRepair | `quality-rework-repair` | **【核对】** 通用列表页 | 过通用清单；状态 pill 徽章 |
| 质量问题记录 IssueRecord | `quality-issue-record` | **【核对】** 通用列表页 | 过通用清单；严重等级用语义色徽章 |

### 2.6 精切（precision-cutting）

| 页面 | 路由 | 问题 | 方案 |
|------|------|------|------|
| 精切转移单 PrecisionCuttingTransfer | `precision-cutting-transfer` | **【核对】** 通用列表页 | 过通用清单 |
| 精加工切割单 PrecisionFinishingCutting | `precision-finishing-cutting` | **【核对】** 通用列表页 | 过通用清单 |

### 2.7 刀具（tooling）

| 页面 | 路由 | 问题 | 方案 |
|------|------|------|------|
| 刀具资料 ToolingData | `tooling-data` | **【核对】** 通用列表页 | 过通用清单 |
| 刀具库存 ToolingInventory | `tooling-inventory` | **【核对】** 库存列表页 | 数量列右对齐 tabular-nums；库存预警语义色 |
| 刀具入库 ToolingStockIn | `tooling-stock-in` | **【核对】** 入库单列表页 | 过通用清单 |
| 刀具出库 ToolingStockOut | `tooling-stock-out` | **【核对】** 出库单列表页 | 过通用清单 |

### 2.8 劳保（labor-protection）

| 页面 | 路由 | 问题 | 方案 |
|------|------|------|------|
| 劳保资料 LaborProtectionData | `labor-protection-data` | **【核对】** 通用列表页 | 过通用清单 |
| 领料单 LaborProtectionRequisition | `labor-protection-requisition` | **【核对】** 领料单列表页 | 过通用清单；数量列 tabular-nums |

### 2.9 工装管理（tooling-fixture）

| 页面 | 路由 | 问题 | 方案 |
|------|------|------|------|
| 工装资料 FixtureData | `fixture-data` | **【核对】** 通用列表页 | 过通用清单 |
| 出入记录 FixtureRecords | `fixture-records` | **【核对】** 记录列表页 | 过通用清单；进出方向用语义色区分 |

### 2.10 别墅梯（villa-lift）

| 页面 | 路由 | 问题 | 方案 |
|------|------|------|------|
| 订单管理 VillaLiftOrderList | `villa-lift-order-list` | **【核对】** 通用列表页 | 过通用清单 |
| 切割工序 CuttingProcess | `villa-lift-cutting-process` | **【核对】** 工序/记录页 | 数字列 tabular-nums；状态徽章 |
| 加工工序 FinishingProcess | `villa-lift-processing` | **【核对】** 工序/记录页 | 同上 |

### 2.11 包装工序（packaging-process）

| 页面 | 路由 | 问题 | 方案 |
|------|------|------|------|
| 员工管理 PackagingEmployeeList | `packaging-process-employee-list` | **【核对】** 通用列表页 | 过通用清单 |
| 标准工时 PackagingStandardTimeList | `packaging-process-standard-time-list` | **【核对】** 数值列表页 | 工时列 tabular-nums |
| 生产工单 PackagingWorkOrderList | `packaging-process-work-order-list` | **【核对】** 通用列表页 | 过通用清单 |

### 2.12 挤压生产（extrusion-production）

| 页面 | 路由 | 问题 | 方案 |
|------|------|------|------|
| 挤压生产单 ExtrusionProduction | `extrusion-production-order` | **【核对】** 通用列表页 | 过通用清单 |
| 挤压生产日报表 ExtrusionProductionDailyReport | `extrusion-production-daily-report` | **【核对】** 报表页 | 数字列 tabular-nums；汇总行突出 |

### 2.13 优迈（youmai）

| 页面 | 路由 | 问题 | 方案 |
|------|------|------|------|
| 货品资料 ProductData | `youmai-product-data` | **【核对】** 通用列表页 | 过通用清单 |
| 成品库存 FinishedGoodsInventory | `youmai-finished-goods-inventory` | **【核对】** 库存列表页 | 数量列右对齐 tabular-nums；库存预警语义色 |
| 成品入库 FinishedGoodsStockIn | `youmai-finished-goods-stock-in` | **【核对】** 入库列表页 | 过通用清单 |
| 成品出库 FinishedGoodsStockOut | `youmai-finished-goods-stock-out` | **【核对】** 出库列表页 | 过通用清单 |
| 原料库存 RawMaterialInventory | `youmai-raw-material-inventory` | **【核对】** 库存列表页 | 数量列 tabular-nums |
| 原料入库 RawMaterialStockIn | `youmai-raw-material-stock-in` | **【核对】** 入库列表页 | 过通用清单 |
| 原料出库 RawMaterialStockOut | `youmai-raw-material-stock-out` | **【核对】** 出库列表页 | 过通用清单 |

### 2.14 考勤（attendance）

| 页面 | 路由 | 问题 | 方案 |
|------|------|------|------|
| 考勤明细 AttendanceDetail | `attendance-detail` | **【核对】** 明细列表页 | 过通用清单；工时/加班时长 tabular-nums |
| 考勤统计 AttendanceStats | `attendance-summary` | **【核对】** 统计页 | KPI 卡 + 汇总数字 tabular-nums |

### 2.15 权限管理（access-management）

| 页面 | 路由 | 问题 | 方案 |
|------|------|------|------|
| 权限管理 AccessManagement | `access-management` | **【核对】** 角色/权限表格页 | 过通用清单；权限树展开态优化 |

### 2.16 员工手机端 / 扫码（移动端）

| 页面 | 路由 | 问题 | 方案 |
|------|------|------|------|
| 扫码中心 ScanHub | `scan` | **【核对】** 移动端入口页 | 大按钮触控目标 ≥44px；深色适配 |
| 物料转移扫码 MaterialTransferScan | `material-transfer/scan` | **【核对】** 扫码 H5 | 触屏交互；反馈 <300ms |
| 生产工单扫码 ProductionOrderScan | `production-order/scan` | **【核对】** 扫码 H5 | 同上 |
| 工单新建/详情/编辑 MobileProductionOrder* | `production-order/create` `/:orderId` `/:orderId/edit` | **【核对】** 移动端表单页 | 长表单分组；底部吸底提交；数字输入用 `inputmode` |
| 精加工扫码 PrecisionFinishingCuttingScan | `precision-finishing-cutting/scan` | **【核对】** 扫码 H5 | 触屏交互 |
| 修改密码 EmployeeMobileChangePasswordPage | `employee/change-password` | **【核对】** 移动端表单 | 内联校验 |
| 3 个公开二维码页（劳保/刀具出库/工装） | public QR path | **【核对】** 免登录 H5 | 与移动端统一视觉；提交反馈 |

---

## 3. 改进方案优先级总览

| 优先级 | 内容 | 对应 todolist 区块 |
|--------|------|--------------------|
| **P0 全局（先做，影响全部页面）** | G1–G8 全局 token / 布局 / 导航 | 区块 A |
| **P0 基建** | G9 antd+Tailwind 打通 | 区块 B |
| **P1 逐页改造** | §2 各域页面过通用清单 + 首页看板 + 登录 token 化 | 区块 C–R |
| **P1 组件** | G10 三态 / 状态徽章 / 表单反馈 / 选中摘要条通用化 | 区块 S |
| **P2 体验** | 暗色打磨 / 密度切换 / 命令面板（远期） | 区块 T |

> 执行依赖：区块 A 完成后，区块 C–R 的"表格密度改善"自动生效，逐页只需核对状态徽章、数字列、三态、弹层选型等局部项；区块 B（token 打通）建议在区块 A 之后、逐页改造大规模铺开前完成，避免两套色值继续并存。
