## 1. Database Migration

- [x] 1.1 Execute SQL to add `production_review_opinion` field to `quality_rework_repairs` table
- [x] 1.2 Execute SQL to add `workflow_status` field to `quality_rework_repairs` table
- [x] 1.3 Regenerate `database.types.ts` with `supabase gen types`

## 2. API Layer Updates

- [x] 2.1 Add `production_review_opinion` to `QualityReworkRepair` interface in `apiQualityReworkRepair.ts`
- [x] 2.2 Add `workflow_status` to `QualityReworkRepair` interface in `apiQualityReworkRepair.ts`
- [x] 2.3 Add `production_review_opinion` to `QualityReworkRepairFormValues` interface
- [x] 2.4 Add `workflow_status` to `QualityReworkRepairFormValues` interface
- [x] 2.5 Update `normalizePayload` function to include new fields
- [x] 2.6 Export `QUALITY_REWORK_REPAIR_WORKFLOW_STATUSES` constant

## 3. Form Components

- [x] 3.1 Create `ReworkRepair/forms/` directory structure
- [x] 3.2 Create `WorkshopForm.tsx` with workshop-specific fields
- [x] 3.3 Create `ProductionForm.tsx` with production review fields (including `production_review_opinion`)
- [x] 3.4 Create `TechnicalForm.tsx` with technical review fields
- [x] 3.5 Create `QualityForm.tsx` with quality verification fields
- [x] 3.6 Create shared `BaseInfoSection.tsx` component for read-only basic information

## 4. Main Container Refactor

- [x] 4.1 Refactor `ReworkRepair/index.tsx` to use Ant Design `Tabs` component
- [x] 4.2 Implement tab state management with URL search params
- [x] 4.3 Integrate 4 form components into respective tabs
- [x] 4.4 Update modal form to use tab-based form selection
- [x] 5.5 Handle form submission with workflow_status update

## 5. Table Updates

- [x] 5.1 Add `workflow_status` column to `ReworkRepairTable.tsx`
- [x] 5.2 Add `production_review_opinion` column to `ReworkRepairTable.tsx`
- [x] 5.3 Implement status tag rendering for workflow_status

## 6. Search Updates

- [x] 6.1 Add `workflow_status` filter to `ReworkRepairSearch.tsx`

## 7. Testing & Verification

- [x] 7.1 Verify tab navigation works correctly
- [x] 7.2 Verify form submission updates workflow_status
- [x] 7.3 Run `bun lint` to check code quality
- [x] 7.4 Run `bun run build` to verify TypeScript compilation
