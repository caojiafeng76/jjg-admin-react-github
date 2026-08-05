## ADDED Requirements

### Requirement: Process-sheet export matches the supplied workbook contract
The system SHALL provide a separate export action for selected rows and current-filter rows that downloads a workbook with one sheet named `精加工产品工艺表`, the title `精加工产品工艺明细表`, the exact 14-column order `序号、客户名、型号、长度、料号、工序、工时（S)、工装治具、装夹次数、装夹数量(支）、人数、图示（切割、普通台虎钳通用图片）、说明、备注`, and formatting matching the supplied workbook's merged title/header rows, borders, Song font, widths, and row heights.

#### Scenario: Export selected rows
- **WHEN** the user selects standard-time rows and clicks the new process-sheet export action
- **THEN** the downloaded workbook contains only those rows in the required 14-column order and does not use the cost-accounting export layout

#### Scenario: Export filtered rows
- **WHEN** the user clicks the process-sheet export action for the current filters
- **THEN** the system fetches all matching rows and downloads them using the same process-sheet layout

### Requirement: Export includes process values and images
The exporter SHALL map each standard-time row's process fields to the corresponding workbook columns, preserve empty historical values as blank cells, and embed the uploaded image in the image column when it is available.

#### Scenario: Row with image is exported
- **WHEN** an exported row has a valid process image path
- **THEN** the workbook embeds that image in the row's image column and keeps the row's other process values aligned with the 14-column headers

#### Scenario: Row without image is exported
- **WHEN** an exported row has no process image
- **THEN** the workbook leaves the image cell empty and still exports the row successfully

### Requirement: Existing cost export remains unchanged
The system SHALL preserve the existing cost-accounting export action, output layout, filename behavior, and permission behavior while adding the separate process-sheet export.

#### Scenario: Existing cost export is used
- **WHEN** a user invokes the current cost-accounting export action
- **THEN** the system produces the existing cost-accounting workbook and does not switch it to the process-sheet format
