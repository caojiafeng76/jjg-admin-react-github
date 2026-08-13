# UI 设计调研与改版指南

> 本文档基于 2025-2026 年主流后台管理系统设计趋势的调研，结合本项目（React 19 + Ant Design 6 + Tailwind CSS 4 + TanStack Query 5 + Vite 8）的现状分析，给出可落地的 UI 改版方向与具体规格。供全站视觉升级时参考。

---

## 1. 项目现状诊断

基于对 `src/App.tsx`（全局主题）、`src/ui/AppLayout.tsx`（主布局）、`src/ui/AppHeader.tsx`（顶栏）、`src/ui/MainMenu.tsx`（侧边菜单）的代码审查：

### 1.1 当前已具备的基础

| 项目 | 现状 | 评价 |
|------|------|------|
| 全局主题 | `ConfigProvider` + `BASE_TOKENS` 集中管理 | 结构良好，修改入口统一 |
| 暗色模式 | `darkAlgorithm` + Tailwind `dark` class 双向同步 | 已是标配能力 |
| 布局 | Sider + Header + PageTabs + Content 卡片 | 功能完整（多页签缓存） |
| 表格 | 紧凑密度（12px 字 / 4px 内边距）+ 暗色适配 | 数据密集型业务合适，但视觉偏"挤" |
| 响应式 | 768px 断点切换员工手机端布局 | 双端架构清晰 |

### 1.2 主要视觉问题（"看起来丑"的根因）

1. **无品牌主色**：`colorPrimary: '#1677ff'` 是 antd 出厂默认蓝，全站观感 = "antd 默认模板"，没有产品识别度。
2. **圆角偏小**：`borderRadius: 6` 属于 antd 默认区间下限，观感偏"工程化"而非"设计感"。
3. **内容区缺乏层次**：`Content` 是纯白卡片（`colorBgContainer`）直接贴页面背景，无边无影无渐变，视觉"平"。
4. **表格密度过紧**：`cellFontSize: 12` + `cellPaddingBlock: 4` 全局压缩，行距拥挤、可读性下降。
5. **侧边栏未定制**：`Sider` 使用 antd 默认样式，与内容区风格割裂。
6. **色彩语言不统一**：部分模块（如物料转移单）用 Tailwind 的 `blue/emerald/amber/slate` 色系，与 antd 语义色（`colorPrimary/colorSuccess/...`）没有 token 级打通，两套色值并存。
7. **数字对齐缺失**：金额、数量等数字列普遍未启用等宽数字（`tabular-nums`），表格专业感不足。
8. **状态反馈单一**：加载多为 spinner（而非骨架屏），空状态多为纯文字（而非引导式空态）。

---

## 2. 2025-2026 后台设计趋势调研结论

### 2.1 总体方向：Calm Design（克制极简）

当前 B 端主流基调由"炫技"转向"克制"：

- **去装饰**：用 1px 边框或极浅阴影代替重投影区分层级；弱化玻璃拟态与大面积渐变。
- **数据优先**：视觉权重让给数据本身，装饰只用于低信息密度区域（图标、图表面积、空状态插画）。
- **来源**：[AdminUIUX - Future of Admin Dashboard Design](https://www.adminuiux.com/future-of-admin-dashboard-design/)："Instead of complex glass effects, we use subtle Z-axis elevations and soft shadows."

### 2.2 六大关键趋势

| 趋势 | 特征 | 对本项目的落点 |
|------|------|----------------|
| **克制极简** | 1px 边框 + 浅阴影分层，弱化渐变 | 内容卡片加边框/浅影，去掉纯白平面感 |
| **Bento Grid 磁贴** | KPI/图表按权重做几何网格 | 首页/看板用 CSS Grid 自适应卡片 |
| **数据密度 + 渐进披露** | 主视图精简，细节进抽屉/弹窗 | 列表只放摘要列 + 状态列，详情进 Drawer |
| **暗色模式标配** | 从加分项变为功能要求 | 已有，需打磨色值与对比度 |
| **微交互** | 150ms 内操作反馈、骨架屏替代 spinner | 表格加载用骨架屏；按钮反馈提速 |
| **决策优先仪表盘** | KPI = 大数字 + 对比 + 趋势图 | 车间/库存看板按此组织 |

### 2.3 参考案例对比

| 方案 | UI 库 | 视觉特点 | 借鉴点 |
|------|-------|----------|--------|
| **Ant Design Pro** | antd | 企业标准、信息密度高、三态布局 | 与 antd 生态无缝，ProLayout 视觉惯例 |
| **antd-admin** | antd + TanStack | 现代工具链、比 Pro 轻 | **技术栈与本项目最接近** |
| **shadcn/ui** | Radix + Tailwind | 现代克制、留白与圆角处理精致 | Tailwind 层视觉标杆 |
| **Mantine** | Mantine | 统一 API、暗色内置 | density/radius 处理的克制感 |
| **Tremor** | Radix + Tailwind | 极简图表 + 数据表格 | 看板图表视觉参考 |

**结论**：视觉以 shadcn/ui 的现代克制美学为参考，组件能力留在 antd 6 生态内，二者通过设计 token 统一。

---

## 3. 推荐设计方向（本项目）

### 3.1 一句话定位

> **"工业级的克制"**：以冷灰中性色 + 单一品牌主色为基底，数据表格做清晰密度分层，卡片用边框 + 浅影建立层级，暗色模式作为一等公民打磨。

### 3.2 品牌色建议

- 贴合"扶梯踏板 / 车间生产 / 库存"工业语境，建议 **蓝青系**（科技、可靠、制造感）或 **青绿系**（安全、环保、质检感）。
- 备选主色（供决策）：
  - `#2563eb`（靛蓝，比默认蓝更有深度）
  - `#0d9488`（青，制造业/质检语境）
  - `#4f46e5`（靛紫，更现代但偏消费级）
- 主色使用面积 **≤10%**，只用于可交互元素（按钮/链接/选中态/焦点）。

### 3.3 中性色：冷灰（slate）体系

统一使用 Tailwind `slate` 系列与 antd 色板对齐：

| 用途 | 浅色模式 | 暗色模式 |
|------|----------|----------|
| 页面背景 | `#f1f5f9`（slate-100） | `#0f172a`（slate-900） |
| 卡片背景 | `#ffffff` | `#1e293b`（slate-800） |
| 卡片边框 | `#e2e8f0`（slate-200） | `#334155`（slate-700） |
| 主文字 | `#0f172a` | `#f1f5f9` |
| 次要文字 | `#64748b`（slate-500） | `#94a3b8`（slate-400） |

---

## 4. 设计 Token 体系（落地规格）

### 4.1 antd 全局 Token（`src/App.tsx` 的 `BASE_TOKENS` 升级）

```tsx
const BASE_TOKENS = {
  colorPrimary: '#2563eb',      // 品牌主色（替换默认 #1677ff）
  colorInfo: '#2563eb',         // 信息色跟随主色
  borderRadius: 8,              // 基准圆角 6 → 8（"最便宜的变现代"改动）
  borderRadiusSM: 6,
  borderRadiusLG: 12,           // 卡片/弹层用
  controlHeight: 34,            // 控件高度 32 → 34，更舒展
  fontSize: 14,
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
}
```

### 4.2 表格 Token（密度分层，不再全局压紧）

```tsx
const TABLE_TOKENS = {
  cellFontSize: 13,             // 12 → 13
  cellPaddingBlock: 8,          // 4 → 8（行高恢复呼吸感）
  cellPaddingInline: 12,        // 6 → 12
  headerBg: '#f8fafc',          // 保留（slate-50 表头）
  headerColor: '#475569',
  rowHoverBg: '#f8fafc',
}
```

> 若个别数据密集型页面仍需要紧凑模式，用 `Table size="small"` 或 antd `theme.compactAlgorithm` 局部降级，不做全局压缩。

### 4.3 圆角 / 阴影 / 间距规范

| 层级 | 圆角 | 阴影（浅色） | 用途 |
|------|------|--------------|------|
| 输入框/按钮 | 6-8px | 无 / 聚焦浅环 | 表单控件 |
| 卡片 | 10-12px | `0 1px 3px rgba(0,0,0,0.08)` | 内容卡片、搜索栏容器 |
| 弹层 | 12px | 提升阴影 | Modal / Drawer |
| 徽标 | 999px pill | 无 | 状态徽章 |

间距基数 4px：`4 / 8 / 12 / 16 / 24 / 32 / 48`；内容区 padding 统一 24px（移动端 16px）。

### 4.4 数字与字体细节

- **所有数字列**（金额/数量/工时/百分比）：`font-variant-numeric: tabular-nums`（等宽数字，防止跳动）——`<span className="tabular-nums">` 或 antd 全局配置。
- 数据量大的表格字号 13px、正文 14px、KPI 数字 24-28px 粗体。
- 中文正文行高 1.5-1.6，标题 1.3。

### 4.5 antd 与 Tailwind 打通（关键基建）

antd 官方推荐的 Tailwind 4 兼容方案：

```css
/* src/index.css */
@layer theme, base, antd, components, utilities;
@import 'tailwindcss';
```

```tsx
// 组件内用 StyleProvider 将 antd 样式输出到 antd layer
import { StyleProvider } from '@ant-design/cssinjs'
```

**CSS 变量桥接**（让 antd token 成为颜色唯一来源，Tailwind 引用同一份值）：

```tsx
// App.tsx 开启 cssVar
<ConfigProvider theme={{ cssVar: { key: 'app', cssVarPrefix: 'app' }, ... }}>
```

```css
/* index.css 将 antd 变量桥接到 Tailwind theme（或用社区 tailwind-preset-antd 插件） */
@theme {
  --color-primary: var(--app-color-primary);
  --color-success: var(--app-color-success);
  --color-warning: var(--app-color-warning);
  --color-error: var(--app-color-error);
}
```

> 参考：[antd 样式兼容官方文档](https://ant-design.antgroup.com/docs/react/compatible-style-cn)、[antd Issue #56414 官方答复](https://github.com/ant-design/ant-design/issues/56414)、[tailwind-preset-antd](https://github.com/json-q/tailwind-preset-antd)（支持 antd v6 + tw v4）。
> 注意坑：antd 的 CSS 变量默认挂载在 React 根节点包装元素上，Tailwind `@theme` 变量挂在 `:root`，需要将 antd 变量提升到 `:root` 或做一层全局映射。

---

## 5. 布局与导航

### 5.1 整体布局（保留现有骨架，打磨细节）

```
┌──────────────────────────────────────────────┐
│ Sider 256px │ Header 64px（面包屑/页签/用户）  │
│ (折叠 64px) ├────────────────────────────────┤
│             │ PageTabs（多页签）              │
│   MainMenu  ├────────────────────────────────┤
│             │ Content（bg=slate-100 页面背景）│
│             │  ┌ 白卡片 1px边框+浅影 ───────┐ │
│             │  │ 业务内容                   │ │
│             │  └────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

关键改动：

1. **页面背景与卡片分层**：`Content` 区域背景改为 `#f1f5f9`（slate-100），业务卡片保留白底 + 1px 边框 + 浅影——层次立现。
2. **Sider 定制**：`Sider` 背景统一（浅色模式用白/浅灰，暗色用深灰），与 Header 同色系；`collapsedWidth={64}`。
3. **Header 精简**：保留折叠按钮 + 页面标题 + 用户区，增加底部 1px 分割线（`border-b border-slate-200`）。
4. **菜单激活态**：antd Menu 自带高亮，可开启 `activeBarBorderWidth` 或保持圆角高亮块（8px 圆角 + 主色 8% 背景）。

### 5.2 导航规范

| 项 | 规格 |
|----|------|
| 展开侧栏宽 | 240-256px |
| 收起侧栏宽 | 64px 图标栏（hover tooltip） |
| 菜单项高度 | 36-40px |
| 菜单分组标题 | 12px 大写灰字，上边距 24px |

### 5.3 KPI / 看板区（首页或车间看板）

- 顶部 4-6 张 KPI 卡，CSS Grid `repeat(auto-fill, minmax(200px, 1fr))` 自适应。
- 每卡 = **1 个大数字（24-28px 粗体 tabular-nums）+ 1 个对比（环比/同比）+ 1 个趋势迷你图**（三取二，不堆叠）。
- 卡片样式与内容卡片统一（白底 + 边框 + 浅影）。

---

## 6. 组件级细化

### 6.1 表格（后台颜值重灾区）

1. **三态必设计**：
   - 加载：**骨架屏**替代 spinner（感知加载时间降低约 25%）。
   - 空态：图标 + 一句话说明 + 引导动作（"暂无数据，点击新建"）。
   - 错误：错误说明 + 重试按钮，保留已填数据。
2. **粘性表头**（antd `sticky`）、关键列钉住、列内联筛选。
3. **宽表拆分**：超宽表用"概览列表 + 详情 Drawer"两视图，避免横向滚动。
4. **状态列**：统一 pill 徽章（圆角 + 语义色浅底 + 色点），全站语义一致（成功=绿、警告=琥珀、危险=红、中性=灰）。
5. **数字列**：右对齐 + `tabular-nums`。
6. **选中摘要条**：保留物料转移单的渐变选中条模式（已是本项目亮点），提炼为通用组件。

### 6.2 表单

1. **内联校验**（antd `Form rules` 原生），错误提示在字段下方即时出现。
2. **长表单分组**：>10 字段用 `Steps` 或分区卡片，高级选项折叠。
3. **弹层选型**：编辑/详情用 Drawer（保持上下文），确认类用 Modal。
4. **反馈文案**："操作失败" → "失败原因 + 影响 + 建议"。
5. **微交互**：按钮按下 100ms 内反馈；成功 toast；高频操作动画 <300ms。

### 6.3 图标

- 继续使用 Heroicons（solid 用于工具栏、outline 用于辅助展示），保持 16px/20px 两档，粗细一致。
- 图标统一放进按钮/菜单/徽章，不裸用（除空状态插画）。

---

## 7. 暗色模式打磨

已有基础（`darkAlgorithm` + `dark` class 同步），打磨方向：

1. **色板对齐**：暗色 token 与 Tailwind `dark:` 类共用一套语义色（见 3.3），不出现两套暗色值。
2. **对比度检查**：次要文字 ≥ `#94a3b8`（WCAG AA），表格分隔线 `#334155`。
3. **图片/图表适配**：图表库（若有）配色跟随主题切换。
4. **过渡动画**：亮暗切换加 200ms 平滑过渡（antd 自带，Tailwind 侧 `transition-colors`）。

---

## 8. 优先级路线图

| 优先级 | 内容 | 预估 |
|--------|------|------|
| **P0 快速见效（1 天内）** | 主色改品牌色；`borderRadius` 6→8；表格密度放松（13px/8px）；Content 页面背景与卡片分层；数字列 `tabular-nums` | 只改 `App.tsx` + 少量页面类 |
| **P0 基建** | `@layer theme, base, antd, components, utilities;` + `StyleProvider`；ConfigProvider 开 `cssVar`，Tailwind `@theme` 桥接 token | 配置层，2-3 天 |
| **P1 布局** | Sider/Header 视觉定制、菜单激活态、卡片系统统一（边框+浅影）、KPI 看板 | 1 周 |
| **P1 组件** | 表格三态（骨架屏/空态/错误重试）、状态徽章体系化、表单反馈打磨 | 1 周 |
| **P2 体验** | 暗色模式全面打磨、密度切换（默认/紧凑）、选中摘要条抽通用组件 | 按需 |
| **P3 探索** | 全局命令面板、AI 助手（`@ant-design/x`）、Bento Grid 工作台 | 远期 |

---

## 9. 参考资源

- antd 主题定制：[customize-theme](https://github.com/ant-design/ant-design/blob/master/docs/react/customize-theme.en-US.md)
- antd + Tailwind 兼容：[样式兼容（官方）](https://ant-design.antgroup.com/docs/react/compatible-style-cn)、[Issue #56414](https://github.com/ant-design/ant-design/issues/56414)
- antd + Tailwind 打通实践：[Jynxio](https://www.jynxio.com/posts/how-to-integrate-antd-with-tw)、[tailwind-preset-antd](https://github.com/json-q/tailwind-preset-antd)、[XinAdmin](https://xinadmin.cn/guide/frontend/style.html)
- 趋势综述：[AdminUIUX](https://www.adminuiux.com/future-of-admin-dashboard-design/)、[fuselab](https://fuselabcreative.com/top-dashboard-design-trends-2025/)、[procreator](https://procreator.design/blog/b2b-saas-design-trends-and-examples/)、[fanruan](https://www.fanruan.com/en/blog/top-admin-dashboard-design-ideas-inspiration)
- 布局与模式：[artofstyleframe](https://artofstyleframe.com/blog/dashboard-design-patterns-web-apps/)、[fuselab 设计系统](https://fuselabcreative.com/dashboard-design-system/)、[uipotion](https://uipotion.com/potions/layouts/dashboard)
- 模板对比：[adminlte 盘点](https://adminlte.io/blog/react-admin-dashboard-templates/)、[Refine 对比](https://refine.dev/core/docs/further-readings/comparison/)、[shadcn vs Mantine vs antd](https://zenn.dev/ui_memo/articles/4d49d34685e027?locale=en)

---

## 10. 相关文档

- `docs/UI设计风格.md` — 物料转移单页面的局部设计规范（圆角/阴影/徽章等模式可参照）
- `src/App.tsx` — 全局主题 token 唯一修改入口
- `src/ui/AppLayout.tsx` — 主布局
