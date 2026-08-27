# 计划：修复踏板分解单 AF1 / FN2 / DA2 上下分布不一致

## Context

- **用户反馈**：同为“踏板分解单”打印（`usePrintDecomposition`），图中订单 5251 的“中/后板”上下两格均有值，而 5252 的“中板”只有上格 `1244*550*2`、下格空白；用户追问：*为什么 AF1 在分解时能填入上下，FN2 却没有；且中板的 DA2 也想上下分布*。
- **截图证据**：`5251: 中板 1525*550*1 / 1525*550*1，后板 1525*540*1 / 1525*540*1` 正常；`5252: 中板 1244*550*2 / 空，后板 1244*540*2 / 空` 缺下格。AF ≈ `AF1`、FN ≈ `FN2`、DA ≈ `DA2` 为件号缩写（实际库中为 `XN2808AF`、`XN2808FN`、`XN3024DA` 等）。
- **期望**：`FN2` 应像 `AF1` 一样基于备注 `上头部/下头部` 或独立 `上/下` 字自动落到“上后板/下后板”两格；`DA2`（`XN3024DA`）作为中板应能同时填“上中板/下中板”（而非仅上）。

## Root Cause 分析（代码实证）

- **打印入口**：`src/features/syney/PoList/usePrintDecomposition.ts#fillPageData` → `src/utils/syneyDecomposition.ts#buildDecompositionCells` → `src/utils/syneySafePartRules.ts#{hasUpFlag,hasDownFlag,findSafePartRule}` + `syney_safe_part_settings.decomposition_role`。
- **AF1 为什么能上下**：
  - `syneyDecomposition.ts:isLegacyRearPlateCandidate` 仅对 `XN2808AF` / `XN3024Y997` 生效。`buildDecompositionCells` 对这类“后板候选”**优先**走 `getLegacyRearCellKey(item)`：通过 `Remark` 的 `上头部/上部/上` vs `下头部/下部/下`（`hasUpFlag/hasDownFlag`）路由到 `rearUpper` / `rearLower`。
  - 单条未标注方向时走 `unassignedRearItems` 兜底：`1 条 → 上1+下1`，`>=2 条 → 第0条上/第1条下`。现有单测 `syneyDecomposition.test.ts: 52/76 行` 覆盖 AF 的上/下分流。
  - 结论：AF 享受“旗标优先 + 单件拆 1+1”两重保障，所以能填满上下。
- **FN2 为什么不能**：
  - `syney_safe_part_settings` 中 `XN2808FN → rear_upper` 单一角色（`bun run db:query` 实测只有 `rear_upper` 一条），且 `isLegacyRearPlateCandidate` **未包含 `FN`**。因此 FN 完全绕过旗标分流，`getConfiguredCellKey` 直接命中 `rearUpper`，备注里的 `下头部` 被忽略，下格永远空白。同理图中 5252 后板 `1244*540*2` 只进上格。
  - 硬编码是根因：`XN2808FN` 未被视作后板候选。
- **DA2 为什么只有上**：
  - 库中 `XN3024DA → upper_middle` 唯一角色（实测），无 `lower_middle` 对应条目。`getLegacyCellKey` 对中板的映射是固定前缀：`XN3024BS/DA/...` 上、`XN3024BT/DG/...` 下，`DA` 仅命中上；未标注旗标时也无中板的 `unassigned` 拆分逻辑（仅后板有），所以单件 `Qty 2` 整体落上格 `1244*550*2`。
  - 截图中 5251 能上下，是因为其 `XN3024AE→upper` 与 `XN3024AF→lower` 是两条不同件号；5252 的 `DA2` 只有一条件号，自然无法像 AF 那样自动拆分。

## Approach（推荐方案，最小改动）

> **保持“配置优先、旗标优于配置”原则，复用后板已有的旗标+单件拆分模式，推广到 FN 与中板 DA。**

1. **后板侧：让 FN 具备与 AF 相同的旗标分流**
   - 将 `isLegacyRearPlateCandidate` 从 `XN2808AF | XN3024Y997` 扩展为包含 `XN2808FN`（及可选 `XN3024FN` 变体），或更通用地：若 `findSafePartRule(...).decomposition_role` 起止为 `rear_*`，则视为后板候选。推荐前者（最小风险）+ 后者作为兜底。
   - 不改 `XN2808FN` 的 DB 角色（仍 `rear_upper`），逻辑上旗标会覆盖配置：`上头部→rearUpper`、`下头部→rearLower`，无旗标时复用现有 `unassignedRearItems` 的 `1→1+1 / 2→上/下`。
   - 若希望 FN 长期可配置，也可在 `SafePartSettingPage` 新增一条 `XN2808FN-下` → `rear_lower` 的配置行作为显式方案，但代码层旗标分流仍需。

2. **中板侧：让 DA2（及同类单件号中板）支持上下分布**
   - 方案 A（推荐，零配置）：为中板增加与后板同构的 `unassignedMiddleItems` 兜底。
     - 识别：`XN3024DA` 当前在 `upper_middle` 组（`XN2808BP/BT/DA/DF/BS...`）；单件 `Qty ≥2` 时拆成 `ceil(Qty/2)` 上 + `floor(Qty/2)` 下，或复用后板的 `1→1+1` 语义（`Qty 2 → 上1/下1 + Qty 保持 2→1+1 的商用口径需确认`）。
     - 或旗标驱动：若 Remark 含 `上`/`下` 则按旗标分流，否则走拆分。
   - 方案 B（纯配置）：在 `syney_safe_part_settings` 新增 `XN3024DA-下` → `lower_middle`（或为 `DA2` 拆成两条前缀如 `XN3024DAU/DAA`）。优点无需代码，缺点每新增单件号都要补两行配置，且无法处理单件 `Qty 2` 拆上下。
   - 推荐 **A 为主 + B 为辅**：代码层支持单件拆分与旗标分流，配置层保留显式两行以便运营自行覆盖。

3. **不改动**：`syney_pos_sorted` 视图、`distinctItems` 去重、`PoDetail` 分页等已修复域。

## Files to modify（关键文件）

- `src/utils/syneyDecomposition.ts` — 扩展后板候选集（含 FN）、新增中板 `unassigned` 拆分（上限/下限）；保持 `ROLE_TO_CELL_KEY` 不变。
- `src/utils/syneySafePartRules.ts` — 若采用“角色前缀即候选”的通用化，需把 `UP_KEYWORDS/DOWN_KEYWORDS` 复用（已存在），不新增文件。
- `src/utils/syneyDecomposition.test.ts` — 补充用例：`XN2808FN` 上/下旗标分流、`XN3024DA` 单件 Qty2 拆上/下、`DA` 双件上/下。
- `src/features/syney/SafePartSetting/SafePartSettingPage.tsx` — 可选：仅改文案/校验提示，无强制代码变更；若走纯配置方案则提供运营指导。
- `supabase/migrations/*_syney_safe_part_settings_*.sql` — 仅当选择“新增配置行”时追加 `insert on conflict` 的配置迁移（`decomposition_role`），否则不新增 migration。
- `CHANGELOG.MD` — 顶部追加记录（日期/类别/范围/摘要/验证）。

> 不碰 `src/services/database.types.ts`（自动生成）、`usePrintDecomposition.ts` 的框架绘制（仅消费 `buildDecompositionCells`）。

## Reuse（已存在可复用）

- `src/utils/syneySafePartRules.ts#hasUpFlag/hasDownFlag` — 已支持 `上头部/上部/独立上` 与 `下头部/下部/独立下` 的分隔符容错。
- `src/utils/syneySafePartRules.ts#findSafePartRule` — 最长前缀匹配，已用于 `getConfiguredCellKey`。
- `src/utils/syneyDecomposition.ts#buildDecompositionCells` — 现有 `addCell` 的同 `spec` 合并与 `qtyOverride` 拆分逻辑。
- `src/utils/syneyDecomposition.test.ts` — 既有 `rearUpper/rearLower` 旗标测试模板。
- `syney_safe_part_settings.decomposition_role` 枚举：`front_plate/upper_middle/lower_middle/rear_upper/rear_lower/extension_upper/extension_lower/side_frame/cross_frame`。
- `bun run db:query "select part_no, decomposition_role from syney_safe_part_settings ..."` — 线上配置核查已验证。

## Steps（实施清单）

- [ ] **复现/核对**：用截图对应的两单 `Contract No: XNJD-FZ26-120-0289 / 0296` 查库核对明细与 Remark：
  ```sql
  select "PoId","PartNo","PartName","ParamSpec","Qty","Remark" from "syney-po-items"
  where "PoId" in (select id from "syney-pos" where "SONo" in ('XNJD-FZ26-120-0289','XNJD-FZ26-123-0296'))
  order by "PoId","PartNo";
  select part_no, decomposition_role from syney_safe_part_settings where part_no in ('XN2808AF','XN2808FN','XN3024DA','XN3024AF','XN3024AE');
  ```
  预期：289 单含 `AF` 两条（上/下 各1），296 单含 `FN` 与 `DA` 各 1 条（无下旗标或单条 Qty2）。

- [ ] **修后板 FN（已确认等同 AF）**：`syneyDecomposition.ts#isLegacyRearPlateCandidate` 改为
    ```ts
    return partNo.startsWith('XN2808AF') || partNo.startsWith('XN2808FN') || partNo.startsWith('XN3024Y997')
    ```
    并保持 `getLegacyRearCellKey` 的旗标优先（上头部/上部/上下→rearUpper/rearLower），已确认 FN 完全等同 AF。

- [ ] **修中板 DA（已定 1+1）**：在 `buildDecompositionCells` 新增与后板对称的 `unassignedMiddleItems` 收集：
    ```ts
    // 识别中板：role 为 upper_middle/lower_middle 或前缀命中 DA/BS/BT/DA 等，或配置为 upper_middle 的单件号中板
    // 旗标分流：Remark 含上→upperMiddle，下→lowerMiddle（复用 hasUpFlag/hasDownFlag，已确认等同 AF）
    // 无旗标单件按 1+1 拆：Qty 2 → 上1/下1，Qty 4 → 上2/下2，Qty 1 → 上1/下1 各1（与后板 unassignedRear 一致，用 qtyOverride）
    // 2 条以上无旗标按出现顺序上/下交替
    ```
    已确认口径，无需再问。

- [ ] **补单测**：在 `syneyDecomposition.test.ts` 追加 `FN` 上/下、`DA` 单件 Qty2→上/下 各1、`DA` 双件、`FN` 无旗标单件拆分 四组。

- [ ] **可选配置迁移**：若运营希望显式可配，新增 `supabase/migrations/XXXX_add_fn_da_decomposition_roles.sql`：
    ```sql
    insert into syney_safe_part_settings(part_no, name, decomposition_role, is_safe_part, need_print_label)
    values ('XN2808FN-LOW','…','rear_lower',true,true) on conflict(part_no) do nothing;
    -- DA lower 同理，或文档化运营在 SafePartSettingPage 手动新增 XN3024DA 低位
    ```

- [ ] **更新 `CHANGELOG.MD`**：顶部追加（日期/类别 修复/范围 decomposition/摘要 含 AF/FN/DA/验证）。

## Verification（最低验证）

- **类型与单测**：
  ```bash
  bun run typecheck
  bun run test src/utils/syneyDecomposition.test.ts
  bun run test src/utils/syneySafePartRules*
  ```
- **构建**：
  ```bash
  bun run build
  bun run check:bundle
  ```
- **Lint**：
  ```bash
  bun lint
  ```
- **手工验证**（需登录态，选两单打印分解单）：
  1. 选中 `XNJD-FZ26-120-0289`（含 AF）与 `XNJD-FZ26-123-0296`（含 FN/DA）→ 打印 → 核对 中板：`296` 的 `1244*550` 由 `2/空` 变为 `1244*550*1 / 1244*550*1`；后板：`FN` 的 `下` 落下格。
  2. 构造边界：单中板 `XN3024DA Qty2 无备注` → 上1+下1；双中板 `DA各1` → 上/下各1；`DA` 备注含 `上`/`下` → 按旗标。
  3. 回归：`AF` 原有上/下、`BS/BT` 等中板、`侧围/横围`、`加长板` 不受影响。

## Decisions（已确认）

- **DA2 拆分口径 = 1+1**（用户确认“选这个”）：单中板件号（如 `XN3024DA Qty 2` 无备注）按后板同构逻辑拆为 `上1 / 下1`（`qtyOverride: 1` 各一），`Qty 4 → 上2/下2` 以此类推；若 `Remark` 含 `上/下` 则优先按旗标分流，无旗标再均分。
- **FN2 等同 AF**（用户确认“是”）：`XN2808FN` 完全复用 `AF` 的后板旗标链路（`上头部/上部/独立上 → rearUpper`，`下头部/下部/独立下 → rearLower`，经 `hasUpFlag/hasDownFlag`），无旗标单件按 `1→上1+下1`。
- **配置 vs 代码**：DA 采用代码零配置的 `unassignedMiddle` 自动拆分，运营无需在 `SafePartSettingPage` 手补 `lower_middle`；仅当未来需显式覆盖时再通过 `decomposition_role` 配置覆盖。

