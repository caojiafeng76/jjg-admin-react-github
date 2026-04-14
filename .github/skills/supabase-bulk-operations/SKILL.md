---
name: supabase-bulk-operations
description: This skill should be used when the user asks to "import Excel data", "bulk insert", "bulk update", "upsert many rows", "repair bad data", "write import SQL", "deduplicate imported rows", or works on large Supabase/Postgres data operations, migration backfills, and idempotent data fixes.
---

# Supabase Bulk Operations

Use this skill for high-volume inserts, updates, upserts, backfills, and one-off repair jobs in this repository.

## Purpose

This project already contains multiple import rounds, repair SQL files, and generated import scripts. The main risk is not writing SQL at all; it is writing SQL that partially succeeds, duplicates data, or cannot be rerun safely.

## Read First

Inspect the existing bulk-operation patterns before writing anything new:

- `docs/imports/`
- `scripts/`
- `supabase/migrations/`
- relevant files in `src/services/`

If the request is about production orders, also inspect the latest production order import SQL and summary files in `docs/imports/`.

## Workflow

1. Classify the job.
   Decide whether it is import, backfill, deduplication, repair, re-keying, or delete/cleanup.
2. Define the idempotency rule.
   Identify the natural key or conflict key before writing the mutation. If rerunning the operation should be safe, design for that explicitly.
3. Separate validation from mutation.
   Prefer a preview query, staging selection, or dry-run SQL before the actual write.
4. Determine execution scope.
   Estimate row count, transaction size, locking risk, and whether batching is required.
5. Prefer deterministic ordering.
   When parent and child tables are involved, define clear operation order and rollback expectations.
6. Avoid mixing permanent logic with one-off repair logic.
   If the fix is a single historical repair, keep it in SQL or script form instead of pushing temporary branches into the app code.
7. Preserve auditability.
   Make it easy to answer which rows changed, why they changed, and whether the operation is safe to rerun.
8. Check downstream effects.
   Review related services, exports, summaries, and derived totals that may need recalculation or cache invalidation.

## Project Rules

- Prefer explicit SQL or import scripts over hand-wavy prose when the user asks for an executable bulk operation.
- Do not assume generated database types are current enough for new columns; verify before using typed equality filters.
- For destructive operations, produce a preview or verification query first.
- If an operation changes ownership, status, or parent-child relations, spell out the side effects.
- For large imports, prefer staged verification over one giant blind upsert.

## Output Expectations

When using this skill, produce:

- Operation type and idempotency strategy
- Conflict key or deduplication rule
- Preview query or verification step
- Executable SQL or script draft
- Post-run validation checklist
- Rollback or remediation notes

## Common Pitfalls

- Writing non-idempotent inserts for rerunnable imports
- Skipping preview queries for destructive cleanup
- Updating parent rows without reconciling child rows
- Mixing schema changes with data repair in the same step
- Assuming application-level validation is enough for offline import jobs
