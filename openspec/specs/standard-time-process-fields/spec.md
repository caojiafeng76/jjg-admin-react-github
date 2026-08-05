## ADDED Requirements

### Requirement: Process fields are nullable and backward-compatible
The system SHALL store tooling/fixture, clamping count, clamping quantity, operator count, process image metadata, and process note as nullable fields on each standard-time row, without changing historical rows that do not have values.

#### Scenario: Historical row is read
- **WHEN** a historical `process_standards` row has no new process data
- **THEN** the API and frontend receive `null` for each unset new field and the row remains readable and editable

#### Scenario: New row omits optional process data
- **WHEN** a user creates a standard-time row without filling the optional process fields
- **THEN** the row is saved successfully with those fields as `null`

### Requirement: Standard-time UI displays and edits process fields
The system SHALL display tooling/fixture, clamping count, clamping quantity, operator count, and process note in the standard-time desktop table and mobile view, and SHALL expose the text/numeric fields in the existing edit form.

#### Scenario: Desktop row displays process data
- **WHEN** a row contains one or more process fields
- **THEN** the corresponding columns display the values and unset values use the existing empty-state presentation

#### Scenario: Mobile row displays process data
- **WHEN** the standard-time list is rendered at the mobile breakpoint
- **THEN** the process fields are visible in the row card without requiring horizontal table scrolling

#### Scenario: User edits process data
- **WHEN** a user submits the standard-time form with changed process fields
- **THEN** the update payload contains the changed values and the list refreshes through the existing standard-time query invalidation

### Requirement: User can upload and preview a process image
The system SHALL allow an authenticated user with standard-time edit access to upload, replace, and preview a PNG/JPEG/WEBP process image from the image column, and SHALL store image metadata/path separately from the binary object.

#### Scenario: Upload image to a row
- **WHEN** a user selects a supported image for a persisted standard-time row
- **THEN** the image is uploaded to the private process-standard bucket, metadata is saved on the row, and the table shows a thumbnail/preview action

#### Scenario: Replace existing image
- **WHEN** a user uploads a new image for a row that already has an image
- **THEN** the new image becomes the current image, the old object is removed after metadata succeeds, and the table refreshes

#### Scenario: Unsupported or oversized image
- **WHEN** a user selects a non-image or image larger than the configured limit
- **THEN** the upload is rejected with a Chinese user-facing error and no row metadata is changed

#### Scenario: Historical row has no image
- **WHEN** a row has a null process image path
- **THEN** the image cell renders an empty state and an upload action, without attempting a signed URL
