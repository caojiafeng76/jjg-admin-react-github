# Youmai purchase order Aliyun FC Web function

「优迈成品出库 → 获取采购订单」的生产环境跳板。Supabase Edge Function 在新加坡访问优迈 SRM
（`srm.hzoptimax.com`）时出现登录超时，所以和西尼的入库单、送货单一样，由杭州的函数计算代为访问。

业务代码只在 `server/` 下维护一份 TypeScript，打包时由 `bun build` 生成单文件 `server.js`：

```bash
bun run fc:package:youmai-purchase-order
```

把 `dist/aliyun-fc/youmai-purchase-order` 整个目录作为代码包上传。

建议配置：

- 地域：华东 1（杭州），开通公网访问
- 函数类型：Web 函数
- 运行环境：自定义运行时，Node.js 22（Debian 11）
- 启动命令：`npm run start`，监听端口 `9000`
- 执行超时：60 秒（登录和两次查询各有 20 秒超时）
- 最小实例数：`0`（控制台默认是 `1`，会持续计费；这里只有点「获取采购订单」时才调用）
- HTTP 触发器：请求方法只留 `POST`、`OPTIONS`，认证方式选「无需认证」。默认的「签名认证」会让浏览器无法调用；访问控制由函数内部的登录和权限校验负责

环境变量的真实值只配置在函数计算里，不要提交到仓库。`ALLOWED_ORIGIN` 要列出所有生产域名，用英文逗号分隔，漏掉的域名会返回 403：

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
ALLOWED_ORIGIN=https://your-frontend.example.com,https://your-other-frontend.example.com
YOUMAI_SRM_USERNAME=your_youmai_srm_username
YOUMAI_SRM_PASSWORD=your_youmai_srm_password
```

部署后把函数的 HTTP 触发器地址配置到前端构建环境变量 `VITE_YOUMAI_PURCHASE_ORDER_API_URL`，
然后重新构建前端。清空该变量即可回退到 Edge Function。

每个请求都需要 Supabase 用户 access token，且用户拥有 `page:youmai-finished-goods-stock-out` 权限：

```http
Authorization: Bearer <supabase-user-access-token>
Content-Type: application/json
```

请求体（最大 16 KiB）：

```json
{ "purchaseOrderNo": "HFZDCG20261105001573" }
```

成功响应：

```json
{ "purchaseOrderNo": "HFZDCG20261105001573", "total": 1, "items": [] }
```

错误响应格式为 `{ "error": "..." }`：

| 状态码 | 说明 |
|---|---|
| `400` / `413` | 请求体或订单号不合法 |
| `401` / `403` | 未登录、无权限或来源不在 `ALLOWED_ORIGIN` 内 |
| `422` | 可直接展示的业务提示：SRM 登录失败、请求超时、无法连接、未找到订单、没有可导入明细、账号未配置 |
| `429` | 触发限流（scope：`youmai-purchase-order`） |
| `502` | 其他上游错误，只返回通用提示 |
