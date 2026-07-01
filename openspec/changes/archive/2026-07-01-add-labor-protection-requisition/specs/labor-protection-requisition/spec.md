## ADDED Requirements

### Requirement: Admin can access labor protection requisitions

The system SHALL provide an admin-only labor protection requisition page that is reachable from the labor protection menu and shows paginated requisition records.

#### Scenario: Admin opens requisition page from menu

- **WHEN** an authenticated admin clicks the labor protection requisition entry in the labor protection menu
- **THEN** the system loads the labor protection requisition page
- **THEN** the page shows a paginated list of requisition records

#### Scenario: Non-admin user cannot access requisition page

- **WHEN** a non-admin authenticated user tries to access the labor protection requisition route
- **THEN** the system denies access through the existing role protection mechanism

### Requirement: Admin can create and edit labor protection requisitions

The system SHALL allow admins to create and edit labor protection requisitions with a labor protection category reference, job title, positive integer quantity, and recipient name.

#### Scenario: Admin creates a requisition

- **WHEN** an admin submits a requisition form with a selected labor protection category, a job title, a positive integer quantity, and a recipient name
- **THEN** the system stores the requisition record successfully
- **THEN** the requisition list refreshes and shows the updated data

#### Scenario: Admin edits an existing requisition

- **WHEN** an admin opens an existing requisition and updates any of the allowed fields with valid values
- **THEN** the system persists the updated requisition
- **THEN** the requisition list refreshes with the edited values

#### Scenario: Form rejects invalid quantity

- **WHEN** an admin submits the requisition form with an empty quantity, a non-integer quantity, or a quantity less than 1
- **THEN** the system blocks submission and shows a validation error

### Requirement: Requisition category must reference labor protection data

The system MUST source requisition category options from labor protection data and only persist references to valid labor protection data records.

#### Scenario: Category options come from labor protection data

- **WHEN** an admin opens the requisition form
- **THEN** the category field shows selectable options loaded from existing labor protection data records

#### Scenario: Database rejects invalid category reference

- **WHEN** a requisition is written with a labor protection data reference that does not exist
- **THEN** the database rejects the write and no invalid requisition record is stored

### Requirement: Admin can delete labor protection requisitions

The system SHALL allow admins to delete one or more selected labor protection requisitions from the requisition list.

#### Scenario: Admin deletes selected requisitions

- **WHEN** an admin selects one or more requisition records and confirms deletion
- **THEN** the system removes those requisition records
- **THEN** the requisition list refreshes without the deleted rows
