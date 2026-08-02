# 工装管理验证记录

日期：2026-08-02（Asia/Shanghai）

## 本地命令

- 目标测试：通过，5 个文件、7 个测试。
- `bun run typecheck`：通过。
- `bun lint`：通过。
- `bun run build`：通过，产物包含工装资料页、出入记录页和公开扫码页。
- `bunx antd lint src/features/tooling-fixture --format json`：通过，0 个问题。
- `bun run graphify:update`：通过，最终增量 `+0/-0 (24 files)`。
- `git diff --check`：通过。

最终 `bun run test`：102/103 个测试文件、431/436 个测试通过；剩余 1 个既有 `src/services/apiWorkshopOrderOptions.vitest.ts` 测试触发 Vitest worker 异常退出。该失败未触及工装管理变更。

## 远端 Supabase 验证

- 已通过 Supabase MCP 应用建表/RLS/RPC、权限种子和 RPC 角色收窄迁移。
- 两张工装表已启用 RLS；匿名表直接写入权限未开放。
- `get_tooling_fixture_by_qr_token` 与 `record_tooling_fixture_action`：`anon_execute=true`、`authenticated_execute=false`。
- 事务验证：匿名使用成功并写入一条记录；重复使用被拒绝；归还成功并恢复“未使用”；事务回滚后临时 QA 数据为 0 行。
- RPC 使用固定 `search_path` 与 `FOR UPDATE`，状态更新和记录写入在同一函数事务中完成。

## 浏览器手工验证

使用真实 Chrome DevTools 访问 HTTPS 开发服务器：

- 管理端：显示独立“工装管理”菜单；“工装资料”页展示全部字段和二维码列；新增弹窗展示全部字段；空提交显示“请输入工装模具编号”；“出入记录”页可打开。
- 公开端：无效 token 显示“二维码无效”；使用模拟 RPC 数据验证“未使用”只启用“使用”，输入操作者后状态变为“使用中”；归还后状态恢复“未使用”，按钮禁用状态随状态变化。
- 现有“刀具”菜单与路由未改造。
- 已关闭 QA 页面并停止开发服务器。Chrome 工具不允许把截图写入当前仓库路径，本次截图以浏览器工具附件形式完成视觉检查，未留下本地图片文件。
