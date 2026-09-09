## Purpose

让车间订单在出库完成后可靠地自动进入结案状态，同时尊重人工反结案决定并避免订单被系统再次自动关闭。

## ADDED Requirements

### Requirement: Record continuous 100% outbound completion

The system SHALL record when a production order with a positive order quantity first reaches an outbound quantity greater than or equal to its order quantity.

#### Scenario: An order crosses the completion threshold

- **WHEN** a material transfer or order quantity change makes total outbound quantity reach or exceed the positive order quantity
- **THEN** the system records the current time as the completion time

#### Scenario: A completed order drops below the threshold

- **WHEN** transfer or order data makes total outbound quantity lower than the positive order quantity
- **THEN** the system clears the completion time so a later completion starts a new waiting period

### Requirement: Automatically close eligible orders after two days

The system SHALL set a production order to 已结案 when it has continuously satisfied the completion threshold for at least two days and automatic closing is not disabled.

#### Scenario: The waiting period expires

- **WHEN** the scheduled evaluation sees an eligible order whose completion time is at least two days old
- **THEN** the order becomes 已结案 and receives a close time

#### Scenario: The waiting period has not expired

- **WHEN** an order reached the completion threshold less than two days ago
- **THEN** the order remains 生产中

### Requirement: Permanently exempt manually reopened orders

The system SHALL permanently disable automatic closing when an order changes from 已结案 to 生产中 through the existing authorized status workflow.

#### Scenario: A user reopens an order

- **WHEN** an authorized user changes an order from 已结案 to 生产中
- **THEN** the order remains excluded from every later automatic close evaluation

#### Scenario: An exempt order reaches 100% again

- **WHEN** an automatically exempt order reaches or remains at 100% outbound completion
- **THEN** the system leaves it 生产中 until an authorized user manually closes it

### Requirement: Reconcile existing orders on deployment

The system SHALL infer completion timestamps from existing material-transfer history and immediately close existing production orders whose inferred completion time is at least two days old.

#### Scenario: An existing completed order is older than two days

- **WHEN** deployment backfill finds the first cumulative transfer timestamp that reached the order quantity and it is at least two days old
- **THEN** the existing order becomes 已结案

#### Scenario: An existing completed order is still in the waiting period

- **WHEN** deployment backfill finds a completion timestamp less than two days old
- **THEN** the order remains 生产中 until its waiting period expires
