# Ultrawork Notepad — 精切转移单数量字段与导出差异
Started: 2026-08-03T10:19:50+08:00

## Plan (exhaustively detailed)
1. Read project task instructions and the precision-cutting-transfer field, service, route, and export flows.
2. Determine the database representation and whether a migration is required; identify existing comparable material-transfer behavior.
3. Add failing unit tests for export quantity columns and two calculated differences, including blank values.
4. Add the smallest schema/service/type/page-form/table changes so actual long-material, process-card, and ERP quantities are distinct and persisted.
5. Update the Excel export to show actual long-material quantity and both calculated differences.
6. Run targeted RED/GREEN tests, then typecheck/lint/build and page/export real-surface QA.
7. Update CHANGELOG.MD, self-check the diff, obtain an independent review, and clean temporary QA resources.

## Success criteria + QA scenarios
- Deliverable / HEAVY: the precision-cutting-transfer workflow persists and presents three distinct long-material quantities; HEAVY because the request introduces persisted domain fields and cross-layer export behavior.
- C1 happy path: `bun run test -- src/utils/precisionCuttingTransferExcel.vitest.ts` will first fail because a fixture with actual=10, process-card=12, ERP=8 has no respective columns/differences; after implementation it passes, and the test artifact verifies the exported workbook values are `10`, `-2`, `2` (actual minus process-card / ERP).
- C2 edge path: the same test will first fail for absent process-card/ERP values; after implementation it passes and the exported cells remain blank rather than misleading zero differences.
- C3 regression / user surface: run the local Vite app through browser navigation to the existing 精切转移单 route, operate its export action with representative data, and capture a screenshot/action log plus downloaded workbook inspection that proves the actual/process-card/ERP/difference headers exist. PASS only if all five fields are visible in the workbook and the two difference values match the row inputs.
- C4 adjacent regression: `bun run typecheck`, `bun lint`, and `bun run build` all exit 0 after affected field/service/form/table changes.
- Failing-first proof: C1/C2 test named `precisionCuttingTransferExcel.vitest.ts` is captured RED before production code, then GREEN after; C3 is captured through the real browser/download path after GREEN.
- I'll stop right away when the three requested quantities and two export differences are observable through the precision-cutting-transfer export, all criteria pass with recorded evidence and cleanup, and an independent review approves.

## Now
Read the exact precision-cutting-transfer field and export implementations before selecting the test seam.

## Todo
1. Inspect precision-cutting-transfer feature/service/database mappings and comparable material-transfer export tests.
2. Write and run the failing export tests for C1/C2.
3. Implement field persistence and page integration for C1.
4. Implement export columns/formulas for C1/C2.
5. Run targeted GREEN tests and diagnostics for C1/C2.
6. Run browser/download QA for C3; clean all QA resources.
7. Update CHANGELOG.MD; run C4 validation; request independent review.

## Findings
- Graphify index rebuilt successfully: 1,050 files, 8,114 symbols, 7,287 relationships.
- Precision-cutting-transfer has a dedicated feature, API service, and Excel exporter: `src/features/precision-cutting-transfer/index.tsx`, `src/services/apiPrecisionCuttingTransfers.ts`, `src/utils/precisionCuttingTransferExcel.ts`.
- No uncommitted files were reported by the initial `git status --short` check.
- Sequential design analysis: retain `long_material_quantity` as the persisted actual value, add separately named process-card/ERP fields, and calculate each export difference as actual minus reference only when that reference is present.
- The initial schema uses `long_material_quantity`; database type regeneration is mandatory after the additive migration and before the final typecheck.
- Serena MCP is not exposed in this session; Graphify and LSP are the documented fallback for structural and symbol-level context.
- C1/C2 RED captured with `bun run test -- src/utils/precisionCuttingTransferExcel.vitest.ts`: expected header `实际长料数量`, received `长料数量`; missing process-card field currently resolves to existing defect count `0`. The failure proves the exporter lacks the requested columns/differences.
- C1/C2 GREEN captured with `bun run test -- src/utils/precisionCuttingTransferExcel.vitest.ts`: 2/2 tests passed. The exporter now writes the three quantity columns and formulas `H3-I3` / `H3-K3`, and preserves blanks when references are absent.
- Typecheck GREEN: `bun run typecheck` completed with exit 0 after the cross-layer code change.
- Database tooling is unavailable in this workspace: `bun run db:doctor` reports all CLI/login/query/migration checks failed because `supabase` is not on PATH; `bunx supabase` also exited 1. The additive migration is tracked locally, but it cannot be pushed or used to regenerate `database.types.ts` in this session.
- C3 partial-evidence result: browser control reported `No browser is available`, so the page/download interaction could not be driven. The closest faithful local surface is the export work-book test, which passed with values `10`, `12`, `-2`, `8`, `2` and exact formulas; remote authentication/schema deployment remain required for browser QA.
- C4 GREEN: `bun lint`, `bun run build`, and Ant Design lint for the form/table/detail all exit 0. The build emitted the precision-cutting-transfer and exporter chunks successfully.
- Full-suite diagnostic: both `bun run test` and `bun run test -- --no-file-parallelism` ended with the same unattributed `Worker exited unexpectedly` after 104/105 files and 434/439 tests passed. The targeted new export suite remains green; the repeat proves this is not a parallel-worker-only failure.
- Cleanup receipt pending: remove debug journal and restore the compiler-generated tsbuildinfo change before final review.
- Cleanup receipt: removed `.debug-journal.md`; restored the typecheck/build-generated `tsconfig.app.tsbuildinfo`; `git diff --check` passed. The durable notepad remains at this path by design.
- Independent review requested: `/root/precision_review` owns a read-only review of the migration, field persistence, presentation surfaces, and export formulas.
- Reviewer initially requested changes only for absent durable artifacts and unapplied migration/generated types. Resolution: Supabase MCP applied `add_precision_cutting_transfer_long_material_quantities`; read-only schema query verified actual/process-card/ERP integer columns and their nullable/comment contracts; Supabase generator rewrote `src/services/database.types.ts`; targeted test GREEN capture saved at `.omo/evidence/precision-cutting-transfer-export-test.log`.
- Durable validation receipts: `.omo/evidence/precision-cutting-transfer-lint.log`, `.omo/evidence/precision-cutting-transfer-build.log`, and `.omo/evidence/precision-cutting-transfer-antd-lint.log` all captured exit-0 runs after the generated type refresh.
- Sequential design analysis: retain `long_material_quantity` as the persisted actual value, add separately named process-card/ERP fields, and calculate each export difference as actual minus reference only when that reference is present.
- The initial schema uses `long_material_quantity`; database type regeneration is mandatory after the additive migration and before the final typecheck.
- Serena MCP is not exposed in this session; Graphify and LSP are the documented fallback for structural and symbol-level context.

## Learnings
- The export must distinguish intentionally blank reference quantities from numeric zero so differences are not fabricated.

## Completion
- Independent final review: APPROVE. The reviewer confirmed the durable lint, build, Ant Design lint, and `git diff --check` receipts; report: `.omo/evidence/precision-cutting-transfer-code-review.md`.
- Remote migration was applied and the generated database types were refreshed. The only remaining verification limitation is browser/download QA: no browser is available in this environment; the workbook structure and formulas are covered by the targeted export test.
