# K1 FixtureData clone / design-system fidelity review

**Recommendation:** REQUEST_CHANGES  
**Verdict:** REVISE  
**Review mode:** Read-only source and screenshot audit

## Scope and evidence inspected

- Design guidance: `docs/UI设计调研与改版指南.md` (especially §§ 3.1, 4.3–4.5, 6.1).
- Production UI path: `src/routes/router.tsx:502-508` → `FixtureDataPage.tsx` → `FixtureDataView.tsx` → `ToolingFixtureTable.tsx` / `ToolingFixtureMobileList.tsx`.
- Changed source: `src/features/tooling-fixture/FixtureDataPage.tsx`, `FixtureDataView.tsx`, `ToolingFixtureTable.tsx`, `ToolingFixtureMobileList.tsx`, `toolingFixturePresentation.tsx`, and `useToolingFixtures.ts`.
- Shared primitives/tokens: `src/ui/StatusPill.tsx`, `src/ui/TableState.tsx`, `src/App.tsx:20-131`, and `src/index.css:37-87`.
- Fresh captures (valid PNG signatures; created 2026-08-20 13:45, after the changed UI files):
  - `C:\Users\Administrator\AppData\Local\Temp\jjg-k1-fixture-desktop.png` (1440×900)
  - `C:\Users\Administrator\AppData\Local\Temp\jjg-k1-fixture-desktop-right.png` (1440×900)
  - `C:\Users\Administrator\AppData\Local\Temp\jjg-k1-fixture-mobile.png` (390×844)
- Capture harness: `k1_fixture_component_qa.py`, `k1_fixture_visual_qa.tsx`, and `k1_fixture_visual_qa.html`.
- Verification run: `bun run test -- src/features/tooling-fixture/ToolingFixtureTable.vitest.tsx src/features/tooling-fixture/useToolingFixtures.vitest.tsx src/ui/StatusPill.vitest.tsx src/ui/TableState.vitest.tsx` — 4 files / 20 tests passed.

## What is real and should be kept

- This is a live React component tree, not a screenshot or `background-image` substitute. The actual route imports `FixtureDataPage` at `src/routes/router.tsx:502-508`; it renders live Ant Design controls and data components through `FixtureDataView.tsx:112-275`.
- `StatusPill` is a reused primitive and the fixture mappings are semantic and exhaustive: `使用中 → warning`, `未使用 → success`, `正常 → success`, `维修 → warning`, `报废 → danger` in `toolingFixturePresentation.tsx:8-31`. Both the desktop table and mobile cards consume it (`ToolingFixtureTable.tsx:131-150`, `ToolingFixtureMobileList.tsx:79-95`).
- The responsive information architecture is directionally sound: the Ant Design breakpoint swaps the 2220px desktop table for live mobile cards at `ToolingFixtureTable.tsx:210-223`; the 390px capture proves the controls wrap and the core identity, statuses, storage location, date, selection, and actions remain available.
- The right-scrolled desktop capture proves the fixed left identifiers and right actions remain reachable; `remarks` is intentionally ellipsized (`ToolingFixtureTable.tsx:176-180`). Numeric maintenance cycle is right-aligned and tabular (`ToolingFixtureTable.tsx:160-167`).

## Findings

### CRITICAL

None. I found no raster/screenshot substitution in the route component tree.

### HIGH

1. **[product] The mobile surface bypasses the project token bridge with raw Tailwind palette utilities.** `ToolingFixtureMobileList.tsx:56,70,73,79,81,89,97,100,105,108` hard-codes `white` and multiple `slate-*` colors (with separate dark variants) rather than the Ant Design-backed semantic tokens exposed in `src/index.css:47-69`. This recreates the two-color-system problem explicitly called out by the design guide (`docs/UI设计调研与改版指南.md:28,148-165`) and will drift from `ConfigProvider` theme changes. The existing app-card primitive is also not used. **Must fix:** define/consume semantic surface, text, border, and muted tokens (or a project mobile-card primitive) that resolve through the same AntD/Tailwind bridge.

2. **[evidence] The supplied visual evidence cannot demonstrate the actual route or relevant UI states.** The capture script loads the isolated preview at `k1_fixture_component_qa.py:6,20`, not `/fixture-data`; the preview injects a single fixture and all operation callbacks are no-ops (`k1_fixture_visual_qa.tsx:83-122`). Every visual state flag is fixed to a successful populated view (`:84-101`). Therefore the captures do not verify the authenticated routed page, data-query loading/error behavior, empty state, selected-row action, or modal/form error. **Must fix before approval:** provide fresh captures from the real route (or a faithful integration harness with real state transitions) for populated, horizontal-scroll, mobile, loading, empty, error/retry, selected-row, and form-error states.

### MEDIUM

1. **[product] Desktop CJK wrapping splits semantic words in the product-name column.** `ToolingFixtureTable.tsx:100-104` constrains `product_name` to 140px without ellipsis or a CJK-safe cell renderer. In `jjg-k1-fixture-desktop.png`, the value wraps as `…文本演 / 示名称用于验证移 / 动端截断`, splitting “演示” and “移动”. This contradicts the requested CJK-truncation quality and makes the dense desktop row harder to scan. **Fix:** apply a deliberate single-line ellipsis/tooltip treatment or give the column sufficient width with a word-breaking strategy that preserves semantic phrases.

2. **[product] The desktop table intentionally opts back into the pre-redesign compact density.** `ToolingFixtureTable.tsx:237` sets `size="small"`, which selects `cellFontSizeSM: 12` and `cellPaddingBlockSM: 4` in `src/App.tsx:34-45`. The design guide calls these values the old overly tight baseline and recommends 13px/8px for data tables (`docs/UI设计调研与改版指南.md:18,116-131`). The screenshots show the resulting crowded header/body rhythm. **Fix:** use the documented default/medium density for this primary data screen, unless a documented density exception is approved.

### LOW

1. **[design-system] Filter-control widths remain one-off inline constants.** `FixtureDataView.tsx:155,161,173,185` sets raw widths (320/140/260) in JSX rather than a layout token or reusable filter-bar primitive. The values happen to wrap at 390px, but they are not centrally adjustable and do not express the guide’s 4px spacing/token contract. **Fix:** move these sizes into a named responsive layout primitive or tokenized class recipe.

2. **[evidence] No exact visual reference is supplied.** The design guide defines direction and constraints, not a pixel-identical target. I can assess conformance to its hierarchy, semantic color, and density rules, but cannot certify pixel-perfect clone fidelity beyond the three current captures.

## Blockers before approval

1. Replace the mobile card’s raw `slate-*`/`white` styling with the project’s shared semantic token/primitives.
2. Capture the real FixtureData route in all meaningful states, rather than only the static no-op component preview.
3. Resolve the visible desktop CJK word fragmentation.
4. Reconcile the `size="small"` table density with the documented 13px/8px design-system baseline.

## Residual risk

The populated desktop/mobile captures are fresh and show no raster fakery, glyph clipping, or mobile horizontal overflow. However, without routed-state captures and an exact reference image, visual fidelity for error/loading/empty/modal states and pixel-level matching remains unproven.
