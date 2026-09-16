# 历史迁移归档

`20260916/` 完整保留本次对齐前的 190 个本地 SQL 文件。归档文件不会被 Supabase CLI 的 `db push` 执行，不应再编辑；新的迁移放入 `supabase/migrations/`。

2026-09-16 经用户确认，以已绑定生产项目 `mlcptrkvkseyqxxlfcme` 的 240 条迁移版本为准恢复活动目录，未执行 SQL、未改写远程迁移历史。

- 203 个活动文件来自官方 `supabase migration fetch` 返回的远程 SQL。
- 37 条远程历史没有保存 statements，活动文件采用归档中同名 SQL，标记为 `local-reconstruction`。这是来源重建，不表示已证明与当时执行的 SQL 完全一致。
- `../migration-history-20260916.json` 保存逐条活动文件、原文件名和 SHA-256；哈希统一把 CRLF 转为 LF 后计算，便于跨平台核验。
- 当前恢复用于已存在生产库的后续增量迁移。未经独立验证，不应宣称这套历史可以从空数据库完整重放；不要对生产库运行 reset 或 repair 来消除历史差异。
- 历史文档中的旧文件名可在本归档目录查阅。现行回归测试已改为读取活动目录的生产版本文件。
