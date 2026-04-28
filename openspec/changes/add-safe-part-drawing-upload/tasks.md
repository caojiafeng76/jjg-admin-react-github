## 1. Database and Storage

- [x] 1.1 Add a Supabase migration for drawing metadata columns on `syney_safe_part_settings`.
- [x] 1.2 Create the private `syney-safe-part-drawings` bucket and storage object policies.
- [x] 1.3 Update generated Supabase type declarations or add a typed bridge for the new fields.

## 2. Service Layer

- [x] 2.1 Extend `apiSyneySafePartSettings` types and upsert payload handling for drawing metadata.
- [x] 2.2 Add upload/replace logic that writes to Storage and updates the row metadata.
- [x] 2.3 Add signed URL helpers for preview and download.

## 3. User Interface

- [x] 3.1 Add a drawing column to `SafePartSettingPage` with upload, view, and download actions.
- [x] 3.2 Implement online preview modal for PDF/image drawing files.
- [x] 3.3 Keep row actions and loading states consistent with the existing件号配置 table style.

## 4. Verification

- [x] 4.1 Run Ant Design component lint on the changed page.
- [x] 4.2 Run project build/type validation.
- [x] 4.3 Validate the migration with the available repository database workflow or document the blocker.
