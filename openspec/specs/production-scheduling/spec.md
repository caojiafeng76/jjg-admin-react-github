# production-scheduling Specification

## Purpose
TBD - created by archiving change add-production-scheduling. Update Purpose after archive.
## Requirements
### Requirement: Order review fields are maintained

The system SHALL allow users to maintain order scheduling review fields derived from the Excel order review sheet, including order date, planned start date, planned finish date, delivery review result, process requirement, tooling status, capacity, bottleneck processes, material status, order category, delivery priority, and scheduling remark.

#### Scenario: Save order review

- **WHEN** a user edits review fields for a workshop order and confirms the form
- **THEN** the system SHALL persist the review fields on the order and refresh the production scheduling views

### Requirement: Process schedules are maintained per order

The system SHALL allow users to maintain process-level scheduling rows for each workshop order, including process, status, required production date, scheduled date, last scheduled date, scheduled quantity, and remark.

#### Scenario: Create schedules from process flow

- **WHEN** a user opens process scheduling for an order with a process flow and chooses to initialize rows from the flow
- **THEN** the system SHALL create editable process rows for the recognized processes without changing the order quantity

#### Scenario: Save process schedules

- **WHEN** a user saves process schedule rows for an order
- **THEN** the system SHALL persist the rows and recalculate scheduled and remaining quantities in the scheduling views

### Requirement: Scheduling status summarizes Excel metrics

The system SHALL display a scheduling status view with total pending quantity, scheduled quantity, remaining scheduling quantity, processed quantity, transferred quantity, and percentage columns matching the Excel scheduling status sheet.

#### Scenario: View scheduling status

- **WHEN** a user opens the production scheduling page
- **THEN** the system SHALL show order rows with scheduling totals and percentages calculated from order quantity, process schedule rows, production order items, and material transfer records

### Requirement: Scheduling detail views match Excel categories

The system SHALL provide separate views for total pending orders, process pending schedules, process scheduled rows, and process remaining schedules.

#### Scenario: Switch scheduling detail tab

- **WHEN** a user switches between total pending, process pending, process scheduled, and process remaining tabs
- **THEN** the system SHALL display rows with the columns required by the corresponding Excel sheet and preserve the current filters

### Requirement: Scheduling page is reachable from navigation

The system SHALL expose the production scheduling capability through an independent `order-scheduling` route and navigation permission while keeping `production-scheduling` available for the order status dashboard.

#### Scenario: Open production scheduling menu item

- **WHEN** an authorized user clicks the production scheduling navigation item
- **THEN** the system SHALL open the production scheduling page instead of a placeholder or unrelated page

