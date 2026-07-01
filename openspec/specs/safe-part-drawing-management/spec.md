# safe-part-drawing-management Specification

## Purpose
TBD - created by archiving change add-safe-part-drawing-upload. Update Purpose after archive.
## Requirements
### Requirement: One drawing per safe part setting

The system SHALL allow each `syney_safe_part_settings` record to reference at most one drawing file.

#### Scenario: Uploading a drawing for a part number

- **WHEN** a user uploads a supported drawing file for a件号配置 row
- **THEN** the system stores the file and records its path, original file name, MIME type, size, and upload time on that row

#### Scenario: Replacing an existing drawing

- **WHEN** a user uploads a new drawing for a row that already has a drawing
- **THEN** the system replaces the row metadata with the new drawing and keeps only the latest drawing as the active drawing

### Requirement: Drawing access actions

The system SHALL provide upload or replace, download, and online view actions from the件号配置 list.

#### Scenario: Download an uploaded drawing

- **WHEN** a row has an uploaded drawing and the user clicks download
- **THEN** the browser downloads the drawing using the stored original file name

#### Scenario: View an uploaded drawing online

- **WHEN** a row has an uploaded PDF or image drawing and the user clicks view
- **THEN** the system displays the drawing in an online preview without requiring the user to download it first

#### Scenario: Drawing not uploaded

- **WHEN** a row has no drawing
- **THEN** the list shows upload as the primary available drawing action and does not offer view or download as active actions

### Requirement: Private storage access

The system SHALL store part drawings in a private Supabase Storage bucket and use short-lived signed URLs for browser access.

#### Scenario: Open a drawing URL

- **WHEN** a user requests view or download for a drawing
- **THEN** the system generates a signed URL for that specific stored file path

#### Scenario: Unsupported direct public access

- **WHEN** a drawing file is stored in the bucket
- **THEN** it MUST NOT be publicly readable without a signed URL

