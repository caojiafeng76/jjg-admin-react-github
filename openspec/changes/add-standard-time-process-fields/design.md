## Context

The main workshop `standard-time-list` reads and writes `public.process_standards` through `apiStandardTimes`, renders a desktop table plus a mobile card list, and currently exposes a cost-accounting-only Excel exporter. The supplied workbook defines the target process-sheet contract: 14 columns, merged title/group headers, and an image column. Supabase Storage is already used for private authenticated uploads elsewhere in the application.

## Goals / Non-Goals

**Goals:**

- Add nullable columns to the existing `process_standards` table without backfilling historical values.
- Store process images in a private bucket with authenticated select/insert/update/delete policies, and store only metadata/path in the row.
- Keep the main table responsive by showing a compact thumbnail and inline upload/preview actions; use a signed URL for image access.
- Keep numeric/text process fields editable through the existing standard-time form and include them in the row payload.
- Add a separate process-sheet exporter with the supplied workbook's column order, merged headers, widths, row heights, fonts, borders, and embedded image when available.

**Non-Goals:**

- Do not alter the existing cost-accounting export or its sensitive-field permission.
- Do not migrate historical rows to non-null defaults or infer process values from existing cost fields.
- Do not add a general media-management subsystem or image editing/cropping workflow.

## Decisions

1. **Use nullable process-specific columns on `process_standards`.**
   - The new fields are `tooling_fixture`, `clamping_count`, `clamping_quantity`, `operator_count`, `process_image_path`, `process_image_name`, `process_image_mime_type`, `process_image_size`, `process_image_uploaded_at`, and `process_note`.
   - Counts/quantity are numeric columns with no default so historical data remains `null`; new form entries can be blank and are normalized to `null`.
   - Alternative considered: a JSONB extension column. Rejected because list/export/type-safe filtering and future reporting need stable columns.

2. **Use a private `process-standard-images` Storage bucket.**
   - Paths are scoped by process-standard id and a timestamped sanitized file name.
   - Uploads accept PNG/JPEG/WEBP only, enforce a 10 MiB client and bucket limit, upload before row metadata update, delete the old object after successful replacement, and clean up the new object if metadata update fails.
   - Alternative considered: public URLs. Rejected because standard-time data is permissioned and images should follow authenticated access.

3. **Make image actions table-local and use signed URLs.**
   - `StandardTimeTable` owns upload/preview state and calls service functions; successful mutation invalidates the standard-time query key.
   - The preview uses Ant Design `Image`/`Modal` behavior through a short-lived signed URL; rows without an image render a clear upload action.
   - Alternative considered: upload in the create form. Rejected because a new row has no stable id until after insert and it would require a two-phase create flow.

4. **Build a second exporter from the supplied 14-column sheet contract.**
   - The new utility uses the existing `xlsx-js-style` and ZIP image embedding helper pattern, rather than replacing the cost exporter.
   - It exports selected rows and filtered rows through separate toolbar actions, preserving the existing permission key unless a separate permission is explicitly required later.

## Risks / Trade-offs

- [Risk] A private image requires a signed URL for every preview/export. → Mitigation: fetch a five-minute signed URL on demand and fail with a user-facing message when expired or inaccessible.
- [Risk] Exporting many remote images can be slow. → Mitigation: fetch images sequentially with bounded failure handling; export the row with an empty image cell if an image cannot be downloaded and report the count.
- [Risk] Generated database types can drift if migration is not applied. → Mitigation: apply/verify the migration and run the repository's `db:types` command before frontend type checking.
- [Risk] Existing consumers of `process_standards` may not know the new fields. → Mitigation: all new fields are nullable and existing `select('*')` consumers remain backward-compatible.

## Migration Plan

1. Add the migration, apply it through the configured Supabase workflow, and verify columns, bucket, and policies with read-only SQL.
2. Regenerate `src/services/database.types.ts` from the updated schema.
3. Deploy frontend code after type/build verification.
4. Rollback, if required, by reverting frontend usage and dropping only the added nullable columns/bucket after any stored process images are handled; no historical data is rewritten.

## Open Questions

- The supplied workbook contains one generic embedded image in the image column; the exporter will embed each row's uploaded image when available and leave the cell empty otherwise.
