## 1. Data Model

- [x] 1.1 Add Supabase migration for sales order scheduling review fields and `process_schedules` JSON data.
- [x] 1.2 Extend workshop order TypeScript business types with scheduling review and process schedule fields.

## 2. Services And Hooks

- [x] 2.1 Implement production scheduling service helpers for process parsing, metric calculation, list retrieval, and order scheduling updates.
- [x] 2.2 Add TanStack Query hooks and mutation invalidation for production scheduling data.

## 3. User Interface

- [x] 3.1 Build the ProductionScheduling feature page with review, status, total pending, process pending, scheduled, and remaining tabs.
- [x] 3.2 Add review and process schedule edit modals with Ant Design forms and tables.
- [x] 3.3 Wire the independent order scheduling route, lazy page export, and navigation label without replacing the order status dashboard.

## 4. Verification

- [x] 4.1 Run the relevant database migration check or dry-run.
- [x] 4.2 Run the frontend build/type verification and fix regressions.
