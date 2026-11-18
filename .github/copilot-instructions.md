# JJG Admin React 的 Copilot 入口

处理仓库任务前，读取并遵循 [AGENTS.md](../AGENTS.md)，再按任务读取 [验证矩阵](ai-task-matrix.md)和相应 skill。下方提醒适用于当前仓库的 Copilot 会话。

- 改动前检查工作区和实际调用链，保留用户现有改动。关键业务、权限和数据写入的取舍先询问用户。
- 使用 Bun 和 ESLint，执行矩阵要求的验证并报告实际结果。
- 改动在 `CHANGELOG.MD` 顶部追加记录。面向业务用户的变化同步首页日志。
- Supabase 使用仓库 CLI 与确认流程。评审保持只读，优先报告有证据的缺陷、风险和测试缺口。
