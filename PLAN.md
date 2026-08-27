# 计划：修复 西尼订单列表/详情 条数不一致（14 vs 24）

## Context

- **现象**：用户反馈“西尼订单列表 订单明明只有14条数据，详情显示24条”。即从 `syney-po-list` 进入某个订单详情 `syney-po-list/:PoId` 后，详情页的明细条数/分页总数显示 24，与列表侧或业务预期的 14 条不一致。
- **业务背景**：
  - 西尼订单（`syney-pos`）与明细（`syney-po-items`, `PoId` FK）为 1:N。
  - 典型一次上载的订单 Excel 按 `生产编号(SONo)` 分组，每个 `SONo` 对应 1 个 `syney-pos` 行，其明细数业务上常为 14（见 `src/features/syney/PoList/ExcelUpload.tsx` 中 `parsedData.items.length % 14 === 0` 的校验色），但 Excel、去重、插入任一环节出错都会导致明细数膨胀。
  - 列表页 `PoList` 的数据走 `syney_pos_sorted` 视图 + `getSyneyPos` 的 `range+count` 分页；详情页 `PoDetail` 走 `getSyneyPoDetail` 的嵌入查询 `select('*, items:syney-po-items(*)')` 全量拉取，再在前端用 `AppPagination` 展示。
- **目标**：让详情页展示的明细条数与数据库真实归属该 `PoId` 的明细数一致，且分页/汇总口径与表格数据一致，消除“列表 14 / 详情 24”的错觉或真实脏数据。
- **非目标**：不改列表页的排序/筛选语义，不改 `syney_pos_sorted` 视图的排序键。

## Approach（推荐方案）

**先定性，再修前端分页，最后修数据口径**。不盲目加 `distinct`，先用只读查询确认 14 vs 24 的来源，再做最小修复。

### 假设分级（按排查优先级）

1. **A — 前端分页“假分页”**（高概率命中显示错觉）：
   - `src/features/syney/PoDetail/index.tsx` 解析 `page/pageSize`、计算 `total = records.length`、渲染 `<AppPagination total={total} />`，但 **从未对 `records` 做 `slice((page-1)*pageSize, page*pageSize)`**。
   - `src/features/syney/PoDetail/DetailTable.tsx` 直接 `dataSource={data}` 全量渲染，`DetailTable` 内部又另行 `useDetail()` 取全量 `items` 算汇总 `currentPageTotalQty`（用全量而非当前页），导致“分页控件显示 24 条”与“表格实际渲染行数/汇总”口径不一致。对比 `src/features/syney/SafePartSetting/SafePartSettingPage.tsx:241` 的正确做法是 `filteredData.slice(start, start + pageSize)`。
   - 若用户在第 1 页看到“共 24 条”却主观认为应为 14（或表格滚动区内实际多于一页），会报此 bug。

2. **B — 明细入库重复/未去重**（高概率命中真实脏数据）：
   - `src/services/apiSyneyPos.ts#createPo` 按 `getItemsWithExtraInfo` 以 `SONo~SerialNo` 分组后批量 `insert`，**未调用** `src/utils/syney.ts#distinctItems`（该函数仅在 `src/utils/syneyStoreReport.ts` 生成对账单时使用），若 Excel 同一 `SONo` 内存在相同 `PartNo+TaxUnitPrice` 的重复行，或 `getItemsWithParamSpec` 后的重复未合并，则会多插行导致 14 → 24。
   - 需要对比 `syney-po-items` 中该 `PoId` 的 `count` 与 `count(distinct PartNo)`、`group by PartNo` 的结果来确认。

3. **C — 查询/视图口径不一致**（中概率）：
   - 列表 `getSyneyPos` 查视图 `syney_pos_sorted` 带 `count: exact` + `range`；详情 `getSyneyPoDetail` 查基表 `syney-pos` 的嵌入 `items`。若 `syney-po-items` 存在孤儿行、`PoId` 外键未加 `ON DELETE CASCADE` 且被误用，或 `supabase .select('*, items:syney-po-items(*)')` 因缺少 `order` 导致前端误判重复，需要核对视图与基表的 `count` 是否一致。
   - 已知 `supabase/migrations/20260713040208` / `20260713044250` 中 `syney_pos_sorted` 仅是排序视图，不涉及 `join`，不会产生笛卡尔积，但值得用 `select count(*)` 互校。

> **执行顺序**：先用只读 SQL 定性 A/B/C，再决定是只修 A（前端切片）还是 A+B（前端+入库去重/清理脚本）。不直接改 DB schema，无 migration 除非确认需要。

## Files to modify（关键文件）

- `src/features/syney/PoDetail/index.tsx` — 增加客户端分页切片，或改为服务端分页；同步修复 `total` 与 `data` 的口径。
- `src/features/syney/PoDetail/DetailTable.tsx` — 移除内部重复 `useDetail()` 调用，汇总改为基于 `data`（当前页）或明确标注“全部合计”；行号 `render: (page-1)*pageSize + index +1` 已正确，但需保证 `data` 已是切片后数据。
- `src/services/apiSyneyPo.ts` — 可选：为 `getSyneyPoDetail` 增加 `items` 的确定性排序（如 `order by PartNo, id`）或分页参数；评估是否需要 `range`/`count` 的服务端分页替代前端全量拉取。
- `src/utils/syney.ts` / `src/services/apiSyneyPos.ts` — 若定性为 B，则在 `createPo` 插入前对 `items` 应用 `distinctItems` 或以 `PartNo+ParamSpec` 等业务键去重，并补充单测。
- `src/features/syney/queryKeys.ts` / `src/features/syney/PoDetail/useDetail.ts` — 若详情改为服务端分页，需扩展 queryKey 以包含 `page/pageSize`。
- `CHANGELOG.MD` — 按 `AGENTS.md` 强制要求：任何代码/配置/脚本/SQL/文档改动后在顶部追加记录（日期/类别/范围/摘要/验证）。

> 仅列关键文件，实际以最小改动为准；不碰 `src/services/database.types.ts`（自动生成）。

## Reuse（已存在可复用）

- `src/utils/syney.ts#distinctItems(items)` — 按 `PartNo-TaxUnitPrice` 合并 `Qty` 并重算 `TaxTotalPrice`。
- `src/utils/syney.ts#getItemsWithParamSpec(items, specs)` / `getItemsWithExtraInfo(items, startSerialNo, safePartSettings)` — 已在 `PoList/index.tsx` 与 `ExcelUpload.tsx` 使用，保持调用点不变。
- `src/ui/AppPagination.tsx` — 基于 `useSearchParams` 的分页控件，`total` 为总数，已在列表与详情复用。
- `src/hooks/useTableHeight.ts` — 计算 `scrollY`，无需改动。
- `src/features/syney/queryKeys.ts#syneyPoKeys.detail(id)` / `item(id)` — 详情与明细的缓存键。
- `src/features/syney/SafePartSetting/SafePartSettingPage.tsx:241` 的 `slice` 模式 — 详情分页修复的参考实现。
- `supabase/migrations/20260713040208_add_syney_atomic_update_and_sorted_view.sql` 中的 `syney_pos_sorted` 定义 — 列表 count 的权威口径。

## Steps（实施清单）

- [ ] **只读定性**：用 `bun run db:query -- --file <sql>` 或 Supabase Dashboard 对问题 `PoId` 执行：
  ```sql
  -- 1) 详情真实明细数
  select count(*) from "syney-po-items" where "PoId" = :poId;
  -- 2) 去重后数量
  select count(distinct "PartNo") from "syney-po-items" where "PoId" = :poId;
  -- 3) 重复行定位
  select "PartNo", "ParamSpec", count(*), sum("Qty")
  from "syney-po-items" where "PoId" = :poId
  group by "PartNo", "ParamSpec" having count(*) > 1 order by count(*) desc;
  -- 4) 列表视图 vs 基表总数互校（分页外）
  select count(*) from "syney-pos";
  select count(*) from syney_pos_sorted;
  -- 5) 该 PoId 的 items 是否含孤儿/重复 PoId
  select id, "No", "SONo", "PoId", "PartNo" from "syney-po-items" where "PoId" = :poId order by id;
  ```
  根据结果判定 A/B/C 主因（若 `count(*) = 24` 且 `count(distinct PartNo) = 14` 则 B；若 `count(*) = 14` 但前端仍显示 24 则 A）。

- [ ] **修复 A — 详情假分页**（无论 B 是否命中都需修，避免显示错觉）：
  - 在 `PoDetail/index.tsx` 增加
    ```ts
    const paginatedRecords = useMemo(() =>
      records.slice((page - 1) * pageSize, page * pageSize),
      [records, page, pageSize]
    )
    ```
    并将 `<DetailTable data={paginatedRecords} ...>` 传入；`total` 仍为 `records.length`。
  - 在 `DetailTable.tsx` 移除 `const { items, isLoading } = useDetail()`，汇总改为基于 `data`（当前页）或保留全量但重命名为“全部合计”并修正文案；`loading` 仅依赖 props，不再叠加内部 `isLoading`。
  - 核对行号与汇总：行号已用 `(page-1)*pageSize + index +1`，汇总若要“当前页合计”则用 `data`，若要“全部合计”则用 `records` 并改 label。

- [ ] **修复 B — 入库去重（若定性命中）**：
  - 决策点：是否应在 `createPo` 前对每组 `soItems` 调用 `distinctItems`。注意 `distinctItems` 的键是 `PartNo-TaxUnitPrice`，与踏板业务的去重键是否一致需与产品确认；若不一致，改用 `PartNo+ParamSpec` 或 `PartNo+Spec`。
  - 实现：`src/services/apiSyneyPos.ts#createPo` 中 `soItems` 处理后、`getItemsWithParamSpec` 之后插入 `distinctItems`，并补充 `apiSyneyPos.vitest.ts` 用例覆盖重复行合并。
  - 存量脏数据：提供一次性只读核查 SQL + 可选清理脚本（需产品确认后再执行 `delete`，默认不自动删）。

- [ ] **可选：服务端分页**（若单订单明细可能 > 1000 触及 PostgREST `db-max-rows`）：
  - 参考 `src/services/apiSyneySpecs.ts` 的 `while+range` 循环或为 `getSyneyPoDetail` 增加 `range` 分页参数，前端 `useDetail` 传入 `page/pageSize` 并回传 `count`。若当前明细均 < 100，无需此步。

- [ ] **回归与验证**（见下）。

- [ ] **更新 `CHANGELOG.MD`**：在文件顶部追加一条记录（日期/类别/范围/摘要/验证），与代码改动同一次提交。

## Verification（最低验证）

- **类型与单测**：
  ```bash
  bun run typecheck
  bun run test src/services/apiSyneyPo.vitest.ts src/features/syney/queryKeys.vitest.tsx
  bun run test src/utils/syney*  # 若改动去重逻辑
  ```
- **构建体积**：
  ```bash
  bun run build
  bun run check:bundle
  ```
- **Lint**：
  ```bash
  bun lint
  ```
- **手工验证**（需登录态）：
  1. 进入 `syney-po-list`，记录问题订单的 `PoId`/`SONo`/`No`，确认列表分页总数与筛选后总数。
  2. 进入 `syney-po-list/:PoId`，翻页（10/20/50/100），核对：分页总数 `total` == 表格行数总数（跨页求和）== `select count(*) where PoId=:id`；当前页表格行号连续且 `summary` 标注与实际求和一致。
  3. 若修复了去重：用同一 Excel 重复上传（ dry-run 或测试环境），确认新创建订单的明细数回到 14 且无重复 `PartNo`。
  4. 回归：列表的 `status/date/SONo` 筛选与预取（`usePos` 的 `prefetchQuery`）仍正常；`ReportDetail` 的同构分页未被误改。

## Open Questions（已最小化，需用户确认一项）

- **去重键确认**：`distinctItems` 当前键为 `PartNo-TaxUnitPrice`，是否即为西尼踏板“14 条为一组”的正确去重键？还是应按 `PartNo` / `PartNo+ParamSpec` 去重？请确认，避免误合并不同规格的同件号。
- **汇总口径**：详情页底部的“当前页合计”应为**当前页 Qty 求和**还是**全部 24 条的合计**？当前 `DetailTable` 的实现与文案不一致（代码用全量 `items` 算但文案写“当前页合计”），需定口径后统一。

