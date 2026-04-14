---
name: mobile-responsive-patterns
description: This skill should be used when the user asks to "make this page mobile friendly", "build employee mobile pages", "improve responsive layout", "design H5 workflow", "adapt admin page for phone", or works on mobile-first order entry, scan flows, touch interactions, or employee-side pages.
---

# Mobile Responsive Patterns

Use this skill when building or reviewing mobile and employee-side experiences in this repository.

## Purpose

This project is expanding from a desktop-oriented admin panel into employee-side mobile flows. The right pattern is not “shrink the desktop page until it fits.” The right pattern is to redesign the workflow for narrow screens, touch input, and high-frequency entry.

## Read First

Read the mobile planning material and the target feature before implementing:

- `docs/员工手机端工单录入开发计划.md`
- relevant mobile routes, layouts, and feature modules in `src/`

If the task touches scanning or quick entry flows, inspect the related docs under `docs/` as well.

## Workflow

1. Decide whether the task is truly responsive or should be a separate mobile flow.
   If the desktop page is table-heavy, modal-heavy, or management-oriented, prefer a dedicated mobile screen instead of forcing responsive compression.
2. Reduce task scope per screen.
   Keep one primary goal per screen: list, detail, create, edit, or submit.
3. Replace desktop interaction patterns.
   Use cards, sections, bottom actions, progressive disclosure, and inline validation instead of wide tables and dense modal stacks.
4. Design for touch first.
   Check target sizes, scroll behavior, sticky primary actions, numeric input ergonomics, and keyboard overlap.
5. Minimize cognitive load.
   Hide management-only operations from employee flows and remove unnecessary columns or secondary metadata.
6. Protect data entry quality.
   Favor defaults, prefilled fields, guided steps, and clear confirmation states for high-frequency entry.
7. Respect weak-network scenarios.
   At minimum, think about loading states, retry messaging, accidental double-submit prevention, and recovery after refresh.
8. Verify both mobile and desktop.
   A change that improves the phone view must not silently break the existing admin desktop workflows.

## Project Rules

- Prefer “single system, dual entry” over cloning a separate app unless explicitly required.
- Do not keep desktop-only actions in employee mobile flows.
- Avoid large editable tables on phones.
- Prefer card lists and stepwise forms over modal-heavy dense CRUD patterns.
- If a workflow depends on ownership or role, coordinate with route guards and RLS assumptions.

## Output Expectations

When using this skill, produce:

- A mobile-vs-desktop interaction choice
- The target screen breakdown
- Key responsive or touch interaction decisions
- Risk notes for keyboard, scrolling, and double submission
- Verification notes for both employee mobile and admin desktop views

## Common Pitfalls

- Compressing desktop tables into unusable narrow views
- Keeping bulk actions and exports in employee flows
- Ignoring fixed action bars and keyboard overlap
- Using the same modal workflow on desktop and mobile
- Treating responsiveness as CSS-only when the workflow itself should change
