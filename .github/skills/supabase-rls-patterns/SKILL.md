---
name: supabase-rls-patterns
description: This skill should be used when the user asks to "add RLS", "write RLS policy", "restrict data by employee", "restrict data by role", "bind auth user to employee", "implement Supabase permissions", "fix RLS", or works on employee-scoped access, admin access, or row-level security in Supabase/Postgres.
---

# Supabase RLS Patterns

Use this skill to implement or review row-level security in this repository without widening permissions by accident.

## Purpose

This project uses Supabase Auth plus employee-scoped business data. RLS is not an optional hardening step here; it is part of the core authorization model. Treat every RLS change as a data isolation change.

## Read First

Before writing SQL, read the existing design and current code paths:

- `docs/Supabase Day2-Day3 migration 与 RLS 设计稿.md`
- `supabase/migrations/`
- `src/services/`
- `src/services/database.types.ts`

If the request mentions mobile employee flows, also read:

- `docs/员工手机端工单录入开发计划.md`

## Workflow

1. Classify the access model first.
   Decide whether the table is admin-only, employee-self-only, employee-owned-through-parent, team-scoped, or mixed.
2. Identify the ownership path.
   Find the exact chain from `auth.uid()` to the business row, such as `auth.uid() -> employees.auth_user_id -> employees.id -> production_orders.employee_id`.
3. Check whether helper functions are needed.
   Prefer central helper functions such as `current_employee_id()` or `is_admin()` instead of repeating subqueries across every policy.
4. Split schema changes from policy changes.
   If bindings, roles, indexes, or helper functions are missing, keep table changes and RLS changes in separate migrations whenever possible.
5. Define permissions by operation.
   Write down `select`, `insert`, `update`, and `delete` separately. Do not assume one rule fits all operations.
6. Prefer least privilege.
   If delete is not clearly required, do not grant it. If employee self-update is risky on the identity table, block it.
7. Validate both read and write paths.
   For `insert` and `update`, verify both `USING` and `WITH CHECK` semantics so rows cannot be reassigned to another employee.
8. Review service-layer assumptions.
   If the frontend or service layer currently passes `employee_id`, decide whether that value should be ignored, overridden, or validated.
9. Document the risk surface.
   Explicitly note what happens for inactive employees, admins, unbound auth users, and legacy rows.

## Project Rules

- Use `security definer` helper functions carefully and fix `search_path`.
- Do not loosen policies just to make a query pass.
- Do not rely on frontend hiding of buttons as authorization.
- Do not let ordinary employees update identity-critical columns such as role, binding fields, or activation flags.
- Prefer migration files for DDL and RLS changes; avoid ad hoc SQL pasted into chat as the final answer.

## Output Expectations

When using this skill, produce:

- The ownership model
- A per-operation permission summary
- The migration or SQL policy draft
- A verification checklist for admin, employee, inactive employee, and unbound user
- Rollback or compatibility notes if existing policies are being replaced

## Common Pitfalls

- Querying protected tables inside policies without helper functions
- Forgetting `WITH CHECK` for inserts and updates
- Allowing employee updates on the identity table
- Reusing broad `authenticated` policies from earlier migrations
- Assuming parent-row ownership without testing child-table access
