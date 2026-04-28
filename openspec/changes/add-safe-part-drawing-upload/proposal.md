## Why

件号配置目前只能维护文字字段，无法把对应图纸沉淀到系统里。生产、质量或管理人员在查件号时需要能直接上传、下载和在线查看图纸，减少线下文件查找和版本不一致。

## What Changes

- 为每条件号配置增加一张图纸的元数据记录，包括存储路径、文件名、MIME 类型、文件大小和更新时间。
- 新增 Supabase Storage 专用私有 bucket，用于保存件号图纸文件。
- 在件号配置页面新增“图纸”列，支持上传/替换、下载和在线预览。
- 上传成功后刷新 `syney_safe_part_settings` 列表，保证表格状态与后端一致。
- 保持每个件号最多一张图纸；再次上传视为替换。

## Capabilities

### New Capabilities

- `safe-part-drawing-management`: 管理件号配置关联图纸，支持一件号一图纸、上传替换、下载和在线预览。

### Modified Capabilities

无。

## Impact

- 数据库：新增 `syney_safe_part_settings` 图纸元数据字段，并创建 Storage bucket / storage.objects 策略。
- 服务层：扩展件号配置 API，增加上传、下载签名 URL、预览签名 URL 和删除旧文件的操作。
- 前端：更新 `SafePartSettingPage` 表格列和行内操作，接入 Ant Design Upload、下载和预览 Modal。
- 类型：更新 Supabase 类型声明以覆盖新增字段。
- 验证：执行 Ant Design lint、TypeScript/Vite build，并对 SQL/migration 做静态或 dry-run 校验。
