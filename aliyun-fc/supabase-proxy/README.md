# Supabase API 反向代理（阿里云 FC Web 函数）

浏览器直连 `https://<project-ref>.supabase.co` 时，中国移动等国内运营商到
Cloudflare 的国际线路会偶发丢包或连接重置，前端表现为 `Failed to fetch`。
本函数部署在 **阿里云 FC 香港区域**，把前端的 Supabase 请求透明转发到
Supabase，绕开这段不稳定的线路。

## 行为

- 只转发 `/rest/v1/`、`/auth/v1/`、`/storage/v1/`、`/functions/v1/`，其余路径返回 404；
  `GET /healthz` 返回 `{ "ok": true }` 供健康检查。
- 不转发 Realtime WebSocket（前端目前未使用）。
- method、path、query、请求头、请求体原样流式转发；去掉 hop-by-hop 头并把
  `host` 改为上游域名。响应状态码、响应头（含 Supabase 返回的 CORS 头）和
  响应体原样流式回传。
- 不做额外鉴权：代理不新增任何权限，鉴权仍由 Supabase anon key、用户 JWT
  和 RLS 负责。
- 上游连接失败或超时返回 `502 { "message": "Upstream request failed" }`，
  日志只记录 method、path 和错误原因，不记录请求头和请求体。

## 打包与上传

```bash
bun run fc:package:supabase-proxy
```

把 `dist/aliyun-fc/supabase-proxy` 作为函数代码包上传。

## 推荐函数配置

- 地域：**中国香港**（无需 ICP 备案，到国内三大运营商和 Supabase 新加坡区域线路都较好）
- 函数类型：Web 函数；运行时 Node.js 20 或 18；启动命令 `node server.js`；监听端口 `9000`
- 触发器：HTTP 触发器，请求方法勾选 `GET`、`HEAD`、`POST`、`PUT`、`PATCH`、`DELETE`、`OPTIONS`，认证方式：无需认证
- 单实例并发度：20 左右（请求以 I/O 等待为主）
- 执行超时：60 秒
- 最小实例数（预留实例）：按需在两者间取舍
  - `0`（省钱）：无请求时不计费；长时间无人访问后，首个请求会多几秒冷启动。
    注意每小时只要有调用就至少按 0.01 元出账，前端开着的标签页每小时自动刷新
    token 也会产生调用。
  - `1`（无冷启动）：实例 7×24 常驻计费，闲置时内存仍收费（单价 0.00011 元/CU，
    512MB 约 21 元/月，1GB 约 43 元/月，以阿里云官网为准）。
- 公网访问：开启
- 自定义域名：绑定自己的域名并配置 HTTPS 证书，前端使用该域名

## 环境变量

在函数配置中设置，不要提交真实值：

```env
# 必填，必须是 https
SUPABASE_URL=https://your-project.supabase.co
# 可选，逗号分隔；设置后来自其他 Origin 的浏览器请求返回 403
ALLOWED_ORIGINS=https://your-frontend.example.com,http://localhost:5173
# 可选，上游超时毫秒数，默认 60000
UPSTREAM_TIMEOUT_MS=60000
```

## 前端接入

在前端的构建环境变量中设置代理地址，然后重新构建并部署（VITE_* 变量在构建时写入产物）：

```env
VITE_REACT_APP_SUPABASE_PROXY_URL=https://supabase-proxy.your-domain.com
```

`VITE_REACT_APP_SUPABASE_URL` 保持原 Supabase 地址不变：前端用它推导登录态
的 localStorage key，切换或撤销代理都不会让用户掉登录。删除
`VITE_REACT_APP_SUPABASE_PROXY_URL` 并重新部署即可回滚为直连。

## 注意事项

- **请求体大小**：FC HTTP 触发器对同步请求体有大小上限（以阿里云当前文档为准），
  超过上限的 Storage 上传会失败。上线前请用最大尺寸的文件（如安全件图纸上限
  50 MB）实测一次上传。
- **Auth 按 IP 限流**：经过代理后，Supabase 看到的客户端 IP 是 FC 出口 IP，
  登录、发送验证码等按 IP 计的限流会由所有用户共享。
- **本地验证**：

  ```bash
  SUPABASE_URL=https://your-project.supabase.co node aliyun-fc/supabase-proxy/server.js
  curl -i "http://localhost:9000/rest/v1/<table>?select=id&limit=1" -H "apikey: <anon-key>"
  ```
