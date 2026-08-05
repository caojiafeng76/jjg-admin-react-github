## ADDED Requirements

### Requirement: Batch-oriented work-order list
The system SHALL display packaging work orders by their persisted input batch, with one list row per consistent batch and pagination based on batch count.

#### Scenario: A multi-employee input is listed
- **WHEN** an input batch contains multiple employee details with matching shared fields
- **THEN** the list SHALL show one row with all employee names and the summed quantity and defective quantity

#### Scenario: An employee filter matches a batch member
- **WHEN** a user filters by an employee assigned to a batch
- **THEN** the list SHALL return the complete batch row with all of its employees

#### Scenario: A legacy batch has inconsistent shared fields
- **WHEN** details sharing a legacy batch identity have differing non-employee fields
- **THEN** the list SHALL retain the details as separately editable rows and mark them as historical inconsistencies

### Requirement: Atomic batch maintenance
The system SHALL create and edit a work-order batch atomically, including changes to its selected employees.

#### Scenario: A user creates a multi-employee batch
- **WHEN** the user submits one work order with multiple employees
- **THEN** the system SHALL persist one batch identifier and create one split employee detail per selected employee

#### Scenario: A user changes batch employees
- **WHEN** the user saves an existing batch with employees added or removed
- **THEN** the system SHALL replace all employee details in the same transaction using the updated shared values and split quantities

### Requirement: Employee-detail export compatibility
The system SHALL retain employee-detail rows for all exports while using the persisted batch identifier for daily-report grouping.

#### Scenario: A batch is exported
- **WHEN** a user exports a multi-employee batch
- **THEN** the detail sheet SHALL include separate employee rows and the daily report SHALL aggregate only those rows sharing the same batch identifier
