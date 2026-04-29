## ADDED Requirements

### Requirement: Quality rework repair navigation

The system SHALL provide a PC-side first-level menu named `质量` and a child navigation item named `返工返修` for authorized users.

#### Scenario: Authorized user opens quality rework repair page

- **WHEN** a user has `nav:quality` and `page:quality-rework-repair` permissions
- **THEN** the sidebar displays `质量 / 返工返修` and the route `/quality-rework-repair` opens the返工返修 management page

#### Scenario: Unauthorized user cannot access quality rework repair page

- **WHEN** a user does not have `page:quality-rework-repair`
- **THEN** the route guard redirects the user to the access denied page

### Requirement: Rework repair record persistence

The system SHALL persist返工返修 records in a Supabase table with structured fields matching the provided申报表.

#### Scenario: Database stores申报表 fields

- **WHEN** an authorized user creates a返工返修 record
- **THEN** the database stores category, document number, product name, specification model, responsible unit, quantity, plan and actual rework time, defect description, application reason, application/audit/technical/improvement/verification people and dates, and related opinions/results

#### Scenario: Database enforces required quality fields

- **WHEN** a record is inserted or updated
- **THEN** the database rejects blank category, product name, responsible unit, non-positive quantity, and invalid返工返修 category values

### Requirement: Rework repair order association

The system SHALL associate返工返修 records with order management by project number and use order data to prefill corresponding申报字段.

#### Scenario: User selects a project number

- **WHEN** an authorized user creates or edits a返工返修 record and selects an existing order project number
- **THEN** the form stores the selected project number and prefills product name, specification model, and responsible unit from the order information
- **AND** the返工返修 quantity remains user-entered instead of being populated from order quantity

#### Scenario: User searches by project number

- **WHEN** an authorized user enters a project number keyword in the返工返修 search box
- **THEN** the list filters matching records by project number as well as existing keyword fields

### Requirement: Rework repair automatic document number

The system SHALL automatically generate a unique返工返修 document number for new records.

#### Scenario: User opens create form

- **WHEN** an authorized user opens the create返工返修 form
- **THEN** the system fills the document number using the current date in `YYYYMMDD` format followed by a 3-digit daily sequence number

#### Scenario: Record is created without a client-provided number

- **WHEN** a返工返修 record is inserted without a document number
- **THEN** the backend assigns the next unique daily document number before persistence

### Requirement: Rework repair CRUD

The system SHALL allow an authorized administrator to create, read, update, and delete返工返修 records from the management page.

#### Scenario: Administrator creates a record

- **WHEN** an administrator submits a valid返工返修 form
- **THEN** the record is inserted, the modal closes, and the list refreshes with the new record

#### Scenario: Administrator updates a record

- **WHEN** an administrator selects exactly one row and submits edited values
- **THEN** the record is updated and the list refreshes with the latest values

#### Scenario: Administrator deletes records

- **WHEN** an administrator selects one or more rows and confirms deletion
- **THEN** the selected records are deleted and the list refreshes

### Requirement: Rework repair list and search

The system SHALL provide a paginated table and keyword search for返工返修 records.

#### Scenario: User searches records by keyword

- **WHEN** an authorized user enters a keyword and submits search
- **THEN** the list filters records by document number, project number, product name, specification model, responsible unit, defect description, application reason, improvement action, or verification result

#### Scenario: User pages through records

- **WHEN** the返工返修 table has more rows than the current page size
- **THEN** the user can navigate pages and the table keeps stable row selection and row height behavior
