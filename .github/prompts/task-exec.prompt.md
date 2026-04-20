---
description: 按统一工程流程执行任务。适用于修复、开发、重构、排查等日常工作
argument-hint: [任务说明]
---

按统一工程流程处理这个任务：$ARGUMENTS

执行要求：

1. 先用 1-2 句话复述目标、约束和预期结果。
2. 中等及以上复杂度任务，必须先使用 thinking 拆解问题、明确假设、风险和执行顺序，再进入检索和实施。
3. 明确列出准备先查看的代码、配置或文档位置。
4. 建立上下文时必须优先使用 Serena 做符号级检索、引用关系和精确定位；若 Serena 当前不可用，再退回常规搜索，并明确说明已降级。
5. 根据任务类型主动选择合适 skill：
   - Query / Mutation / 缓存问题 -> `tanstack-query`
   - RLS / 权限隔离 -> `.github/skills/supabase-rls-patterns/`
   - 批量导入 / 数据修复 -> `.github/skills/supabase-bulk-operations/`
   - 业务规则 / 状态流转 / 计算逻辑 -> `.github/skills/business-rules-engine/`
   - 移动端 / H5 / 响应式 -> `.github/skills/mobile-responsive-patterns/`
6. 如果任务涉及 Figma 设计稿、Figma 链接、组件映射或设计资源复用，直接使用官方 Figma MCP 获取上下文；不要先靠手工描述、截图猜测或 CLI 替代。
7. 如果任务很小且低风险（如单文件小改、文案/说明调整、小范围配置变更，且不需要新增 change 跟踪），可直接做最小化实现；但必须说明为何跳过完整 Spec Workflow。
8. 其他会修改代码、脚本、SQL、配置或指令文件的任务，默认按 Spec Workflow 顺序推进：阶段判断、active change 判断和 apply readiness 判断统一以 repo-local CLI wrapper 输出为准，即 `bun run spec:list`、`bun run spec -- status --change <name> --json`、`bun run spec -- instructions apply --change <name> --json`；准备写代码时，不要跳过 `propose` / `tasks` 直接进入实现。
9. 如果用户已经显式使用 `/opsx:explore`、`/opsx:propose`、`/opsx:apply` 或 `/opsx:archive`，以对应 opsx prompt 为当前权威流程；不要再重复做通用阶段判断、重复查询相同状态或重复要求用户走一遍同样流程。
10. 先搜索和阅读相关上下文，再决定实施方案；不要在缺少上下文时直接修改。
11. 如果信息不足以继续，只提出最少必要的澄清问题；如果可以合理决策，直接推进。
12. 给出简短执行计划，并明确说明本次准备如何验证，然后开始实施。
13. 如果要修改代码、配置、脚本、SQL 或指令文件，实施前先检查相关文件当前状态；若已有本地改动，必须先阅读并在其基础上修改。
14. 实施时优先修复根因，保持改动最小化，避免顺手修改无关代码。
15. 对有联动风险的改动，必须主动补查：

- 字段改动 -> 类型、服务层、表格、表单、搜索、详情、导出
- Query / Mutation 改动 -> queryKey、invalidateQueries、调用点、列表详情联动
- 路由 / 菜单 / 权限改动 -> router、菜单、标题、access 配置
- 脚本 / 配置改动 -> README、ENV_SETUP、相关 prompt / instructions

16. 改动后执行必要验证；除纯文档文本调整外，不能在未做任何验证的情况下结束任务。
17. 若无法完成验证，必须明确说明阻塞原因、已尝试替代方案和剩余风险。
18. 如果当前任务对应 change 已完成实现范围，结尾应提示进入 `archive`，不要只停在“代码改完”。
19. 最终输出固定包含以下四项：

- 完成了什么
- 关键改动
- 验证结果
- 风险、限制或下一步

如果用户输入偏探索、方案讨论或需求澄清，可以先进入分析模式，但一旦用户目标明确，继续推进到可执行结果，不要只停留在建议层。
