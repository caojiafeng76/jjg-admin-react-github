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
```

### 3. 获取 Supabase 配置信息

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 选择你的项目
3. 进入 **Settings** → **API**
4. 复制以下信息:
   - **Project URL** → `VITE_REACT_APP_SUPABASE_URL`
   - **anon public** key → `VITE_REACT_APP_SUPABASE_KEY`

## 环境变量说明

| 变量名                        | 说明                         | 示例                        |
| ----------------------------- | ---------------------------- | --------------------------- |
| `VITE_REACT_APP_SUPABASE_URL` | Supabase 项目 URL            | `https://xxxxx.supabase.co` |
| `VITE_REACT_APP_SUPABASE_KEY` | Supabase 匿名密钥 (公开密钥) | `eyJhbGci...`               |

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
pnpm dev
```

如果配置正确,应用应该能够正常连接到 Supabase 并加载数据。

## 故障排查

### 问题: 无法连接到 Supabase

**解决方案**:

1. 检查 `.env` 文件是否存在
2. 验证环境变量名称拼写正确
3. 确认 Supabase URL 和密钥有效
4. 重启开发服务器

### 问题: 环境变量未生效

**解决方案**:

1. 确保环境变量以 `VITE_` 开头 (Vite 要求)
2. 重启开发服务器
3. 清除浏览器缓存
