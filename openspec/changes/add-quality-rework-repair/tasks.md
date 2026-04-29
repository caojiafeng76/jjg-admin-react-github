## 1. Database and Permissions

- [x] 1.1 Create Supabase migration for `quality_rework_repairs`, constraints, indexes, updated_at trigger, RLS, and `nav:quality` / `page:quality-rework-repair` permissions.
- [x] 1.2 Add frontend quality permission definitions and include them in the global permission registry.

## 2. Data Access

- [x] 2.1 Implement `apiQualityReworkRepair` service types and CRUD/list/search functions.
- [x] 2.2 Implement TanStack Query hooks with list query and create/update/delete invalidation.

## 3. User Interface

- [x] 3.1 Create quality rework repair form, search, table, and page container.
- [x] 3.2 Add quality menu item, lazy page export, protected route, and route label.

## 4. Verification

- [x] 4.1 Run database/schema verification for the new migration path.
- [x] 4.2 Run frontend validation (`bun run build`) and fix issues directly related to this change.

## 5. Order association and numbering follow-up

- [x] 5.1 Add Supabase migration for `quality_rework_repairs.project_no`, daily document sequence RPC, insert trigger, indexes, and comments.
- [x] 5.2 Extend quality rework repair service and hooks with order option lookup and next document number generation.
- [x] 5.3 Update返工返修 form/table/search behavior to select project number, prefill non-quantity order-derived fields, display project number, and keep document number auto-filled/read-only.
- [x] 5.4 Run database/schema validation and frontend validation for the follow-up change.
