# Tooling Data Copy Create Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a copy-create action to `/tooling-data` that opens the existing create form prefilled from exactly one selected row and submits through the create mutation.

**Architecture:** Keep the feature inside `ToolingDataPage`; add a copy-create mode and reuse the existing `ToolingDataForm`, modal, permission guards, and create mutation. No route, service, schema, or form-field changes are needed.

**Tech Stack:** React 19, TypeScript, Ant Design 6, Vitest, Testing Library, Bun.

---

### Task 1: Add failing page interaction coverage

**Files:**
- Create or modify: `src/features/tooling/ToolingData/index.vitest.tsx`
- Read for test conventions: `src/features/workshop/OrderList/index.vitest.tsx`

- [ ] **Step 1: Write tests for the required behavior**

Test the page with mocked list data, mutations, permission hooks, and child form/table components. Assert that the copy-create action warns unless exactly one row is selected; for one selected row it opens the modal with title `复制新增刀具资料`, passes the selected record as `initialValues`, and invokes `createToolingData` on submit without invoking `updateToolingData`.

- [ ] **Step 2: Run the focused test and verify it fails for the missing action**

Run: `bun run test -- src/features/tooling/ToolingData/index.vitest.tsx`

Expected: FAIL because the page does not yet render or handle the copy-create action.

### Task 2: Implement copy-create mode

**Files:**
- Modify: `src/features/tooling/ToolingData/index.tsx`

- [ ] **Step 1: Add copy-create state and handler**

Add `isCopyCreate` state. The handler must require `selectedRowKeys.length === 1`, find the selected row in `data?.items`, warn with `请选择一条数据进行复制新增` when invalid, then set `editingRecord` to the row, set `isEdit(false)`, set `isCopyCreate(true)`, set modal title to `复制新增刀具资料`, and open the existing modal. Clear `isCopyCreate` in normal create, reset, and successful close paths.

- [ ] **Step 2: Render the action using the existing button conventions**

Render an Ant Design button labeled `复制新增` beside the existing `EditButton`, disabled through the same permission/viewer rules as other management actions, and invoke the handler on click. Keep all selection validation in the handler so keyboard or future callers receive the same behavior.

- [ ] **Step 3: Keep submit routing on create**

Change the form `initialValues` condition to pass `editingRecord` for either edit or copy-create, while leaving `handleFinish`'s update branch guarded only by `isEdit`. This ensures copied values are displayed but submission calls `createMutation`.

- [ ] **Step 4: Run the focused tests and verify they pass**

Run: `bun run test -- src/features/tooling/ToolingData/index.vitest.tsx`

Expected: PASS, including assertions that create is called and update is not called.

### Task 3: Validate the page change

**Files:**
- Verify: `src/features/tooling/ToolingData/index.tsx`, `src/features/tooling/ToolingData/index.vitest.tsx`

- [ ] **Step 1: Run the full test suite**

Run: `bun run test`

Expected: all Vitest tests pass.

- [ ] **Step 2: Run lint and production build**

Run: `bun lint`

Run: `bun run build`

Expected: both commands exit with code 0.

- [ ] **Step 3: Run Ant Design lint for the changed page**

Run: `bunx antd lint src/features/tooling/ToolingData/index.tsx --format json`

Expected: no errors for the changed Ant Design usage.

- [ ] **Step 4: Review the diff**

Run: `git diff --check; git diff -- src/features/tooling/ToolingData/index.tsx src/features/tooling/ToolingData/index.vitest.tsx`

Confirm the change is limited to copy-create behavior and its regression coverage.
