## Context

See `proposal.md` for motivation. Workshop order completion is currently derived in the client from `sales_orders.order_quantity` and the sum of `material_transfers.transfer_quantity` grouped by trimmed project number. Status changes and `closed_at` already live in PostgreSQL, but the database does not store the time at which outbound completion reached 100% and no scheduler is installed.

Current project numbers are unique. Existing manual status mutations are permission-gated and must remain unchanged.

## Goals / Non-Goals

**Goals:**

- Keep one database-level completion timestamp consistent across every write path.
- Close eligible orders without requiring a browser session.
- Persist a permanent exemption after any 已结案 to 生产中 transition.
- Backfill and close existing eligible orders in the same tracked migration.

**Non-Goals:**

- Changing status permissions, buttons, forms, filters, or exports.
- Reconstructing historic manual reopen events that were not stored.
- Automatically reopening an order if later edits reduce outbound completion.

## Decisions

### Store completion and exemption on `sales_orders`

Add nullable `completion_reached_at` and non-null `auto_close_disabled default false`. Keeping the lifecycle data on the order makes scheduled evaluation indexed and auditable. A separate event table would add joins and retention rules without serving the requested behavior.

### Maintain completion with database triggers

Security-definer functions in the existing non-exposed `private` schema recompute the outbound total after material-transfer insert/delete or relevant update, and after order project/quantity changes. The function locks affected orders before aggregation to serialize concurrent transfers. It preserves the existing timestamp while completion remains at least 100%, clears it below 100%, and writes the current transaction time on a new crossing. Function execution is revoked explicitly; existing schema grants remain unchanged because other private reporting functions depend on them.

A cron-only reconstruction was rejected because editing an old transfer row could incorrectly make a newly completed order appear to have completed months earlier.

### Detect reopen transitions in PostgreSQL

A BEFORE UPDATE OF status trigger sets `auto_close_disabled` only when OLD is 已结案 and NEW is 生产中. This covers the existing single, form, and batch status paths without adding frontend behavior.

### Use a named Supabase Cron job

Enable `pg_cron` and schedule `workshop-order-auto-close` every 15 minutes with `cron.schedule`. Before scheduling, unschedule any job with the same name through `cron.unschedule`; never mutate `cron.job` directly. The job calls a private no-argument function and adds no grants to client roles.

### Backfill from current transfer history

For production orders, calculate cumulative outbound quantity ordered by transfer `created_at, id` and save the first timestamp reaching order quantity. Immediately run the close function. Existing closed orders remain untouched, and all current production orders start with `auto_close_disabled = false` because past reopen events are not distinguishable.


## Risks / Trade-offs

- [Cron precision] Actual closure can occur up to 15 minutes after the two-day boundary. → This bounded delay is acceptable for an administrative lifecycle transition.
- [Trigger write amplification] Every relevant transfer write also updates at most the order sharing its project number. → Only issue an UPDATE when the calculated timestamp differs.
- [Concurrent transfers] Two writes could otherwise miss a joint threshold crossing. → Lock matching order rows before calculating the aggregate.
- [Backfill inference] Historic transfer timestamps reflect current rows and cannot reconstruct deleted or previously edited values. → Use the best available current history and document the limitation.
- [Rollback] Dropping automation does not reverse orders already closed. → Unschedule first and require an explicit business decision before any data reversal.

## Migration Plan

1. Add columns and private functions/triggers.
2. Backfill `completion_reached_at` for current production orders.
3. Run the close function once in the migration transaction.
4. Enable `pg_cron` and register one named job.
5. Generate TypeScript types and verify production counts/job state.
6. To roll back automation, unschedule the named job before dropping its functions, triggers, and columns; do not automatically reopen orders.
