## ADDED Requirements

### Requirement: Tooling inventory records

The system SHALL provide a tooling inventory page backed by `tooling_inventory`, with one inventory record per tooling data record and database-maintained stock totals.

#### Scenario: Inventory list displays stock totals

- **WHEN** a user opens the tooling inventory page
- **THEN** the system SHALL list tool code, tool name, specification, material, unit price, pending stock-in, pending stock-out, current stock, final stock, remarks, and update time

#### Scenario: Duplicate inventory is prevented

- **WHEN** a user creates or updates an inventory record for a tooling data record that already has inventory
- **THEN** the system SHALL reject the operation with a clear Chinese error message

#### Scenario: Inventory import updates current stock

- **WHEN** a user imports tooling inventory rows by tool code
- **THEN** the system SHALL match existing tooling data, upsert current stock and remarks, and preserve pending stock-in and pending stock-out values

### Requirement: Tooling stock-in workflow

The system SHALL provide a tooling stock-in page with draft/audited status transitions and database-side inventory synchronization.

#### Scenario: Pending stock-in contributes to pending inventory

- **WHEN** a stock-in record is created or updated with status `待审核`
- **THEN** the database SHALL include its quantity in the corresponding inventory `pending_stock_in`

#### Scenario: Audited stock-in increases current inventory

- **WHEN** a stock-in record status changes to `已审核`
- **THEN** the database SHALL add its quantity to the corresponding inventory `current_stock` and remove it from pending stock-in

#### Scenario: Audited stock-in is locked

- **WHEN** a user edits an audited stock-in record
- **THEN** the system SHALL allow remarks changes only and reject changes to tooling, status, or quantity unless it is a status toggle handled by the workflow

### Requirement: Tooling stock-out workflow

The system SHALL provide a tooling stock-out page for recipient-based tool consumption, including status transitions, inventory synchronization, import, export, and print.

#### Scenario: Pending stock-out contributes to pending inventory

- **WHEN** a stock-out record is created or updated with status `待审核`
- **THEN** the database SHALL include its quantity in the corresponding inventory `pending_stock_out`

#### Scenario: Audited stock-out decreases current inventory

- **WHEN** a stock-out record status changes to `已审核`
- **THEN** the database SHALL subtract its quantity from the corresponding inventory `current_stock` only if enough current stock exists

#### Scenario: Stock-out requires recipient information

- **WHEN** a user creates or imports a tooling stock-out record
- **THEN** the system SHALL require tooling data, recipient, purpose, stock-out date, and stock-out quantity

#### Scenario: Selected stock-out records can be exported and printed

- **WHEN** a user selects tooling stock-out rows and chooses export or print
- **THEN** the system SHALL generate an Excel export or PDF print document for the selected rows

### Requirement: Tooling routes and permissions

The system SHALL expose tooling inventory, stock-in, and stock-out through protected routes and menu entries with independent page permissions.

#### Scenario: Authorized user opens tooling pages

- **WHEN** a user has the matching `page:tooling-inventory`, `page:tooling-stock-in`, or `page:tooling-stock-out` permission
- **THEN** the corresponding menu entry and route SHALL render the actual tooling page instead of the coming-soon placeholder

#### Scenario: Unauthorized user is blocked

- **WHEN** a user lacks a tooling page permission
- **THEN** the route guard SHALL deny access consistently with other protected admin pages
