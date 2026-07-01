# order-status-dashboard Specification

## Purpose
TBD - created by archiving change add-order-status-dashboard. Update Purpose after archive.
## Requirements
### Requirement: Navigate to order status dashboard

The system SHALL present the existing production scheduling navigation entry as “订单现状” while keeping the existing route identity available.

#### Scenario: User opens the navigation entry

- **WHEN** user clicks the former production scheduling menu item
- **THEN** system opens an order status dashboard titled “订单现状”

### Requirement: Aggregate production output by order, job, and operation

The system SHALL aggregate production order item qualified quantities by workshop order and process job, using the cost accounting job type (`process_standards.job_name`, shown as “工种”) as the dashboard process job, and display process jobs as the dynamic output columns on the corresponding order row.

#### Scenario: Order has production order items across process jobs

- **WHEN** an order has related production order items for multiple operations
- **THEN** the dashboard shows one row for the order and one qualified quantity cell per related process job

#### Scenario: User opens a process job output cell

- **WHEN** user opens a process job output cell
- **THEN** system shows the related production item details grouped by operation with qualified quantity totals per operation

#### Scenario: Cost accounting operation has parenthetical suffix

- **WHEN** cost accounting has a job type for an operation such as “冲葫芦孔（上）” or “冲葫芦孔（下）” and production details use the base operation “冲葫芦孔”
- **THEN** system matches the production details to the unique cost accounting job type instead of showing “未匹配岗位”

### Requirement: Show order progress signals

The system SHALL show per-order plan quantity, finished quantity, completion rate, yield rate, and production status using existing order and production order data.

#### Scenario: Order row is rendered

- **WHEN** dashboard data loads successfully
- **THEN** each row shows progress metrics and a status label derived from the available data

### Requirement: Search order status rows

The system SHALL let users filter the order status dashboard by fuzzy matching order date, project number, and model.

#### Scenario: User searches order status rows

- **WHEN** user enters any order date, project number, or model keyword and submits search
- **THEN** system shows matching order status rows and resets pagination to the first page

### Requirement: Split order status rows by closure state

The system SHALL let users switch the order status dashboard between production orders and closed orders.

#### Scenario: User switches order status tab

- **WHEN** user selects “生产中” or “已结案” on the dashboard
- **THEN** system shows only orders matching the selected closure state and resets pagination to the first page

### Requirement: Show material transfer data by order

The system SHALL aggregate material transfer records by workshop order and show transfer quantities and transfer context on the corresponding order row.

#### Scenario: Order has material transfer records

- **WHEN** an order has related material transfer records with the same project number
- **THEN** the dashboard shows transfer quantity, warehouse quantity, transfer record count, target workshops, and the latest transfer summary for that order

#### Scenario: User clicks material transfer quantity

- **WHEN** user clicks the material transfer quantity cell for an order with transfer records
- **THEN** system opens a modal showing that order's transfer details, including transfer time, target workshop, transfer quantity, operators, recipient, and audit status

### Requirement: Open process job output cell detail modal

The system SHALL let users click a process job output quantity cell in the dashboard and view the production order item details and operation-level qualified quantity summary for that order and process job.

#### Scenario: User clicks a process job output cell

- **WHEN** user clicks a process job output cell for an order
- **THEN** system opens a modal showing only the matching production order item details, including date, qualified quantity, defect quantities, operator, process job, operation, machine, and related remarks

