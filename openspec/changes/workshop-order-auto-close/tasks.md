## 1. Migration Contract

- [x] 1.1 Add a migration contract test covering lifecycle columns, private trigger functions, reopen exemption, close eligibility, privilege revocation, and named Cron registration; verify it fails before the migration exists.
- [x] 1.2 Create the migration through `supabase migration new` and verify the contract test passes.

## 2. Database Lifecycle

- [x] 2.1 Implement private completion-refresh functions and order/transfer triggers; verify the migration SQL uses locked order rows and only updates changed timestamps.
- [x] 2.2 Implement permanent auto-close disablement for 已结案 to 生产中 transitions and verify the transition appears in the migration contract.
- [x] 2.3 Implement the private eligible-order closer and 15-minute named `pg_cron` job; verify client roles have no execute privilege.
- [x] 2.4 Backfill existing production-order completion timestamps and run the initial close-out in the migration; verify already closed orders are excluded.

## 3. Production Application

- [x] 3.1 Preview the tracked migration and apply it through Supabase migration tooling; verify the production migration succeeds.
- [x] 3.2 Regenerate `database.types.ts`; verify the generated sales-order types contain both lifecycle fields.
- [x] 3.3 Run read-only production queries; verify exactly one active Cron job exists and zero eligible orders remain in 生产中.
- [x] 3.4 Execute rolled-back lifecycle scenarios for threshold crossing, falling below 100%, two-day closure, and permanent reopen exemption; verify no test rows remain.

## 4. Regression and Delivery

- [x] 4.1 Run the migration contract test, full `bun run test`, `bun run typecheck`, and `bun run build`; verify all commands pass.
- [x] 4.2 Run database security and performance advisors; record any findings related to this migration.
- [x] 4.3 Manually verify the production build reaches the existing authenticated route guard; verify unchanged status controls, permissions, and cache refresh through the existing order-list component tests.
- [x] 4.4 Update `CHANGELOG.MD`, mark this checklist complete, and verify the final diff contains only the scoped implementation and generated types.
