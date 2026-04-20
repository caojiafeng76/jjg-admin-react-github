## ADDED Requirements

### Requirement: Public labor protection requisition page

The system SHALL provide a public mobile-friendly labor protection requisition page that can be opened without login and used inside WeChat browsers.

#### Scenario: Open public page without authentication

- **WHEN** a user opens the public labor protection requisition URL without an authenticated session
- **THEN** the system shows the requisition form instead of redirecting to the login page

#### Scenario: Public page renders mobile-first layout

- **WHEN** a user opens the public labor protection requisition page on a narrow mobile viewport
- **THEN** the system presents a single-column touch-friendly form with one primary submission action

### Requirement: Public page can read categories and submit requisitions

The system SHALL allow public users to load labor protection category options and submit a new labor protection requisition record using the existing requisition data model.

#### Scenario: Load category options for public form

- **WHEN** the public requisition page loads successfully
- **THEN** the system fetches and displays labor protection categories from `labor_protection_data`

#### Scenario: Submit a valid public requisition

- **WHEN** a user submits category, job title, quantity, and recipient with valid values
- **THEN** the system creates a new row in `labor_protection_requisitions` and displays a submission success state

#### Scenario: Reject invalid public requisition data

- **WHEN** a user submits empty text fields or a non-positive quantity
- **THEN** the system blocks the submission and shows validation feedback before creating any record

### Requirement: Public database access is minimized

The system MUST restrict public database access to the minimum required operations for labor protection requisition submission.

#### Scenario: Public users can read categories

- **WHEN** a request is sent by the `anon` or non-admin `authenticated` role to read labor protection categories
- **THEN** the database allows selecting category options needed by the public requisition form

#### Scenario: Public users can insert requisitions only

- **WHEN** a request is sent by the `anon` or non-admin `authenticated` role to create a labor protection requisition
- **THEN** the database allows inserting the requisition row
- **THEN** the database does not grant public update, delete, or list-management access to requisition records
