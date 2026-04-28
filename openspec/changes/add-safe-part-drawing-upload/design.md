## Context

`syney_safe_part_settings` 当前保存件号配置文本字段，前端入口为 `src/features/syney/SafePartSetting/SafePartSettingPage.tsx`，服务层为 `src/services/apiSyneySafePartSettings.ts`。该表当前在仓库权限记忆中属于 authenticated rw 的西尼系列配置表，尚未按 page permission 收紧。项目已有 Supabase Storage bucket 创建示例，但客户端图纸上传需要新增 Storage 对象策略。

## Goals / Non-Goals

**Goals:**

- 每条件号配置最多关联一张图纸。
- 用户可以在件号配置列表行内上传或替换图纸。
- 用户可以下载已上传图纸。
- 用户可以在线查看已上传图纸；PDF 和图片使用浏览器可预览能力展示。
- 图纸文件保存在 Supabase Storage 私有 bucket 中，前端通过短期签名 URL 访问。

**Non-Goals:**

- 不实现 CAD/DWG 专用在线解析或矢量查看器。
- 不实现图纸历史版本管理。
- 不新增细粒度角色权限；保持与当前 `syney_safe_part_settings` 访问模型一致。
- 不修改已有件号配置业务字段含义。

## Decisions

1. **图纸元数据放在 `syney_safe_part_settings` 表上。**
   - 选择字段：`drawing_file_path`、`drawing_file_name`、`drawing_file_mime_type`、`drawing_file_size`、`drawing_uploaded_at`。
   - 理由：需求是一件号一图纸，表上字段比新建关联表更简单，列表读取不需要额外 join。
   - 替代方案：新建 drawing 表，适合多版本/多附件，但当前需求会增加不必要复杂度。

2. **文件放入私有 bucket `syney-safe-part-drawings`。**
   - 路径使用配置行 `id` 分组，例如 `<setting-id>/<timestamp>-<filename>`。
   - 上传成功后更新表元数据；替换时删除旧路径，避免孤儿文件长期堆积。
   - 访问使用 `createSignedUrl`，不公开 bucket。

3. **Storage 权限与现有表访问模型保持一致。**
   - 对该 bucket 的 `storage.objects` 添加 authenticated select/insert/update/delete 策略。
   - 当前 syney 系列表仍是 authenticated rw；未来若改为 permission-based RLS，应同步收紧该 bucket 策略。

4. **前端行内操作保持后台表格风格。**
   - 新增“图纸”列，显示“上传/替换”、“查看”、“下载”。
   - 使用 Ant Design `Upload` 的 `beforeUpload` 接管上传，避免默认请求。
   - PDF 用 iframe 预览，图片用 img 预览，其他浏览器可打开类型给出新窗口/签名 URL 兜底。

## Risks / Trade-offs

- **CAD/DWG 无法原生在线预览** → 先支持 PDF/图片在线预览；其他格式可下载或由浏览器处理。
- **DB 更新失败后 Storage 已上传** → 服务层在失败时尝试删除新文件。
- **替换文件后旧文件残留** → 元数据更新成功后删除旧路径；删除失败不阻断用户流程，但可在控制台记录。
- **权限未来收紧时 Storage 漏改** → migration 注释和最终说明提示该 bucket 与件号配置权限模型绑定。
- **database.types.ts 禁止手改** → 如本地无法生成类型，优先通过 migration 和服务层扩展类型桥接；能生成时再更新生成文件。

## Migration Plan

1. 增加 `syney_safe_part_settings` 图纸元数据字段和字段注释。
2. 创建私有 bucket `syney-safe-part-drawings`，限制文件大小与常见 PDF/图片 MIME 类型。
3. 添加该 bucket 的 storage.objects authenticated 策略。
4. 前端服务层接入上传、签名 URL、下载和预览。
5. 验证构建和 Ant Design lint；数据库变更使用仓库 DB push/dry-run 或 SQL 静态检查验证。
