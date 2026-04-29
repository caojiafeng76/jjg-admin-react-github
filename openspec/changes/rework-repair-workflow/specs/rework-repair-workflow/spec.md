## ADDED Requirements

### Requirement: Multi-tab workflow view
The system SHALL provide a tab-based interface with 4 tabs representing workflow stages: Workshop (车间), Production (生产部), Technical (技术部), Quality (质量部).

#### Scenario: Tab navigation
- **WHEN** user opens the rework-repair page
- **THEN** system displays 4 tabs with "Workshop" tab selected by default

#### Scenario: Tab content display
- **WHEN** user clicks on a tab
- **THEN** system displays the form fields relevant to that department's workflow stage

### Requirement: Workshop tab fields
The Workshop tab SHALL display and allow editing of basic information and workshop application fields.

#### Scenario: Workshop form fields
- **WHEN** user is on the Workshop tab
- **THEN** system displays editable fields: document_no, project_no, rework_category, product_name, specification_model, responsible_unit, quantity, planned_rework_date, actual_rework_date, defect_description, application_reason, workshop_applicant, application_date

#### Scenario: Workshop read-only fields
- **WHEN** user is on the Workshop tab
- **THEN** system displays read-only fields for subsequent workflow stages (production_review_opinion, technical_review_opinion, verification_result)

### Requirement: Production tab fields
The Production tab SHALL display basic information as read-only and allow editing of production review fields.

#### Scenario: Production form fields
- **WHEN** user is on the Production tab
- **THEN** system displays editable fields: production_review_opinion, production_reviewer, production_review_date

#### Scenario: Production read-only fields
- **WHEN** user is on the Production tab
- **THEN** system displays read-only basic information fields from Workshop stage

### Requirement: Technical tab fields
The Technical tab SHALL display previous stage information as read-only and allow editing of technical review fields.

#### Scenario: Technical form fields
- **WHEN** user is on the Technical tab
- **THEN** system displays editable fields: technical_review_opinion, technical_reviewer, technical_review_date, improvement_actions, improvement_owner, improvement_date

#### Scenario: Technical read-only fields
- **WHEN** user is on the Technical tab
- **THEN** system displays read-only fields from Workshop and Production stages

### Requirement: Quality tab fields
The Quality tab SHALL display previous stage information as read-only and allow editing of quality verification fields.

#### Scenario: Quality form fields
- **WHEN** user is on the Quality tab
- **THEN** system displays editable fields: verification_result, quality_verifier, verification_date

#### Scenario: Quality read-only fields
- **WHEN** user is on the Quality tab
- **THEN** system displays read-only fields from all previous stages

### Requirement: Workflow status tracking
The system SHALL track the current workflow status using a workflow_status field.

#### Scenario: Initial status
- **WHEN** a new record is created
- **THEN** system sets workflow_status to 'workshop_pending'

#### Scenario: Status transitions
- **WHEN** user submits from a department tab
- **THEN** system updates workflow_status to the next department's pending status

### Requirement: Production review opinion field
The system SHALL provide a production_review_opinion field for the Production department to record their review opinion.

#### Scenario: Production opinion input
- **WHEN** user is on the Production tab
- **THEN** system displays an editable textarea field labeled "审核意见"

#### Scenario: Production opinion persistence
- **WHEN** user saves the form
- **THEN** system stores production_review_opinion in the database
