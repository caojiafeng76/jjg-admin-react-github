# Workshop Order Auto-Close Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically close workshop orders 2 days after outbound quantity reaches 100%, permanently exempt manually reopened orders, and close all currently eligible orders.

**Architecture:** PostgreSQL stores the completion timestamp and permanent auto-close exemption on `sales_orders`. Security-definer trigger functions in a non-exposed `private` schema keep the timestamp synchronized after order or material-transfer changes, while a named Supabase Cron job calls a private auto-close function every 15 minutes. A tracked migration performs deterministic backfill and the initial production close-out.

**Tech Stack:** PostgreSQL 17, Supabase migrations/MCP, `pg_cron`, TypeScript 6, Vitest, React 19, TanStack Query 5

---

## File map

- Create `openspec/changes/workshop-order-auto-close/`: proposal, design, capability spec, and implementation checklist required by the repository workflow.
- Create `src/services/workshopOrderAutoCloseMigration.vitest.ts`: migration contract tests for columns, transition rules, Cron registration, and privilege hardening.
- Create one CLI-generated `supabase/migrations/*_workshop_order_auto_close.sql`: schema, private functions, triggers, backfill, initial close-out, and Cron registration. The exact timestamped path must come from `supabase migration new workshop_order_auto_close`, not be invented.
- Regenerate `src/services/database.types.ts`: generated database types after the migration is applied.
- Modify `CHANGELOG.MD`: record implementation and verification at the top.

### Task 1: Establish the Spec Workflow change

**Files:**
- Create: `openspec/changes/workshop-order-auto-close/.openspec.yaml`
- Create: `openspec/changes/workshop-order-auto-close/proposal.md`
- Create: `openspec/changes/workshop-order-auto-close/design.md`
- Create: `openspec/changes/workshop-order-auto-close/specs/workshop-order-auto-close/spec.md`
- Create: `openspec/changes/workshop-order-auto-close/tasks.md`

- [ ] **Step 1: Create the change skeleton**

Run:

```powershell
bun run spec -- new change workshop-order-auto-close
```

Expected: `openspec/changes/workshop-order-auto-close/` is created.

- [ ] **Step 2: Read the authoritative artifact instructions**

Run:

```powershell
bun run spec -- status --change workshop-order-auto-close --json
bun run spec -- instructions proposal --change workshop-order-auto-close --json
```

Expected: the change is in `propose`, and the CLI identifies the required artifact order.

- [ ] **Step 3: Write the artifacts from the approved design**

The capability spec must contain these requirements and scenarios:

```markdown
## ADDED Requirements

### Requirement: Start the automatic close waiting period at 100% outbound completion
The system SHALL record the time a production order first reaches an outbound quantity greater than or equal to its positive order quantity.

#### Scenario: An order crosses the completion threshold
- **WHEN** a material transfer makes total outbound quantity reach or exceed order quantity
- **THEN** the system records the current time as the completion time

#### Scenario: A completed order drops below the threshold
- **WHEN** transfer or order data makes total outbound quantity lower than order quantity
- **THEN** the system clears the completion time

### Requirement: Automatically close eligible orders after two days
The system SHALL set a production order to 已结案 when it has continuously satisfied the completion threshold for at least two days and automatic closing is not disabled.

#### Scenario: The waiting period expires
- **WHEN** the scheduled job sees an eligible order whose completion time is at least two days old
- **THEN** the order becomes 已结案 and receives a close time

### Requirement: Permanently exempt manually reopened orders
The system SHALL permanently disable automatic closing when an order changes from 已结案 to 生产中.

#### Scenario: A user reopens an order
- **WHEN** an authorized existing workflow changes 已结案 to 生产中
- **THEN** the order remains excluded from every later automatic close run
```

- [ ] **Step 4: Confirm apply readiness**

Run:

```powershell
bun run spec -- status --change workshop-order-auto-close --json
bun run spec -- instructions apply --change workshop-order-auto-close --json
```

Expected: all proposal artifacts are complete and apply instructions list the implementation tasks.

### Task 2: Add a failing migration contract test

**Files:**
- Create: `src/services/workshopOrderAutoCloseMigration.vitest.ts`

- [ ] **Step 1: Write the migration contract test before the migration**

```typescript
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const migrationDirectory = resolve(process.cwd(), 'supabase/migrations')
const migrationNames = readdirSync(migrationDirectory).filter((name) =>
  name.endsWith('_workshop_order_auto_close.sql'),
)

describe('workshop order auto-close migration', () => {
  it('defines completion tracking and permanent reopen exemption', () => {
    expect(migrationNames).toHaveLength(1)
    const sql = readFileSync(
      resolve(migrationDirectory, migrationNames[0]!),
      'utf8',
    ).replace(/\s+/g, ' ')

    expect(sql).toMatch(/add column if not exists completion_reached_at timestamptz/i)
    expect(sql).toMatch(/add column if not exists auto_close_disabled boolean not null default false/i)
    expect(sql).toMatch(/old\.status = '已结案'.*new\.status = '生产中'.*new\.auto_close_disabled = true/i)
  })

  it('synchronizes completion and schedules the private closer', () => {
    const sql = readFileSync(
      resolve(migrationDirectory, migrationNames[0]!),
      'utf8',
    ).replace(/\s+/g, ' ')

    expect(sql).toMatch(/create or replace function private\.refresh_workshop_order_completion/i)
    expect(sql).toMatch(/create trigger sync_workshop_order_completion_from_transfer/i)
    expect(sql).toMatch(/create or replace function private\.close_eligible_workshop_orders/i)
    expect(sql).toMatch(/cron\.schedule\( 'workshop-order-auto-close'/i)
    expect(sql).toMatch(/revoke all on function private\./i)
  })
})
```

- [ ] **Step 2: Run the test and observe the expected red state**

Run:

```powershell
bun run test -- src/services/workshopOrderAutoCloseMigration.vitest.ts
```

Expected: FAIL because no `_workshop_order_auto_close.sql` migration exists.

### Task 3: Create the database migration

**Files:**
- Create: the exact path printed by `bunx supabase migration new workshop_order_auto_close`

- [ ] **Step 1: Create the migration with the Supabase CLI**

Run:

```powershell
bunx supabase migration new workshop_order_auto_close
```

Expected: the CLI prints one new timestamped migration path. Use only that path in all following steps.

- [ ] **Step 2: Implement schema and private completion synchronization**

The migration must:

```sql
alter table public.sales_orders
  add column if not exists completion_reached_at timestamptz,
  add column if not exists auto_close_disabled boolean not null default false;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.refresh_workshop_order_completion(
  target_project_no text,
  reached_at timestamptz default now()
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  outbound_total bigint;
begin
  if nullif(btrim(target_project_no), '') is null then
    return;
  end if;

  perform 1
  from public.sales_orders
  where btrim(project_no) = btrim(target_project_no)
  for update;

  select coalesce(sum(transfer_quantity), 0)
  into outbound_total
  from public.material_transfers
  where btrim(project_no) = btrim(target_project_no);

  update public.sales_orders
  set completion_reached_at = case
    when order_quantity > 0 and outbound_total >= order_quantity
      then coalesce(completion_reached_at, reached_at)
    else null
  end
  where btrim(project_no) = btrim(target_project_no)
    and completion_reached_at is distinct from case
      when order_quantity > 0 and outbound_total >= order_quantity
        then coalesce(completion_reached_at, reached_at)
      else null
    end;
end;
$$;
```

Add security-definer trigger functions in `private` with `set search_path = ''` for:

- `material_transfers` AFTER INSERT/DELETE/UPDATE OF `project_no, transfer_quantity`, refreshing both OLD and NEW project numbers when different.
- `sales_orders` AFTER INSERT/UPDATE OF `project_no, order_quantity`, refreshing the affected project number.
- `sales_orders` BEFORE UPDATE OF `status`, setting `NEW.auto_close_disabled = true` only for `OLD.status = '已结案' AND NEW.status = '生产中'`.

Revoke all function execution from `public, anon, authenticated` after creation.

- [ ] **Step 3: Implement the auto-close function and Cron registration**

```sql
create or replace function private.close_eligible_workshop_orders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  closed_count integer;
begin
  update public.sales_orders as orders
  set status = '已结案'
  where orders.status = '生产中'
    and not orders.auto_close_disabled
    and orders.order_quantity > 0
    and orders.completion_reached_at <= now() - interval '2 days'
    and (
      select coalesce(sum(transfers.transfer_quantity), 0)
      from public.material_transfers as transfers
      where btrim(transfers.project_no) = btrim(orders.project_no)
    ) >= orders.order_quantity;

  get diagnostics closed_count = row_count;
  return closed_count;
end;
$$;

create extension if not exists pg_cron;

do $$
begin
  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'workshop-order-auto-close';

  perform cron.schedule(
    'workshop-order-auto-close',
    '*/15 * * * *',
    'select private.close_eligible_workshop_orders();'
  );
end;
$$;
```

- [ ] **Step 4: Backfill completion timestamps and perform the initial close-out**

Use a window sum ordered by `material_transfers.created_at, id`, group it by normalized project number, and write the first timestamp whose cumulative total reaches `sales_orders.order_quantity` into production orders. Then execute:

```sql
select private.close_eligible_workshop_orders();
```

The backfill must not modify already closed orders and must initialize every existing `auto_close_disabled` value to `false`, because historical reopen events are not distinguishable.

- [ ] **Step 5: Run the migration contract test**

Run:

```powershell
bun run test -- src/services/workshopOrderAutoCloseMigration.vitest.ts
```

Expected: PASS.

### Task 4: Apply and verify the production migration

**Files:**
- Modify: `src/services/database.types.ts` (generated only)

- [ ] **Step 1: Preview the tracked migration**

Run:

```powershell
bun run db:push:dry-run
```

Expected: only the workshop-order auto-close migration is pending and SQL passes the repository guard.

- [ ] **Step 2: Apply through Supabase migration tooling**

Apply the exact tracked SQL with Supabase MCP `apply_migration`. Expected: migration succeeds atomically, enabling Cron and closing the existing eligible set.

- [ ] **Step 3: Regenerate database types**

Run:

```powershell
bun run db:types
```

Expected: `sales_orders` Row/Insert/Update types include `completion_reached_at` and `auto_close_disabled`. Do not hand-edit the generated file.

- [ ] **Step 4: Verify remote schema, job, and production counts**

Run read-only queries proving:

```sql
select extname from pg_extension where extname = 'pg_cron';
select jobid, jobname, schedule, active
from cron.job
where jobname = 'workshop-order-auto-close';

select count(*)
from public.sales_orders orders
where orders.status = '生产中'
  and not orders.auto_close_disabled
  and orders.completion_reached_at <= now() - interval '2 days'
  and (
    select coalesce(sum(transfers.transfer_quantity), 0)
    from public.material_transfers transfers
    where btrim(transfers.project_no) = btrim(orders.project_no)
  ) >= orders.order_quantity;
```

Expected: extension exists, exactly one active 15-minute job exists, and the final count is `0`.

- [ ] **Step 5: Verify transitions inside a rolled-back transaction**

Insert a uniquely prefixed sales order and material transfers inside `begin`; verify crossing 100% writes `completion_reached_at`, reducing below 100% clears it, forcing the timestamp older than two days allows the private closer to close it, and changing the status back to 生产中 sets `auto_close_disabled = true`. Finish with `rollback` and verify no prefixed rows remain.

### Task 5: Regression verification and delivery records

**Files:**
- Modify: `CHANGELOG.MD`
- Modify: `openspec/changes/workshop-order-auto-close/tasks.md`

- [ ] **Step 1: Run repository verification**

```powershell
bun run test
bun run typecheck
bun run build
```

Expected: all commands pass. Do not claim completion if any fails.

- [ ] **Step 2: Run targeted browser QA**

Start `bun dev`, open `/workshop-order-list`, and verify:

- production and closed tabs still load;
- the existing status permission controls stay unchanged;
- an authorized manual reopen moves the order to production and refreshes the list;
- no new field or control leaks into the form, table, search, details, or export.

Use a disposable test order or restore the chosen order's original status after verification; do not alter a real production order solely for UI testing.

- [ ] **Step 3: Update change tracking**

Mark every completed checkbox in `openspec/changes/workshop-order-auto-close/tasks.md`. Add a new top `CHANGELOG.MD` entry containing the migration path, number of existing orders closed, generated type update, commands run, and browser QA result.

- [ ] **Step 4: Refresh Graphify and inspect the final diff**

```powershell
bun run graphify:update
git diff --check
git status --short
```

Expected: Graphify succeeds, the diff has no whitespace errors, and only task-owned files are modified.

- [ ] **Step 5: Archive the completed Spec Workflow change**

Run the repository CLI's archive instructions, confirm the tasks are complete, archive `workshop-order-auto-close`, and verify `bun run spec:list` no longer reports an active unfinished change.
