# Syney delivery order Aliyun FC Web function

「西尼订单 → 生成送货单」的生产环境跳板。西尼 SCM（`scm.syney.net:808`）只接受中国 IP，
Supabase 在新加坡访问不到，所以和入库单一样，由杭州的函数计算代为访问 SCM。

业务代码只在 `server/` 下维护一份 TypeScript，打包时由 `bun build` 生成单文件 `server.js`：

```bash
bun run fc:package:syney-delivery-order
```

把 `dist/aliyun-fc/syney-delivery-order` 整个目录作为代码包上传。

建议配置：

- 地域：华东 1（杭州），开通公网访问
- 运行时：Node.js 20 或 Node.js 18
- 启动命令：`node server.js`，监听端口 `9000`
- 请求方法：`POST`、`OPTIONS`
- 执行超时：120 秒（下载合并后的送货单文件可能较慢）
- 最小实例数：`0`（只有点「生成送货单」时才调用，不需要常驻实例）

环境变量与入库单 FC 相同，真实值只配置在函数计算里，不要提交到仓库：

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
ALLOWED_ORIGIN=https://your-frontend.example.com
SYNEY_SCM_USERNAME=your_syney_scm_username
SYNEY_SCM_PASSWORD_MD5=your_syney_scm_password_md5
```

部署后把函数的 HTTP 触发器地址配置到前端构建环境变量 `VITE_SYNEY_DELIVERY_ORDER_API_URL`。

每个请求都需要 Supabase 用户 access token，且用户拥有 `feature:syney-po-list.delivery-order` 权限：

```http
Authorization: Bearer <supabase-user-access-token>
Content-Type: application/json
```

请求体 `{ "action": "...", "payload": { ... } }`，最大 64 KiB。动作见
`src/services/syneyDeliveryOrderContract.ts`：

| action | 说明 |
|---|---|
| `create` | 按订单号在「采购订单履行」勾选全部可送明细并生成送货单 |
| `planSafeParts` | 读取送货单的安全部件行，与本系统安全部件信息匹配，返回待添加明细 |
| `addSafePartDetail` | 添加一条安全部件明细（「修改 → 添加」） |
| `confirm` | 供应商确认 |
| `print` | 导出（多张合并）并下载送货单文件，以 base64 返回 |

SCM 业务提示返回 `422 { error }`，其余上游错误统一返回 `502`。
