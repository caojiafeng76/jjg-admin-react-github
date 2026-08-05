## Why

`standard-time-list` currently stores and displays only the cost-accounting subset of a finishing process standard. The workshop needs the complete precision-finishing process sheet, including fixture/setup information, staffing, notes, and a user-managed process image, while preserving existing historical rows and the current cost export.

## What Changes

- Add nullable process-sheet fields to `process_standards` for tooling/fixture, clamping count and quantity, operator count, process image metadata, and process notes.
- Add a private Supabase Storage bucket and authenticated policies for process images.
- Display the new fields in the standard-time table and mobile view; allow editing the text/numeric fields and uploading/replacing/previewing the image.
- Add a separate export action that produces the 14-column precision-finishing process sheet matching the supplied workbook layout; keep the existing cost-accounting export unchanged.
- Keep all new fields nullable so historical data remains `null` until users fill it in.

## Capabilities

### New Capabilities

- `standard-time-process-fields`: Store, edit, display, and upload/preview the additional precision-finishing process fields.
- `precision-finishing-process-export`: Export selected or filtered standard-time rows using the supplied 14-column process-sheet format.

### Modified Capabilities

<!-- No existing OpenSpec capability has the standard-time process-sheet contract. -->

## Impact

- Supabase migration, `process_standards` generated TypeScript types, storage policies, and frontend API layer.
- Workshop standard-time list form/table/mobile UI and export toolbar.
- New export utility and focused unit tests; no new runtime dependency is expected.
