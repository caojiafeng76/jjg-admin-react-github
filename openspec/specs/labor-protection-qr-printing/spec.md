# labor-protection-qr-printing Specification

## Purpose
TBD - created by archiving change add-labor-protection-public-h5-qr. Update Purpose after archive.
## Requirements
### Requirement: Admin can print public requisition QR poster

The system SHALL provide an admin-side action on the labor protection requisition page to print a QR poster for the public requisition entry.

#### Scenario: Show QR print action on admin page

- **WHEN** an admin opens the labor protection requisition management page
- **THEN** the page shows a QR printing action in the page toolbar

#### Scenario: Print poster with requisition QR code

- **WHEN** an admin triggers the QR printing action
- **THEN** the system opens a printable poster view containing the configured labor protection instructions and a QR code

### Requirement: QR code always targets the public requisition page

The system MUST generate the QR value from the public requisition URL rather than from any protected admin route.

#### Scenario: Generate absolute public URL for QR value

- **WHEN** the system generates a QR value in the browser
- **THEN** the QR value is an absolute URL that resolves to the public labor protection requisition page under the current origin

#### Scenario: Scan QR in WeChat

- **WHEN** a user scans the printed QR code in WeChat
- **THEN** the browser opens the public requisition page directly without requiring the user to navigate through the admin UI

