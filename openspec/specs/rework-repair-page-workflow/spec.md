# rework-repair-page-workflow Specification

## Purpose
TBD - created by archiving change adjust-rework-repair-page-workflow. Update Purpose after archive.
## Requirements
### Requirement: Page-level workflow tabs

The system SHALL display workflow tabs directly on the `quality-rework-repair` page instead of inside the edit modal.

#### Scenario: Default workflow tab

- **WHEN** user opens the rework-repair page without a workflow status in the URL
- **THEN** system selects the workshop initiation tab by default
- **AND** system lists records whose `workflow_status` is `workshop_pending`

#### Scenario: Tab filtering

- **WHEN** user switches to Production, Technical, Quality, or Completed tab
- **THEN** system updates the selected workflow status
- **AND** system lists only records matching that tab's workflow status

### Requirement: Stage-specific processing modal

The system SHALL use the processing modal only for the current selected workflow stage.

#### Scenario: Workshop processing fields

- **WHEN** user creates or processes a record from the workshop tab
- **THEN** system shows workshop application fields
- **AND** system does not show Production, Technical, or Quality tabs inside the modal

#### Scenario: Department processing fields

- **WHEN** user processes a record from Production, Technical, or Quality tab
- **THEN** system shows only fields required by that department's current confirmation stage
- **AND** system keeps previous stage values for persistence

### Requirement: Forward-only workflow transitions

The system SHALL move records to the next department when the current department confirms.

#### Scenario: Workshop submits to production

- **WHEN** user submits a workshop-stage record
- **THEN** system sets `workflow_status` to `production_pending`

#### Scenario: Production confirms to technical

- **WHEN** user submits a production-stage record
- **THEN** system sets `workflow_status` to `technical_pending`

#### Scenario: Technical confirms to quality

- **WHEN** user submits a technical-stage record
- **THEN** system sets `workflow_status` to `quality_pending`

#### Scenario: Quality final confirmation

- **WHEN** user submits a quality-stage record
- **THEN** system sets `workflow_status` to `completed`

### Requirement: Workflow search consistency

The system SHALL treat page-level workflow tabs as the source of truth for workflow status filtering.

#### Scenario: Search within current workflow tab

- **WHEN** user searches by category or keyword
- **THEN** system keeps the current workflow tab selected
- **AND** applies the search conditions within that workflow status

#### Scenario: Reset search

- **WHEN** user resets search filters
- **THEN** system clears category and keyword
- **AND** keeps the current workflow tab filter active

