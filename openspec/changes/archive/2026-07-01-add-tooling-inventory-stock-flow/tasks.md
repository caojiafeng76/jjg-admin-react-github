## 1. Database

- [x] 1.1 Add migration for `tooling_inventory`, `tooling_stock_in`, `tooling_stock_out`, indexes, constraints, RLS policies, and inventory sync triggers.
- [x] 1.2 Validate migration SQL shape against existing tooling and youmai migration patterns.

## 2. Services And Hooks

- [x] 2.1 Add tooling inventory, stock-in, and stock-out service APIs with types, list queries, CRUD, imports, batch status updates, and snapshot mapping.
- [x] 2.2 Add tooling inventory, stock-in, and stock-out TanStack Query hooks with consistent query keys and inventory invalidation.

## 3. Feature Pages

- [x] 3.1 Add tooling inventory page components, search, table, form, and Excel import.
- [x] 3.2 Add tooling stock-in page components, search, table, form, and batch audit actions.
- [x] 3.3 Add tooling stock-out page components, search, table, form, Excel import/export, and PDF print.

## 4. Routing And Permissions

- [x] 4.1 Wire lazy pages, router elements, menu permissions, and permission definitions for the three tooling pages.

## 5. Verification

- [x] 5.1 Run required build/type verification and targeted lint/API checks for changed Ant Design code.
- [x] 5.2 Review changed files and document residual risks or validation gaps.
