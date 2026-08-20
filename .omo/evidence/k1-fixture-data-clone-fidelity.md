# K1 FixtureData clone / design-system fidelity review

**Recommendation:** REQUEST_CHANGES  
**Scope:** Visual QA pass B — fidelity and Chinese/CJK precision. Read-only review completed 2026-08-20.

## Review contract and evidence

- Intent assessed: retain a dense enterprise admin list while applying the repository's blue/slate token system; verify hierarchy, toolbar wrapping, filters, table scrolling/fixed columns, QR sizing, pagination, pills, and CJK at desktop/mobile.
- Source-of-truth design guidance: `docs/UI设计调研与改版指南.md:73-94,100-146,228-237`; application token source: `src/App.tsx:22-46,92-130` and `src/index.css:47-70`.
- Captures directly opened and validated before judgment:
  - `C:\Users\Administrator\AppData\Local\Temp\jjg-k1-fixture-desktop.png` — valid PNG, fully composited 1440×900, timestamp 2026-08-20 13:37:22.
  - `C:\Users\Administrator\AppData\Local\Temp\jjg-k1-fixture-mobile.png` — valid PNG, fully composited 390×844, timestamp 2026-08-20 13:37:23.
- Captures are fresh relative to the reviewed render files (`FixtureDataView.tsx` 13:27:45 and `ToolingFixtureTable.tsx` 13:33:16), but are not a faithful app-root render; see HIGH-1.
- Full relevant working-tree diff inspected: `FixtureDataPage.tsx`, `FixtureDataView.tsx` (untracked), `ToolingFixtureTable.tsx`, `useToolingFixtures.ts`, plus the untracked capture harness `k1_fixture_visual_qa.tsx` / `k1_fixture_component_qa.py`. The unrelated `.codex/config.toml` and `tsconfig.app.tsbuildinfo` changes were not used to judge UI fidelity.
- No notepad path was supplied.

## What is substantiated

- The page is a live component tree, not a screenshot substitute. `FixtureDataView.tsx:113-275` composes Ant Design `Card`, fields, pagination, and the table; `ToolingFixtureTable.tsx:229-250` renders Ant Design `Table`; the QR is a live `QRCode` component at `ToolingFixtureTable.tsx:93-101`. The reviewed files contain no `img`, `canvas`, `background-image`, or URL-based raster substitution.
- The status primitive is reused and semantic: `ToolingFixtureTable.tsx:35-56,149-167` maps domain states to shared `StatusPill`; `StatusPill.tsx:25-32` uses the bridged success/warning/error tokens. No one-off hex color appears in the three requested files.
- In the captures, title/subtitle hierarchy is clear; the 390 px toolbar wraps fields atomically without CJK clipping; the 76 px QR remains sharp and readable; pagination is not clipped. The visible Chinese text has no orphaned glyphs, broken labels, tofu, or baseline clipping.

## Findings

### CRITICAL

- None. The inspected implementation is not a pasted screenshot/raster clone.

### HIGH

- [evidence] **HIGH — the provided captures do not render the repository token system and therefore cannot prove visual fidelity to it.** The capture entrypoint uses an unconfigured `<ConfigProvider>` at `k1_fixture_visual_qa.tsx:55`, rather than the production `App` configuration that supplies `BASE_TOKENS`, table tokens, Chinese locale, CSS-variable bridge, and `StyleProvider` (`src/App.tsx:22-46,92-130,163-184`). Direct pixel sampling confirms the captured primary button is `#1677FF` (desktop x=1380,y=72; mobile x=310,y=109), while the specified primary token is `#2563eb` (`src/App.tsx:23`). This contradicts the task's blue/slate success criterion. Re-capture the same component under the actual themed app root (or a test root that reproduces its configuration) before approval.

- [product] **HIGH — mobile fixed-column geometry makes the dense table operationally unusable.** At a ~334 px usable mobile table width in `jjg-k1-fixture-mobile.png`, the table fixes 120 px updated date, 110 px QR, and 150 px fixture number on the left (`ToolingFixtureTable.tsx:74-109`) plus the 30 px selection column (`src/App.tsx:45`) and fixes a further 150 px action column on the right (`ToolingFixtureTable.tsx:200-204`). The 560 px minimum pinned footprint exceeds the viewport before any scrollable business column can be exposed. The capture shows the consequence: date and action remain visible while the QR/header ordering is visually compromised and all meaningful central data are absent. This fails fixed-column usability and prevents a mobile operator from inspecting the row.

### MEDIUM

- [product] **MEDIUM — horizontal-scroll ownership and affordance are ambiguous.** `FixtureDataView.tsx:214` creates an outer `overflow-x-auto` region while `ToolingFixtureTable.tsx:239` separately assigns Ant Design's own 2220 px horizontal scroll. The mobile capture has no visible horizontal scrollbar, scroll hint, or exposed central column; the desktop capture is initial-position-only and relies on a fixed action overlay while content continues beneath it. One clearly owned horizontal surface and a verified reachable path to the non-pinned columns are required for this dense-table design.

- [evidence] **MEDIUM — CJK and pill fidelity are only partially evidenced.** The capture fixture has short CJK values (`夹具`, `扶梯踏板`, `冲床`) in `k1_fixture_visual_qa.tsx:14-26`; it does not exercise long product/equipment/manufacturer/remark values, and neither screenshot reaches the status/lifecycle columns. There is no observed CJK break defect in the shown text, and source widths are fixed, but the supplied captures cannot establish that realistic long Chinese values neither clip nor produce awkward one-character/orphaned wrapping, nor that the semantic pills visibly match the design system.

### LOW

- None.

## Blocking before approval

1. Produce fresh desktop and mobile captures under the real application token/theme root; the current default-Ant primary (`#1677ff`) evidence is invalid for a `#2563eb` fidelity claim.
2. Redesign or conditionally change the mobile table's fixed-column strategy so its pinned columns fit the viewport and central data are reachable with an obvious, single-owner horizontal scroll path.
3. Include a long-CJK-data state and a horizontally scrolled state that visibly covers status/lifecycle pills in the corrected capture set.

## Decision

`REQUEST_CHANGES`. No CRITICAL screenshot-faking or token-bypass finding was found in the requested component source, but both HIGH findings remain and block approval.
