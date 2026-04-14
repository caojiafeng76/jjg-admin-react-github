# 环境变量配置说明

## 概述

本项目使用环境变量来配置 Supabase 后端服务。环境变量存储在 `.env` 文件中,该文件不应提交到版本控制系统。

## 配置步骤

### 1. 创建 .env 文件

复制 `.env.example` 文件并重命名为 `.env`:

```bash
cp .env.example .env
```

### 2. 配置 Supabase

在 `.env` 文件中填入你的 Supabase 项目配置:

```env
VITE_REACT_APP_SUPABASE_URL=https://your-project.supabase.co
VITE_REACT_APP_SUPABASE_KEY=your_anon_key_here

# 可选: 仅供 Supabase CLI 使用的数据库连接串
# 如果 bun run db:push 的 linked 直连失败，可配置这个回退值
SUPABASE_DB_URL=postgresql://postgres:your-password@your-host:5432/postgres
```

### 3. 获取 Supabase 配置信息

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 选择你的项目
3. 进入 **Settings** → **API**
4. 复制以下信息:
   - **Project URL** → `VITE_REACT_APP_SUPABASE_URL`
   - **anon public** key → `VITE_REACT_APP_SUPABASE_KEY`

## 环境变量说明

| 变量名                        | 说明                          | 示例                        |
| ----------------------------- | ----------------------------- | --------------------------- |
| `VITE_REACT_APP_SUPABASE_URL` | Supabase 项目 URL             | `https://xxxxx.supabase.co` |
| `VITE_REACT_APP_SUPABASE_KEY` | Supabase 匿名密钥 (公开密钥)  | `eyJhbGci...`               |
| `SUPABASE_DB_URL`             | Supabase CLI 远程数据库连接串 | `postgresql://...`          |

## 安全注意事项

> [!WARNING]
>
> - **切勿**将 `.env` 文件提交到 Git 仓库
> - **切勿**在代码中硬编码敏感信息
> - 使用 `anon` 密钥而非 `service_role` 密钥
> - 确保 `.gitignore` 包含 `.env`

## 验证配置

启动开发服务器验证配置是否正确:

```bash
bun dev
```

验证数据库 CLI 链路:

```bash
bun run db:doctor
```

如果配置正确,应用应该能够正常连接到 Supabase 并加载数据。

## 故障排查

### 问题: 无法连接到 Supabase

**解决方案**:

1. 检查 `.env` 文件是否存在
2. 验证环境变量名称拼写正确
3. 确认 Supabase URL 和密钥有效
4. 重启开发服务器

### 问题: `bun run db:push` 失败，但 `bun run db:query` 可以执行

这通常不是 `supabase login` 的问题，而是远程数据库直连链路被网络环境拦截。

解决方案:

1. 先执行 `bun run db:doctor`，确认失败是否发生在 migration push 阶段
2. 如果 doctor 显示 login 和 query 正常，只是 push 超时，配置 `SUPABASE_DB_URL`
3. 结构变更可继续使用 `bun run db:push`
4. 一次性 SQL 可继续使用 `bun run db:query -- --file <sql-file>`
5. 如果 CLI 仍不可用，再改走 Supabase MCP

### 问题: 环境变量未生效

**解决方案**:

1. 确保环境变量以 `VITE_` 开头 (Vite 要求)
2. 重启开发服务器
3. 清除浏览器缓存
