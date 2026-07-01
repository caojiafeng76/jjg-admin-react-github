## 1. Data Model

- [x] 1.1 Add a Supabase migration for `process_standards.is_last_process` with default false and a column comment.
- [x] 1.2 Apply or verify the migration path for the new database field.

## 2. Service And Cache

- [x] 2.1 Extend cost accounting service types to expose `is_last_process` without manually editing generated database types.
- [x] 2.2 Add a batch update service function for setting selected records to true or false.
- [x] 2.3 Add a TanStack Query mutation hook with the required cache invalidations.

## 3. Cost Accounting UI

- [x] 3.1 Show the last process flag in the cost accounting table and detail panel.
- [x] 3.2 Add administrator-only selected-row batch controls for setting true or false.
- [x] 3.3 Include the last process flag in selected and filtered Excel exports.

## 4. Verification

- [x] 4.1 Run TypeScript/build validation for the frontend change.
- [x] 4.2 Run Ant Design lint for changed Ant Design component files if the CLI supports it.
- [x] 4.3 Check OpenSpec apply readiness/status and summarize any remaining risks.
