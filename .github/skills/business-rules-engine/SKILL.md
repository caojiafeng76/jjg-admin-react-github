---
name: business-rules-engine
description: This skill should be used when the user asks to "add validation rules", "design status transitions", "implement business rules", "calculate costs", "calculate standard time", "control order editing", or works on domain logic that is more than plain CRUD in workshop, production order, material transfer, runtime, or attendance features.
---

# Business Rules Engine

Use this skill whenever a task depends on domain constraints, status transitions, derived values, or cross-field validation.

## Purpose

This repository is not a simple admin CRUD app. Many modules involve implicit business rules: who can edit, when a record can change state, how totals are computed, and which fields must stay consistent. Centralize that reasoning before changing code.

## Read First

Read the relevant module docs and existing service logic:

- `docs/`
- `src/features/`
- `src/services/`

If the request mentions production orders, material transfer, machine runtime, attendance, or costing, inspect the corresponding feature and service folders first.

## Workflow

1. Identify the rule type.
   Decide whether the task is about state transition, calculation formula, editability window, ownership, cross-record consistency, or data completeness.
2. Separate core rules from UI behavior.
   Determine which constraints belong in the backend or database and which are only convenience checks in the UI.
3. Write the rule in plain language first.
   Example: “Employees may edit only draft rows they own” is clearer than starting from scattered boolean conditions.
4. Find all enforcement points.
   Check forms, services, database constraints, RLS, exports, and derived summaries so the same rule does not diverge by layer.
5. Model transitions explicitly.
   If a record changes status, list the allowed transitions and blocked transitions before writing code.
6. Check derived fields.
   If totals, standard times, quantities, or costs depend on multiple inputs, define the source of truth and recomputation timing.
7. Prefer minimal centralization.
   If repeated logic already exists, consolidate it. If the rule is truly local, avoid premature abstraction.
8. Validate edge cases.
   Include null values, zero values, inactive employees, deleted parents, duplicate submissions, and stale cached data.

## Project Rules

- Do not encode important business rules only in the UI.
- Do not silently widen editability just to make a workflow easier.
- Prefer explicit validation and clear Chinese error messages.
- If a rule affects permissions, coordinate with RLS and role handling instead of duplicating assumptions.
- If a calculation is reused, keep the formula and naming consistent across layers.

## Output Expectations

When using this skill, produce:

- Rule summary in plain language
- Affected entities and layers
- Transition or validation matrix when relevant
- Implementation location recommendation
- Verification cases, especially edge cases

## Common Pitfalls

- Hiding actions in the UI without backend enforcement
- Allowing impossible state transitions during updates
- Copying formulas into multiple modules with slight differences
- Ignoring derived totals after child-row edits
- Treating domain conflicts as generic technical errors
