## 1. Database and storage

- [x] 1.1 Add a tracked Supabase migration for the nullable process fields on `process_standards`.
- [x] 1.2 Add the private `process-standard-images` bucket, 10 MiB image limit, and authenticated storage policies.
- [x] 1.3 Apply/verify the migration through the configured Supabase workflow and regenerate `src/services/database.types.ts`.

## 2. Service and query layer

- [x] 2.1 Extend `StandardTime`/`StandardTimeFormValues` normalization and create/update payloads with the process fields.
- [x] 2.2 Add process-image upload, signed preview URL, metadata update, replacement cleanup, and validation helpers.
- [x] 2.3 Add an image mutation hook/query invalidation path for `standard-times`.

## 3. Standard-time UI

- [x] 3.1 Add optional process fields to the standard-time form with null-preserving defaults.
- [x] 3.2 Add process columns and image upload/preview/replacement actions to the desktop table.
- [x] 3.3 Add process values and image state/actions to the mobile list.
- [x] 3.4 Add the separate process-sheet export buttons to selected-row and filtered-row flows while keeping cost export intact.

## 4. Process-sheet export

- [x] 4.1 Implement the 14-column workbook layout and formatting from the supplied workbook.
- [x] 4.2 Embed fetched process images into the image column and leave unavailable images blank without aborting the export.
- [x] 4.3 Add focused tests for column mapping, null handling, layout/merges, and preservation of the existing cost exporter.

## 5. Verification

- [x] 5.1 Run migration/schema read-only checks and inspect the affected query/update chain.
- [x] 5.2 Run targeted tests, `bun run test`, `bun run typecheck`, `bun lint`, `bun run build`, and Ant Design lint for changed UI files.
- [x] 5.3 Review the final diff for field-name consistency, cache invalidation, permissions, and unrelated changes.
