## ADDED Requirements

### Requirement: Store last process flag on cost accounting records

The system SHALL store a boolean last process flag on each cost accounting record, defaulting to false for new and existing records.

#### Scenario: Existing records after migration

- **WHEN** the last process flag database migration is applied
- **THEN** every existing cost accounting record has a false last process flag unless later changed by an administrator

#### Scenario: New cost accounting record is created without explicit flag

- **WHEN** an administrator creates a cost accounting record without choosing a last process value
- **THEN** the record is stored with last process equal to false

### Requirement: Show last process flag in cost accounting

The system SHALL show each cost accounting record's last process flag in the list, detail panel, and Excel export.

#### Scenario: Administrator views cost accounting list

- **WHEN** the cost accounting list loads
- **THEN** each row shows whether the record is “末道” or “非末道”

#### Scenario: Administrator exports cost accounting records

- **WHEN** the administrator exports selected or filtered cost accounting records
- **THEN** the exported Excel file includes a last process column with “是” or “否” values

### Requirement: Batch update last process flag

The system SHALL allow administrators to batch set selected cost accounting records' last process flag to true or false.

#### Scenario: Administrator marks selected rows as last process

- **WHEN** an administrator selects one or more cost accounting records and confirms “设为末道”
- **THEN** the system updates all selected records to last process true and refreshes the cost accounting list

#### Scenario: Administrator clears last process on selected rows

- **WHEN** an administrator selects one or more cost accounting records and confirms “取消末道”
- **THEN** the system updates all selected records to last process false and refreshes the cost accounting list

#### Scenario: Administrator attempts batch update without selection

- **WHEN** an administrator clicks a batch last process action without selecting records
- **THEN** the system does not send an update request and shows a Chinese warning message

### Requirement: Restrict last process batch controls to administrator mode

The system SHALL expose batch last process controls only in the administrator cost accounting desktop workflow.

#### Scenario: Team leader opens theoretical time workflow

- **WHEN** a team leader opens the standard time page
- **THEN** the system does not show batch last process controls
