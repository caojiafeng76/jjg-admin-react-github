# Claude Code 工作流入口

Claude Code 从根目录 `CLAUDE.md` 导入 [AGENTS.md](../AGENTS.md)。通用开发流程、数据库保护、日志及交付规则在该文件。

- 根据[任务矩阵](../.github/ai-task-matrix.md)选用 skill 和验证命令。
- 项目 skill 保存在 `.agents/skills`，用 `bun run skills:sync` 同步 Claude Code 的 `.claude/skills`。
- 新会话可用 `/context all` 检查已加载的项目规则。
