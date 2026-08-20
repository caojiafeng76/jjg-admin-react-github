# K1 FixtureData clone / design-system fidelity review

- **Verdict:** PASS
- **Recommendation:** APPROVE
- **Review mode:** Read-only final gate, 2026-08-20
- **Goal:** Confirm that K1 FixtureData is a real, extensible design-system implementation with the requested responsive desktop/mobile presentation, not a screenshot-derived fake.

## Success criteria assessed

1. Live reusable React/Ant Design component tree; no raster or background-image substitute.
2. Token-driven color, spacing, typography, status, and dark-mode behavior.
3. Desktop/table and mobile/card hierarchy match the repository's industrial, dense-admin design contract.
4. Fresh component-harness renders show CJK truncation, responsive structure, semantic state colors, and state/action consistency.

## Evidence inspected

- Reference/design contract: `docs/UI设计调研与改版指南.md:73-73,136-140,232-237`; `src/App.tsx:20-46,56-86,92-144`; `src/index.css:37-70`.
- Reviewed UI source: `src/features/tooling-fixture/FixtureDataView.tsx:113-275`; `src/features/tooling-fixture/ToolingFixtureTable.tsx:53-250`; `src/features/tooling-fixture/ToolingFixtureMobileList.tsx:33-163`.
- Shared primitives/mappings: `src/features/tooling-fixture/toolingFixturePresentation.tsx:8-35`; `src/ui/StatusPill.tsx:25-49`; `src/ui/TableState.tsx:57-142`.
- Harness/integration source: `k1_fixture_visual_qa.tsx:11-131`; `src/features/tooling-fixture/FixtureDataPage.tsx:221-275`.
- Fresh direct-component captures, opened and inspected:
  - `C:\Users\Administrator\AppData\Local\Temp\jjg-k1-fixture-desktop.png` — PNG signature valid, 1440x900, last written 2026-08-20 13:51:01.
  - `C:\Users\Administrator\AppData\Local\Temp\jjg-k1-fixture-desktop-right.png` — PNG signature valid, 1440x900, last written 2026-08-20 13:51:01.
  - `C:\Users\Administrator\AppData\Local\Temp\jjg-k1-fixture-mobile.png` — PNG signature valid, 390x844, last written 2026-08-20 13:51:02.
- Current relevant working-tree diff and status, including the desktop/table integration change and untracked view/mobile/presentation files.
- Verification rerun by this reviewer:
  - `bun run test -- src/features/tooling-fixture/ToolingFixtureTable.vitest.tsx` — 3/3 passing.
  - `bun run typecheck` — passing.
  - `git diff --check` — no whitespace-error output.
  - Source scans of the three reviewed UI components — no raw color literals; no `img`, `canvas`, `picture`, media/embed, `background-image`, or URL image match.

## Confirmed implementation properties

- The page is a live tree: `FixtureDataView` composes real `Card`, filters, pagination, modal, `TableState`, and `ToolingFixtureTable`; the table composes real Ant Design `Table`/`QRCode`; the mobile breakpoint renders a dedicated `ToolingFixtureMobileList` (`FixtureDataView.tsx:138-275`, `ToolingFixtureTable.tsx:211-248`). No reviewed code turns a screenshot into UI.
- Reused primitives carry the presentation system: both layouts use `StatusPill`, both empty states use `TableEmpty`, and the desktop/mobile tone mappings are shared through `toolingFixturePresentation.tsx`.
- The mobile card's background, border, primary text, muted text, label text, and inner fill use `theme.useToken()` (`ToolingFixtureMobileList.tsx:33,59-63,79-80,89,92-105,114-136`). It has no one-off color literal.
- The direct harness copies the production light brand/radius/control and table surface values (`k1_fixture_visual_qa.tsx:55-78`) rather than using Ant Design defaults. Production uses the same brand token plus its CSS-token bridge (`App.tsx:22-46,92-114`).
- `product_name` is clipped with Ant Design table ellipsis on desktop (`ToolingFixtureTable.tsx:100-105`); the capture shows a complete CJK ellipsis rather than clipping or a broken final character. The mobile identity/product/location fields use `min-w-0` plus `truncate` (`ToolingFixtureMobileList.tsx:76-83,113-125`), and the 390px capture has no CJK orphan, tofu, baseline loss, or horizontal overflow.
- Semantic tones are consistent and correct for the captured state: `使用中` and `维修` resolve to warning/amber (`toolingFixturePresentation.tsx:8-31`), matching the visible amber dot+pills in both desktop-right and mobile. `未使用`/`正常` map to success and `报废` maps to danger, preserving the stated cross-page semantic system.
- The desktop-left and desktop-right captures demonstrate one wide table with left identity/QR columns, right status/lifecycle/maintenance/owner/remarks columns, and fixed row actions. The mobile capture replaces that wide-table interaction with a clear identity → 2x2 operational facts → actions hierarchy.
- The real page passes selection, filters, loading/error, pagination, form, and action callbacks into the view (`FixtureDataPage.tsx:221-275`), while the harness intentionally supplies fixed data/no-op handlers only for visual evidence (`k1_fixture_visual_qa.tsx:83-123`). This is not a mocked screenshot or a divergent rendering component.

## Findings by severity

### CRITICAL

None. No image/screenshot/background-image substitute or otherwise faked surface was found.

### HIGH

None. No token-bypass, missing shared primitive, broken responsive hierarchy, semantic status contradiction, or observed CJK truncation defect remains in the reviewed scope.

### MEDIUM

None.

### LOW

1. **[evidence] Dark-mode pixels are not directly captured.** The supplied harness is a light-mode fixture. The implementation itself is token-safe: mobile colors come from `theme.useToken()` and production switches Ant Design's dark algorithm plus the Tailwind `dark` class (`ToolingFixtureMobileList.tsx:33-136`; `App.tsx:98-114,136-144`). A future dark capture would validate contrast/rasterization end-to-end, but this is not evidence of a current defect.
2. **[evidence] The protected production route cannot be captured unauthenticated.** The known redirect to login without a session prevents a direct route screenshot. The direct component harness deliberately supplies the authenticated/permission context and production-like light theme values (`k1_fixture_visual_qa.tsx:32-49,55-127`), so this remains an authentication-boundary residual risk only, not an approval blocker.

## Blockers

None.

## Decision

**PASS / APPROVE.** The current FixtureData implementation is a live, token-driven, reusable responsive UI. The fresh left/right desktop and mobile evidence substantiate the requested fixes; the remaining dark-mode and protected-route limits are explicitly bounded evidence risks, not unresolved product failures.
