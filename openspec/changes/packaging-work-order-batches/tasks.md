## 1. Database batch model

- [x] 1.1 Add and backfill `input_batch_id`, batch indexes, grouped-list RPC, and atomic batch-save RPC.
- [x] 1.2 Apply the migration and regenerate Supabase database types.

## 2. Service and export behavior

- [x] 2.1 Add failing service tests for batch identity, split details, raw export retrieval, and RPC calls.
- [x] 2.2 Implement batch service types, grouped list retrieval, batch create/update/delete, and raw detail export retrieval.
- [x] 2.3 Update the daily-report grouping key and its regression tests.

## 3. Work-order UI

- [x] 3.1 Update the table and form to display and edit batch-level records, including per-person and total work hours.
- [x] 3.2 Preserve permissions, selection, pagination, and cache invalidation for batch mutations.

## 4. Verification

- [x] 4.1 Run targeted tests, full tests, type check, lint, Ant Design lint, and production build.
- [x] 4.2 Verify migrated batch counts, historical conflicts, RPC behavior, and export grouping in the database.
