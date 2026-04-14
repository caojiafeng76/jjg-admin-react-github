# JJG Admin React

基于 React 19 + TypeScript + Vite 的企业管理后台系统，主要覆盖“西尼”扶梯踏板与“车间”生产相关业务。

## 技术栈

- React 19
- TypeScript 5.7
- Vite 7
- Ant Design 6
- Tailwind CSS 4
- TanStack Query 5
- Zustand 5
- Supabase

## 开发命令

```bash
bun dev
bun run build
bun preview
bun lint
bun lint:fix
bun format
```

说明：

- 项目使用 bun 作为包管理器
- 当前未配置独立测试框架，日常验证以类型检查、构建、lint 和局部回归为主

## 目录结构

```text
src/
├── features/      # 按业务域组织的功能模块
├── services/      # Supabase 数据访问层
├── hooks/         # 共享 Hooks
├── ui/            # 通用 UI 组件
├── config/        # 全局配置
├── store/         # Zustand 状态
├── routes/        # 路由
└── utils/         # 工具函数
```

常用路径别名：

- `@/` -> `src/`
- `@ui/` -> `src/ui/`
- `@features/` -> `src/features/`
- `@hooks/` -> `src/hooks/`
- `@services/` -> `src/services/`
- `@utils/` -> `src/utils/`

## 开发约定

- API 访问统一放在 `src/services/`
- Supabase 错误统一通过 `handleApiError` 处理
- 列表和详情查询优先复用 `queryClient` 中已有的缓存策略
- Mutation 优先使用 `useMutationWithMessage`
- 错误信息和用户可见文案默认使用中文
- `src/services/database.types.ts` 由工具生成，禁止手动修改

## Copilot 固定流程

本仓库已经为 VS Code Copilot 配置了项目级固定执行流程，目标是让 AI 在日常任务里尽量遵循一致的方法：

1. 先复述目标、约束和预期输出
2. 先搜索并阅读相关代码、文档或配置
3. 仅在信息不足时提出最少必要澄清问题
4. 实施前给出简短计划
5. 保持改动最小化，优先修复根因
6. 改动后做必要验证
7. 最终按固定结构汇报结果

默认规则定义在 [.github/copilot-instructions.md](.github/copilot-instructions.md)。

## Copilot 项目级 Prompt

除了默认规则外，仓库还提供了几个可直接在 VS Code Copilot Chat 使用的项目级 slash prompt，用来约束不同类型任务的执行流程。

### 通用执行

文件： [.github/prompts/task-exec.prompt.md](.github/prompts/task-exec.prompt.md)

适用场景：

- 通用开发任务
- 重构
- 排查问题
- 需要 AI 从头按固定工程流程推进的工作

示例：

```text
/task-exec 给生产工单列表增加按车间筛选
```

### 缺陷修复

文件： [.github/prompts/bugfix.prompt.md](.github/prompts/bugfix.prompt.md)

适用场景：

- 页面报错
- 行为不符合预期
- 回归问题
- 线上问题排查

示例：

```text
/bugfix 修复订单详情页切换分页后数据错乱
```

### 代码评审

文件： [.github/prompts/review.prompt.md](.github/prompts/review.prompt.md)

适用场景：

- 审查某次改动风险
- 查缺陷、回归、测试缺口
- review 某个模块或 PR 范围

示例：

```text
/review 检查最近对员工权限模块的改动风险
```

### 数据库变更

文件： [.github/prompts/db-change.prompt.md](.github/prompts/db-change.prompt.md)

适用场景：

- Supabase / Postgres 迁移
- RLS 策略调整
- SQL 草案
- 数据修复评估
- 查询优化

示例：

```text
/db-change 为员工手机端相关表补充 RLS 策略
```

这个入口会额外约束：

- 先评估影响范围
- 优先用迁移文件表达 DDL 变更
- 默认不手改 `database.types.ts`
- 明确说明风险、兼容性和回滚方案

### 新功能开发

文件： [.github/prompts/feature-impl.prompt.md](.github/prompts/feature-impl.prompt.md)

适用场景：

- 新增页面
- 新增业务模块
- 新交互或新流程
- 接口接入与功能扩展

示例：

```text
/feature-impl 新增员工手机端工单详情页
```

这个入口会额外要求：

- 先看现有模块和相似实现
- 优先复用现有 feature 结构与 Query / Mutation 模式
- 明确涉及文件、切入点和数据边界
- 做最小必要验证并说明剩余限制

## 使用建议

- 不确定用哪一个时，优先使用 `/task-exec`
- 明确是 bug 时，用 `/bugfix`
- 明确是评审时，用 `/review`
- 涉及 Supabase、迁移、RLS、SQL 时，用 `/db-change`
- 明确是在做新功能时，用 `/feature-impl`

如果任务本身很小，直接自然语言提问也可以；这些 prompt 的价值主要在于让 Copilot 在复杂任务上更稳定地遵循统一流程。

## 相关文件

- [.github/copilot-instructions.md](.github/copilot-instructions.md)
- [.github/prompts/task-exec.prompt.md](.github/prompts/task-exec.prompt.md)
- [.github/prompts/bugfix.prompt.md](.github/prompts/bugfix.prompt.md)
- [.github/prompts/review.prompt.md](.github/prompts/review.prompt.md)
- [.github/prompts/db-change.prompt.md](.github/prompts/db-change.prompt.md)
- [.github/prompts/feature-impl.prompt.md](.github/prompts/feature-impl.prompt.md)
- [AGENTS.md](AGENTS.md)
