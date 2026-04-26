## 1. Data And Routing

- [x] 1.1 Locate the existing production scheduling route, menu title, permissions, and placeholder page.
- [x] 1.2 Inspect workshop orders, production orders, cost accounting, and job base setting data fields needed for aggregation.
- [x] 1.3 Add a read-only order status aggregation service and query hook.
- [x] 1.4 Add read-only material transfer aggregation by order project number.

## 2. Dashboard UI

- [x] 2.1 Implement the order status dashboard table with dynamic operation output columns.
- [x] 2.2 Replace the production scheduling placeholder route with the dashboard and update navigation/Header labels to “订单现状”.
- [x] 2.3 Show material transfer quantity, warehouse quantity, target workshops, and latest transfer summary in the dashboard table.
- [x] 2.4 Add operation output cell detail modal for matching production order items.
- [x] 2.5 Add fuzzy search by order date, project number, and model.
- [x] 2.6 Switch dashboard table headers from vertical text to horizontal text.
- [x] 2.7 Split the dashboard into production and closed order tabs.
- [x] 2.8 Switch dynamic output columns from operations to process jobs.
- [x] 2.9 Add operation-level qualified quantity summary inside job detail modal.
- [x] 2.10 Add material transfer detail modal from transfer quantity cell.
- [x] 2.11 Use cost accounting job type as process job and match operation suffix variants.

## 3. Verification

- [x] 3.1 Run the relevant build/type validation.
- [x] 3.2 Check changed files and summarize remaining iteration points.
- [x] 3.3 Re-run build and Ant Design lint after job aggregation change.
- [x] 3.4 Re-run build, Ant Design lint, and spec status after transfer detail modal change.
- [x] 3.5 Re-run build and spec status after cost accounting job matching fix.
