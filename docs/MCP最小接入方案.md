# MCP 最小接入方案

适用范围：Claude Code、OpenCode、VS Code Copilot。

这份方案只覆盖当前仓库最值得接的 3 个 MCP：

1. Supabase MCP
2. Browser / Playwright MCP
3. GitHub MCP

## 为什么先接这 3 个

这个项目本身是 React + Vite + Supabase 的后台系统，而且已经有明显的移动端/H5、RLS、批量导入、代码评审需求。

- Supabase MCP：用于查表结构、核对 SQL、辅助 RLS / migration / 数据修复。
- Browser / Playwright MCP：用于真实打开页面，验证手机端流程、扫码页、表单、前端回归。
- GitHub MCP：用于 issue / PR / review / compare / 代码搜索；如果你主要在 VS Code 里工作，它的优先级略低于前两个，因为 VS Code 里已经有一部分原生 GitHub 能力。

## 推荐接入顺序

1. Browser / Playwright MCP
2. Supabase MCP
3. GitHub MCP

原因很简单：

- Browser MCP 最容易立即产生价值，而且不碰数据库权限。
- Supabase MCP 对这个仓库价值很高，但要带上正确的项目和访问凭证。
- GitHub MCP 是锦上添花，不是第一阻塞项。

## 统一约定

不建议把密钥直接写进仓库。

建议统一走环境变量：

- GITHUB_TOKEN
- SUPABASE_ACCESS_TOKEN
- SUPABASE_PROJECT_REF

如果某个客户端支持 OAuth，优先 OAuth，不要改成明文 token。

## Claude Code 最小模板

Claude Code 侧，优先使用仓库根目录的 .mcp.json。

示例模板如下：

```json
{
  "mcpServers": {
    "browser": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    },
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "<your-supabase-mcp-package>"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}",
        "SUPABASE_PROJECT_REF": "${SUPABASE_PROJECT_REF}"
      }
    }
  }
}
```

说明：

- browser 这一项是当前最建议先落的。
- github 这一项直接走远程托管服务，省掉本地 Docker 依赖。
- supabase 这一项保留成骨架，因为你最终采用官方托管版还是本地 stdio 版，会决定 command / args 的具体值。

如果你现在只想先把最小闭环跑通，先只保留 browser 和 github 也可以。

## OpenCode 最小模板

OpenCode 也建议使用同一份 mcpServers 结构。具体配置入口以你本机 OpenCode 客户端设置为准，但内容可以直接复用下面这份：

```json
{
  "mcpServers": {
    "browser": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    },
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "<your-supabase-mcp-package>"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}",
        "SUPABASE_PROJECT_REF": "${SUPABASE_PROJECT_REF}"
      }
    }
  }
}
```

如果 OpenCode 支持单独的 auth 命令或 OAuth 流程，优先用它，不要为了省事把 token 固化进配置。

## VS Code Copilot 最小模板

VS Code Copilot 这边建议分两层理解：

1. GitHub 相关能力，很多场景已经有内建工具，不一定非要额外再配一个本地 GitHub MCP。
2. Browser / Supabase 这两类外部能力，更值得补到 MCP 里。

如果你的 VS Code MCP 配置支持 mcpServers JSON，可直接按下面的最小版本填写：

```json
{
  "mcpServers": {
    "browser": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    },
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "<your-supabase-mcp-package>"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}",
        "SUPABASE_PROJECT_REF": "${SUPABASE_PROJECT_REF}"
      }
    }
  }
}
```

如果你只准备先配一个：

- 先配 browser。
- 第二个再配 supabase。
- github 在 Copilot 里可以放第三优先级。

## 这个仓库的推荐落地顺序

### 第一阶段

只接 Browser / Playwright MCP。

适合立刻覆盖这些任务：

- 员工手机端页面回归
- 扫码流程验证
- 表单联动检查
- React 页面真实渲染验证

### 第二阶段

接 Supabase MCP。

适合立刻覆盖这些任务：

- migration 草案核对
- RLS 策略检查
- 表结构确认
- 批量导入和修数辅助分析

### 第三阶段

补 GitHub MCP。

适合立刻覆盖这些任务：

- 看 issue / PR 上下文
- 拉取 review comment
- 做 compare / blame / 搜索

## 环境变量建议

Windows PowerShell 临时设置示例：

```powershell
$env:SUPABASE_ACCESS_TOKEN = "your-token"
$env:SUPABASE_PROJECT_REF = "your-project-ref"
$env:GITHUB_TOKEN = "ghp_xxx"
```

如果要长期使用，放到你自己的系统环境变量或客户端专用 secret 存储里，不要提交到仓库。

## 验证方式

每接完一个 MCP，只做最小验证，不要一上来全堆上去。

### Browser MCP

验证目标：

- 能打开本地开发地址
- 能读取页面
- 能执行点击或截图

### Supabase MCP

验证目标：

- 能列出项目或 schema
- 能读取指定表结构
- 不要一开始就给它写权限

### GitHub MCP

验证目标：

- 能读取当前仓库信息
- 能查询 issue 或 PR
- 不要一开始就开放 merge / write 类动作

## 最小权限原则

这个仓库建议默认遵循下面的权限顺序：

1. 先只读
2. 再加查询
3. 最后才给写入或执行类权限

尤其是 Supabase MCP，不建议一开始就允许它直接执行高风险 SQL。

## 结论

如果你现在只想最省事地起步：

1. 先给 Claude Code / OpenCode / Copilot 都接 Browser MCP。
2. 然后补 Supabase MCP。
3. GitHub MCP 在 VS Code Copilot 里放第三优先级。

如果你下一步要我直接落文件，我建议优先做 Claude Code 的 .mcp.json 草案，再按同样结构帮你拆成 OpenCode 和 Copilot 的对应配置。
