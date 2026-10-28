# 更新日志

本文件记录项目的所有重要修改。每次修改完成后，必须在本文件顶部追加一条记录，最新记录置顶；仅修改本文件以补充日志时无需重复记录。

历史记录按月归档在 [docs/changelog/](docs/changelog/)（[2026-09](docs/changelog/2026-09.md)、[2026-08](docs/changelog/2026-08.md)、[2026-07](docs/changelog/2026-07.md)）。

## 记录格式

```markdown
## YYYY-MM-DD

- **类别**：新建 / 变更 / 修复 / 重构 / 性能 / 文档
- **范围**：受影响的模块或文件
- **摘要**：本次修改的内容与目的
- **验证**：执行过的检查、测试或构建命令；未执行时说明原因
```

## 2026-10-28

- **类别**：变更（部署）
- **范围**：阿里云函数计算华东 1（杭州）新函数 `syney-delivery-order`；本地 `.env`（不入库）
- **摘要**：通过用户的 Chrome 在 FC 控制台部署「生成送货单」跳板函数。
  - **函数配置**：Web 函数，自定义运行时 Node.js 22（Debian 11）；0.35 vCPU / 0.5 GB，单实例并发 20，最小实例数 0；启动命令 `npm run start`，端口 9000，超时 120 秒；允许默认网卡访问公网；代码包为 `bun run fc:package:syney-delivery-order` 的产物。
  - **环境变量**：`ALLOWED_ORIGIN`、`SUPABASE_URL`、`SYNEY_SCM_USERNAME` 沿用 `syney-store-report`；`SUPABASE_PUBLISHABLE_KEY`、`SYNEY_SCM_PASSWORD` 由用户本人填写。
  - **HTTP 触发器**：认证方式由用户改为「无需认证」，与入库单函数一致，鉴权由函数代码完成：来源白名单、Supabase 登录、功能权限。
  - **前端**：本地 `.env` 新增 `VITE_SYNEY_DELIVERY_ORDER_API_URL`，指向该函数公网地址。
- **验证**：对公网地址做冒烟测试，均符合预期：无 token 返回 401、伪造 token 返回 401、非白名单来源返回 403，`wumalu.top` 的 CORS 预检返回 204 并放行 POST。尚未在线上前端实际生成送货单；线上前端需带新变量重新构建发布后才会生效。

- **类别**：变更
- **范围**：`src/features/syney/PoList/PoForm.tsx`、`src/services/apiSyneyPos.ts`、`src/services/apiSyneyPos.vitest.ts`
- **摘要**：订单列表「编辑订单」弹窗新增「送货单号」字段，可修改或清空（带清除按钮），便于删除测试送货单后改回。清空时存为 NULL。只改状态等不涉及该字段的更新不会动送货单号。清空送货单号不会自动改状态，需要时在「操作」里另行修改。
- **验证**：新增 `normalizeSyneyPoUpdatePayload` 用例（修改、清空存 NULL、未传不更新）；PoList 与 apiSyneyPos 相关 22 个用例通过；`bun run typecheck` 通过；改动文件 ESLint 0 error。在开发页面打开 S202610280324 所在订单的编辑弹窗，确认字段已显示原值与清除按钮（未保存）。

- **类别**：修复
- **范围**：`server/syneyScmClient.ts`、`server/viteSyneyDeliveryOrderProxy.ts`、`server/syneyDeliveryOrderLogic.ts`（注释）、`src/services/syneyDeliveryOrderLogic.vitest.ts`、`.env.example`
- **摘要**：「生成送货单」单张试跑在「查询送货单列表」处失败，提示 SCM 返回内容为空。
  - **排查**：
    - 新增仅开发环境、按需开启的 SCM 请求跟踪（`SYNEY_SCM_TRACE=1`），写入系统临时目录 `syney-scm-trace.log`，不记录密码和 cookie 值。
    - 在用户的开发页面完整复现后，又在用户已登录的 SCM 里逐项对比查询写法，确认原因：**SCM 的 BindGrid 在查询结果为 0 条时返回空内容（0 字节），而不是 `{ data: [] }`**。订单 P202610270408 此前没有送货单，所以生成前按采购单号查送货单列表必然为空。同样的情况还出现在安全部件明细为 0 条，以及安全部件列表、送货单列表按不存在的单号查询时。
    - 上一条把空内容归因于自行添加 `PKID` 的判断不成立，相关注释已更正；BindFields 保持与页面一致。
  - **修复**：`bindScmGrid` 把空响应按 0 条处理。
  - **会话**：SCM 同一账号只允许一处登录，代理登录会把浏览器里同账号的 SCM 会话挤下线（用户已确认知晓）。
- **验证**：
  - 在开发页面对 P202610270408 完整跑通，跟踪日志中 SCM 逐步返回：
    1. 「生成成功！送货单号：S202610280324」（14 条明细）；
    2. 安全部件明细 2 条均「添加成功」（ZC005276 / YD1001XN / 梳齿支撑板，LC005276 / YD0201XN / 楼层板，制造日期 2026-11-05）；
    3. 「确认成功」；
    4. 「导出成功」。
  - 下载得到 `1f176828…送货单.pdf`（75 KB，3 页，`%PDF-1.4`）。本系统该订单变为「已送货」，送货单号为 S202610280324。
  - 新增 `bindScmGrid` 空响应与 MiniUI 格式解析用例；`bun run test` 192 个文件 / 906 个用例全部通过；`bun lint` 0 error；`bun run typecheck` 通过。

- **类别**：修复
- **范围**：`server/syneyScmClient.ts`、`server/syneyDeliveryOrderServer.ts`
- **摘要**：「查询采购订单履行明细」仍返回空内容。
  - **排查**：在用户已登录的 Chrome 里打开 SCM「采购订单履行」，用页面自带的查询功能搜索 P202610270408，记录真实请求。真实请求的 URL、`BindFields`、分页、排序与代码完全一致；在同一登录会话里，带与不带 `charset` 发送同样的查询，都能返回完整数据。由此判断差异在会话：浏览器登录成功后由 `login.js` 写入「上次登录用户」cookie 并跳转 `Main.aspx`，代码只登录后就直接打开页面。
  - **修改**：新增 `openScmSession`，按浏览器顺序执行：登录 → 写入用户 cookie → 进入 `Main.aspx` → 收集返回的 cookie。送货单代理的所有动作改用它。入库单服务仍用原 `loginToScm`，行为不变。`login.js` 还把密码明文写入 cookie，这一点不模仿。
- **验证**：`bun run typecheck` 通过；`syneyDeliveryOrderLogic`、`syneyDeliveryOrderHttp`、`proxyHandlers`、`viteProxySecurity`、`deliveryOrderBatch` 共 75 个用例通过；改动文件 ESLint 0 error。会话假设尚未经真实流程验证，待用户重试。

- **类别**：修复
- **范围**：`server/syneyDeliveryOrderLogic.ts`、`server/syneyDeliveryOrderServer.ts`、`src/services/syneyDeliveryOrderLogic.vitest.ts`
- **摘要**：单张试跑时，「查询采购订单履行明细」返回 HTTP 200 但内容为空。登录有效，页面也没有跳回登录页，说明是 SCM 查询本身出错后吞掉了异常。
  - **原因**：`BindFields` 由我们自行挑选，其中包含不在页面表格列里的 `PKID`、`QuoteStatus`。SCM 页面脚本直接使用 `row.PKID`、`row.QuoteStatus`，可见这两列由服务端自动附带，重复请求会导致查询出错。
  - **字段列表**：采购订单履行、送货单列表、安全部件列表三处查询的 `BindFields` 改为与 SCM 页面表格列完全一致，字段和顺序都相同，安全部件明细原本就一致。
  - **PKID 校验**：返回行统一把 `PKID` 转为数字，缺失时明确报错，不会悄悄选错行。
  - **QuoteStatus**：没有返回时不在本地拦截，交给 SCM 自己校验。
- **验证**：新增 BindFields 与缺少 QuoteStatus 的用例；`syneyDeliveryOrderLogic`、`syneyDeliveryOrderHttp`、`deliveryOrderBatch` 共 55 个用例通过；`bun run typecheck` 通过；改动文件 ESLint 0 error。是否解决待用户重试确认。

- **类别**：修复
- **范围**：`server/syneyScmClient.ts`、`src/services/syneyDeliveryOrderLogic.vitest.ts`
- **摘要**：单张试跑在「查询采购订单履行明细」处提示「返回的数据无法解析」，但没有附 SCM 原文，原因是返回内容为空或只有 HTML 标签，清理后什么都不剩。现在：
  - 打开 SCM 页面时，如果页面是未登录时那段跳回登录页的脚本（`UserLogin.aspx?tar=UnKnowUser`），直接提示「登录状态无效，被跳转到登录页，请确认账号有该页面权限」。
  - 查询结果无法解析时，区分三种情况：返回为空、跳回登录页、其他。其他情况附上压缩后的原始片段。
- **验证**：新增 `describeScmResponse` / `isScmLoginRedirect` 用例；`syneyDeliveryOrderLogic`、`syneyDeliveryOrderHttp`、`proxyHandlers`、`viteProxySecurity` 共 65 个用例通过；`bun run typecheck` 通过；改动文件 ESLint 0 error。真实原因待用户重试确认。

- **类别**：修复
- **范围**：`server/syneyDeliveryOrderHttp.ts`、`server/viteSyneyDeliveryOrderProxy.ts`、新增 `src/services/syneyDeliveryOrderHttp.vitest.ts`
- **摘要**：本地 `bun dev` 下点「生成送货单」时提示「Origin not allowed」，请求没有到达 SCM。
  - **原因**：开发代理沿用了 FC 的来源白名单 `ALLOWED_ORIGIN`，本地 `.env` 未配置该变量，页面自己发出的 POST 也带 Origin，因此被拒绝。
  - **同源放行**：开发中间件开启 `allowSameOrigin`，Origin 与请求 Host 相同即放行。FC 仍只认 `ALLOWED_ORIGIN`。
    - Vite 以 HTTPS（mkcert）运行时走 HTTP/2，请求没有 `Host` 头，因此改为在缺少 `Host` 时读取 `:authority`。
    - 已对正在运行的 dev server 用 HTTP/2 复现并验证：修复前 403「Origin not allowed」，修复后 401「未登录」，即已通过来源校验。
  - **Supabase 校验配置**：本地 `.env` 也没有 `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY`，否则下一步登录校验会失败。开发代理在未配置时沿用前端的 Supabase 地址（优先 `VITE_REACT_APP_SUPABASE_PROXY_URL`）和公开 key，仍会校验用户 token 与权限。
- **验证**：新增 `syneyDeliveryOrderHttp.vitest.ts`（7 个用例：同源判断、未开启时拒绝、开启后放行同源但仍拒绝其他来源、env 回退）；与 `syneyDeliveryOrderLogic`、`deliveryOrderBatch` 共 50 个用例通过；`bun run typecheck` 通过；改动文件 ESLint 0 error。真实 SCM 联调待用户重试。

- **类别**：修复
- **范围**：`server/syneyScmClient.ts`、`server/syneyDeliveryOrderServer.ts`、`server/syneyDeliveryOrderHttp.ts`、`src/features/syney/PoList/deliveryOrderBatch.ts`（含测试）
- **摘要**：单张试跑时，「生成送货单」步骤只显示「处理失败，请稍后重试」，看不到真实原因。原因是 SCM 返回的是英文异常页，前端 `getUserErrorMessage` 遇到不含中文的消息会换成兜底文案。现在：
  - 每个 SCM 请求带中文步骤名，失败时提示「<步骤>失败（HTTP 状态码）：SCM 原文」，如「查询采购订单履行明细失败（HTTP 500）：…」；返回数据无法解析时同样附原文。
  - SCM 登录失败、账号未配置改为可展示的业务错误。
  - 其他意外错误在 502 提示后附原因，如连不上 SCM 或超时。
  - 进度弹窗在只能拿到英文原文时，把原文附在兜底文案后面。
- **验证**：`deliveryOrderBatch.vitest.ts` 新增 `describeError` 用例；`deliveryOrderBatch`、`syneyDeliveryOrderLogic`、`proxyHandlers`、`viteProxySecurity`、`syneyStoreReportFields` 共 68 个用例通过；`bun run typecheck` 通过；改动文件 ESLint 0 error。真实原因待用户重试后确认。

- **类别**：新建
- **范围**：
  - 服务端：`server/{syneyScmClient,syneyDeliveryOrderLogic,syneyDeliveryOrderServer,syneyDeliveryOrderHttp,syneyDeliveryOrderFcServer,viteSyneyDeliveryOrderProxy}.ts`、`server/syneyStoreReportServer.ts`、`api/proxySecurity.ts`、`vite.config.ts`
  - 阿里云 FC：`aliyun-fc/syney-delivery-order/`、`scripts/package-syney-delivery-order-fc.mjs`、`package.json`
  - 数据库：`supabase/migrations/20261028090000_add_syney_po_delivery_no.sql`、`src/services/database.types.ts`（重新生成）
  - 前端：`src/services/{apiSyneyDeliveryOrder,syneyDeliveryOrderContract,apiSyneyPos,types}.ts`、`src/types.d.ts`；`src/features/syney/PoList/{DeliveryOrderButton,DeliveryOrderProgressModal,useGenerateDeliveryOrders}.tsx`、`deliveryOrderBatch.ts`、`safePartInfoRows.ts`；`index.tsx`、`PoTable.tsx`、`PoSelected.tsx`、`PoSelectedFilter.tsx`、`useSelectedPos.ts`、`useExportSafePartInfoAsExcel.ts`、`useExportShippingListAsExcel.ts`、`shippingListExcelDocument.ts`；`src/features/syney/{permissions,statusTones}.ts`；`.env.example`
- **摘要**：西尼订单列表新增「生成送货单」，把在西尼 SCM 里手动做的整套流程自动化。
  - **流程**：勾选订单后按订单号逐张、严格串行执行：① 在「采购订单履行」勾选该订单号全部可送明细（已创建 / 部分送货）并生成送货单 → ② 在「安全部件」按「修改 → 添加明细」逐条填写 → ③ 供应商确认 → ④ 回写本系统。全部结束后只调用一次 SCM 导出，由 SCM 合并成一个送货单文件并自动下载。
  - **进度弹窗**：每张订单逐步显示状态，安全部件显示 x/n。某张失败会记录原因并继续下一张；可以「停止」，在当前步骤完成后停下；结束后支持「重新下载」。
  - **安全部件数据**：与「导出安全部件信息」同源，行构建逻辑抽为 `safePartInfoRows.ts` 共用，并取该订单号下全部订单行，而不只是勾选的行。
    - 字段对应：编号 → 编号、型号 → 型号、名称 → 产品名称、订单交货日期 → 制造日期。
    - 按「生产号 + 件号」匹配 SCM 行：SCM 中一行对应多条信息时全部作为明细添加；n 行对 n 条时按顺序一一对应。
    - 以下情况整张单不提交并提示：信息匹配不上、产品名称不在 SCM 可选项中、产品名称为安全钳 / 限速器（需上传附件）。
    - 已存在的编号自动跳过，重跑不会重复添加；已生成但未确认的送货单会沿用。
  - **SCM 前置校验**：服务端复刻 SCM 页面在生成送货单前的校验，包括供应商、交货期、订单类型、备注、有效价格和原材料称重规则。
  - **回写**：`syney-pos` 新增 `DeliveryNo`，订单状态改为新增的「已送货」。列表新增「送货单号」列，「导出发货清单」的送货单号列改为自动带出。
  - **网络**：西尼 SCM 只接受中国 IP，生产环境新增杭州 FC 函数 `syney-delivery-order` 做跳板（`VITE_SYNEY_DELIVERY_ORDER_API_URL`）；开发环境走 Vite 中间件。
    - 业务逻辑只在 `server/` 维护一份 TS，FC 包由 `bun build` 打成单文件，不再手抄 JS。
    - SCM 登录、Cookie、表单提交抽为 `syneyScmClient.ts`，入库单服务改为复用，行为不变。
  - **权限与限流**：新增功能权限 `feature:syney-po-list.delivery-order`；代理限流新增 `syney-delivery-order` 作用域，上限 120 次/分钟，其余作用域仍为 30；代理请求体上限放宽为 64 KiB（仅该接口）。
- **验证**：
  - 新增 `src/services/syneyDeliveryOrderLogic.vitest.ts`（36 个用例：校验、匹配、FormSave 载荷快照、响应解析、请求体校验）和 `deliveryOrderBatch.vitest.ts`（7 个用例：严格串行顺序、失败继续、只导出一次、停止、沿用），更新 `shippingListExcelDocument.vitest.ts` 和 `apiSyneyPos.vitest.ts`（查询列加 `DeliveryNo`）。
  - `bun run test`：191 个文件 / 892 个用例，修正 `apiSyneyPos.vitest.ts` 后全部通过。
  - `bun lint` 0 error。
  - migration 由用户推送；随后用 Supabase CLI 重新生成 `src/services/database.types.ts`，差异仅为 `syney-pos` / `syney_pos_sorted` 新增 `DeliveryNo`。
  - `bun run typecheck`、`bun run build`、`bun run check:bundle` 通过。
  - `bun run fc:package:syney-delivery-order` 打包成功；本地起包后未带 token 的请求返回 401。
  - **未完成**：未连真实 SCM 联调，FC 函数也未部署。SCM 接口参数是从页面源码推断的，首次请用单张订单在 `bun dev` 下试跑并到 SCM 核对。

## 2026-10-22

- **类别**：重构 / 修复（前端体验统一 Phase 3：西尼 syney）
- **范围**：`src/features/syney/**`（PoList / PoDetail / ReportList / ReportDetail / SpecList / SafePartSetting），新增 `src/features/syney/{TableSelectionProvider.tsx,tableSelectionContext.ts,useTableSelection.ts,statusTones.ts}`；`src/pages/SyneySetting.tsx`；`src/store/index.ts`；`src/ui/StatusPill.tsx`；`docs/前端交互与反馈规范.md`、`src/hooks/REFACTORING_SUMMARY.md`
- **摘要**：按《前端交互与反馈规范》迁移西尼模块（Phase 2 车间生产因影响面大暂缓）。用户确认：选中状态改每页独立、hook 文件不合并、表单改纵向。
  ① **选中状态**：删除全局 zustand `tableSelectedKeys`，改为每个页面根组件提供 `TableSelectionProvider`，组件通过 `useTableSelection()` 读取；多标签页缓存下订单列表、对账单列表和两个详情页不再互相串选中项。
  ② **反馈**：去掉 22 个文件里的 `message.useMessage()` + `contextHolder` 和 `messageApi` 透传，统一 `App.useApp()`；文案统一为 `feedbackText`（对象+动作+结果），错误统一 `getUserErrorMessage`，不再直接展示 `error.message`；修正「导出成功！」「提交失败,请重试」「请稍候重试」「请选择至少一条数据」等不一致写法。修复几处重复提示：对账单 PDF / 汇总单 PDF 生成成功时 hook 和按钮各弹一次；创建订单失败时 hook 与页面各弹一次。对账单 PDF 进度提示改用固定 key 原地替换，不再用 `message.destroy()` 清掉页面上的其他提示。
  ③ **失败不关弹窗**：订单新建 / 编辑、订单明细编辑、对账单明细编辑、新建对账单、踏板规格保存失败时弹窗保持打开、已填内容（含已解析的 Excel）保留；对账单明细编辑原先在提交前就清空选中项（校验失败也会清空），已修正。
  ④ **表单**：5 个表单由横向（labelCol）改为纵向布局，11 条缺少文案的必填规则补全；明细编辑弹窗补 `destroyOnHidden`，改用 `afterOpenChange` 回填（替代 `setTimeout`）；弹窗宽度归到 520 / 720 档；「参数」标签统一为「参数规格」。
  ⑤ **视觉**：状态徽章统一 `StatusPill`（4 处自写颜色映射收敛为 `statusTones.ts`；`StatusPill` 新增 `info` 进行中色，部分送货→info、暂停→warning）；选中摘要条统一 `SelectedSummaryBar`（去掉手写 SVG / 渐变）；筛选区去掉「筛选条件」卡片外壳；详情信息区和编号设置页不再在内容卡片里再套 `app-card`；日期统一 `formatDate`。
  ⑥ **命名**：对账单页内统一称「对账单 / 对账单明细」，件号配置页统一「件号配置」（替换 Phase 1 写的「安全件设置」），踏板规格页统一「踏板规格」。
  ⑦ 规范文档补充「选中状态不放全局 store」与 StatusPill tone 语义，迁移进度更新。
- **验证**：`bun lint` 0 error；`bun run typecheck` 通过；`bun run test` 189 个文件 / 849 个用例全部通过（新增 `TableSelectionProvider.vitest.tsx` 验证两个页面实例选中互不影响；`usePo` / `useItem` / `queryKeys` 测试改为用 Provider 注入选中项；`SpecList/index.vitest.tsx` 随标签与错误文案更新）；`bun run build`、`bun run check:bundle` 通过。**未做浏览器手测**：建议人工确认订单列表与对账单列表同时打开时选中互不影响、打印对账单只出现一次成功提示、表单纵向布局观感。
- **遗留**：踏板规格 / 对账单列表 / 件号配置的按钮没有对应的功能权限 key（仅订单列表有），本批未新增；菜单名「入库单列表」与页内「对账单」称呼不一致，待确认是否改菜单名。

- **类别**：变更
- **范围**：`src/utils/toolingDataExcel.ts`、`src/utils/toolingDataExcel.vitest.ts`
- **摘要**：刀具资料「导出月度汇总」中上次盘点 / 入库 / 出库 / 结余四组数量列改为整数（四舍五入取整，单元格格式 `0;-0;;@`，0 仍显示为空）；合计行数量格式改为 `0`，合计与金额的缓存值均按取整后的数量计算，与 Excel 公式结果一致。只改导出层，service 计算与数据库不变。
- **验证**：`bun run test src/utils/toolingDataExcel.vitest.ts src/features/tooling/ToolingData/index.vitest.tsx`（5 passed）、`bun run typecheck`、`bun lint`（0 error）；未在浏览器中实际导出验证

- **类别**：变更
- **范围**：`src/utils/syneyDecomposition.ts`、`src/utils/syneyDecomposition.rear.test.ts`
- **摘要**：删除分解单后板候选（AF/FN/BX/BY/Y997）中"`Qty===2` 一律拆成上 1 下 1"的规则。这条规则是为导入去重造成的合并行准备的；导入去重已移除，存量合并行也已拆开，所以不再需要。现在带上头部或下头部标记的行整行进入对应格子；无标记的单条后板仍走原有的均分队列（单条 1+1，两条按顺序上/下），这部分不变。删除前核查数据库：后板候选中"Qty=2 且只带一个方向标记"的行为 0 条，存量订单的分解单结果不受影响。
- **验证**：`bun run test src/utils/syneyDecomposition`、全量 `bun run test`、`bun run typecheck`、`bun lint`

- **类别**：修复
- **范围**：`src/features/syney/PoList/index.tsx`、`src/services/apiSyneyPos.ts`（删除 `distinctItemsForPo`）；新增 `src/utils/syney.vitest.ts`
- **摘要**：西尼订单 Excel 导入时，同一生产编号下同件号的多行明细被合并。例如 XNJD-FZ26-148-0374 的 XN2808AF998 有上头部 L1=648 和下头部 L1=684 两行，创建后只剩 `1325*648 ×2`。原因是 2026-08-27（`a38fa0e`）加入的两处导入去重按 `PartNo+TaxUnitPrice` 合并，而导入明细没有单价。现在两处去重都删除，Excel 每行原样入库，入库条数与导入预览一致。
  删除依据：去重之前创建的 546 张订单中，同订单同件号多行共 626 组。其中 574 组参数规格相同、备注不同，是上/下头部成对的独立零件（ED1/ED2/AF1/AF2 等）；50 组参数规格不同；真正完全重复的只有 2 组。当时"14→24"的实际原因是详情页假分页，同一提交已经修好。去重反而让订单 800/803/804/805/816–819 的上/下头部两行合并成"Qty=2 + 只剩上头部备注"，这些存量数据已一并修正，见下文"数据修正"第 2 条。
  下游核对：分解单按上/下头部标记分格，并保留 `Qty===2` 的兼容分支；标签按 Qty 循环打印；安全件导出改为上/下各一行，与 08-27 之前一致；入库单汇总仍自行调用 `distinctItems`，口径不变。当天曾先尝试"去重键加入 `ParamSpec`"的方案，因无法覆盖规格相同、备注不同的情况，已撤回。
  **数据修正**：订单 P202610100541 / XNJD-FZ26-148-0374（`syney-pos.id=814`）的明细 `id=10944` 由 `1325*648 ×2` 改为 ×1（上头部）；另新增 `id=11008`，为 `1325*684 ×1`、下头部备注，其余字段复制自 10944。两步在同一事务中执行，并带当前状态守卫。② 经用户确认上/下头部规格相同，订单 800/803/804/805/816/817/818/819 的 AF1 或 AF2、ED1、ED2 共 24 行，由"Qty=2 + 上头部备注"拆为上头部、下头部各 Qty=1。下头部备注按历史 421 对成对数据的格式生成：AF 行把"上头部"换成"下头部"，原备注中的地区前缀（中国大陆/海外）已无法还原，因此留空；ED 行同时去掉"1件"。其余字段复制自原行，同一事务执行，并带"Qty=2、仅含上头部、同件号无其他行"的守卫。
- **验证**：`bun run test src/utils/syney.vitest.ts`、全量 `bun run test`、`bun run typecheck`、`bun lint`；数据修正后查询 814 共 15 条明细（与 Excel 行数一致），AF998 为 648 和 684 各 1 行；8 张订单修正后核查 24 组均为上/下各 1 行（异常组 0），各单明细由 11 条变为 14 条

## 2026-10-21

- **类别**：修复 / 变更 / 文档（前端体验统一 Phase 1）
- **范围**：`src/hooks/useMutationWithMessage.ts`；`src/utils/{errorHandler,feedbackText,format}.ts`；`src/ui/{TableState,FormErrorAlert,DeleteButton,AppPagination,MainMenu,AppLayout}.tsx`，新增 `src/ui/{PageErrorBoundary,PageForbidden,ErrorTechnicalDetail}.tsx`、`src/hooks/useUrlListState.ts`、`src/config/pagination.ts`；`src/routes/{routeHelpers,RouteGuards,router}.tsx`、`src/pages/PageNotFound.tsx`、`src/main.tsx`；production-order / material-transfer / extrusion-production 的 mutation hook 与明细组件；syney 的 PoList / PoDetail / ReportList / ReportDetail / SpecList / SafePartSetting；villa-lift 三个页面；packaging / quality / workshop 的 7 张表；文档 `docs/前端交互与反馈规范.md`（新增）、`AGENTS.md`、`.github/copilot-instructions.md`、`src/ui/CLAUDE.md`、`docs/UI设计调研与改版指南.md`
- **摘要**：用户反馈前端体验割裂。排查结论是三代写法并存（syney 早期、车间中期、jintan/youmai 新一代），且文档仍以最老的 syney/PoList 为样板。本批先修实际 bug、补基础设施、定统一规范，模块迁移后续分批进行。
  ① **提示被吞**：`useMutationWithMessage` 原用 `message.useMessage()`，调用方不渲染 `contextHolder` 时提示不显示（syney 规格编辑/删除、入库明细编辑/删除、标记已校对等 7 处成功失败均无反馈），改为 `App.useApp()`，`contextHolder` 恒为 null 以兼容旧调用；production-order / material-transfer / extrusion 的 hook 原本也配了（被吞的）提示，页面另有 toast，改为静默 `useMutationWithInvalidation` 避免修复后双弹；生产工单详情的工序明细增删改原本无任何反馈且失败时为未处理异常，补齐提示与 `confirmLoading`。
  ② **错误原因**：`handleApiError` 不再把数据库英文原文拼进用户消息；常见 Postgres 错误码（23505 / 23503 / 23502 / 23514 / 22P02 / 42501 / PGRST116 等）翻译为中文原因，数据库抛出的中文业务错误原样保留；原文和错误码存入 `AppError.details` / `code`；`Failed to fetch` 先于通用分支识别为网络错误（原逻辑因 TypeError 也带 message 而走不到）；标点改全角。新增 `getUserErrorMessage` / `getErrorTechnicalDetail`；`TableError` 改为显示真实原因（原先固定为「请检查网络连接后重试」），`TableError` 与 `FormErrorAlert` 增加可折叠、可复制的「技术详情」；删除 0 处使用的 `useErrorHandler` / `showErrorNotification`。
  ③ **出错不再整页崩**：每个 `permissionRoute` 包裹 `PageErrorBoundary`（结合 `QueryErrorResetBoundary`，提供重试），首屏查询失败或渲染异常只替换当前内容区，菜单和其他缓存标签页不受影响（原先冒泡到根路由 errorElement，整个布局被替换）；404 移入布局内；syney 列表查询改 `throwOnError:false` 并去掉 `useEffect` 中的报错 toast，消除与 `TableError` 的双重反馈。
  ④ **权限**：仅当前页面无权限时在布局内渲染 403（`PageForbidden`），不再跳到「当前账号暂无可用前端入口」全屏页；villa-lift 新增按钮由「无权限隐藏」改为与全站一致的「禁用 + 提示」。
  ⑤ **删除确认**：SafePartSetting 批量删除原本无二次确认，改用 `DeleteButton`；`DeleteButton` 默认标题由「删除订单」改为按 `itemName` 推导（默认「删除记录」），补全 syney 规格 / 对账单 / 入库明细 / 订单、生产工单调用方的 `title` / `itemName` / `count`；3 处手写删除 Popconfirm 补危险色确认按钮，文案统一为「确认删除」。
  ⑥ **格式与状态基础设施**：`dayjs.locale('zh-cn')`（已确认代码无依赖周起始日的逻辑）；`format.ts` 新增 `DATE_FORMAT` / `DATETIME_FORMAT` / `formatDate` / `formatDateTime`；新增 `feedbackText` 文案模板（对象+动作+结果）、`config/pagination.ts`、`useUrlListState`（筛选/分页只以 URL 为源，replace 写入）；`AppPagination` 改 replace 模式；点击菜单进入已打开的页面时恢复该标签页的完整地址（与标签切换一致）；syney 详情「返回列表」由 `navigate(-1)` 改为携带列表地址返回。
  ⑦ **暗色**：7 张表的斑马行和高亮行补 `dark:` 变体。
  ⑧ **规范文档**：新增 `docs/前端交互与反馈规范.md` 作为唯一权威规范（样板为 jintan/youmai），`AGENTS.md` / `copilot-instructions.md` 的模块结构与 mutation 示例改指向新规范，重写过时的 `src/ui/CLAUDE.md`，在 UI 设计指南中标注与现状冲突的 Drawer / 24px 条目。
- **验证**：`bun lint` 0 error；`bun run typecheck` 通过；`bun run test` 187 个文件 / 843 个用例全部通过。新增测试：`useMutationWithInvalidation.vitest.tsx` 补 2 例（不渲染 contextHolder 也能出提示、静默版不弹错误）、`errorHandler.vitest.ts`、`PageErrorBoundary.vitest.tsx`（布局内报错、重试恢复）、`DeleteButton.vitest.tsx`、`useUrlListState.vitest.tsx`、`RouteGuards.test.tsx`（无权限渲染 403 不跳转、停用账号仍跳转）。随行为变化更新的断言：`apiWorkshopOrderOptions.vitest.ts`（错误消息改为「动作：原因」）、`ProductionOrderForm.vitest.tsx`（确认按钮改为「确认删除」）、`SafePartSettingPage.vitest.tsx`（补权限 hook mock）。`bun run build` 和 `bun run check:bundle` 通过（入口 gzip 32.0 KB）。**未做浏览器手测**（需要登录账号）：标记已校对提示、断网时只有内容区报错、无权限账号看到布局内 403、暗色斑马行这几项建议人工确认。
- **遗留（后续批次）**：Phase 2 车间生产、Phase 3 syney、Phase 4 其余模块按规范迁移（页面骨架、`TableState` + `throwOnError:false`、`StatusPill`、`formatDateTime`、`useUrlListState`、`feedbackText`、Modal 三档宽度、14 个 ExcelImport 收敛、员工端暗色）；villa-lift 批量删除仍为「选中后才出现、无权限隐藏」，随 Phase 4 改用 `DeleteButton`。审计列出的 5 处 service 层裸 `throw error` 经核查均为清理后重抛已处理的错误或 fetch 层透传，无需修改。

## 2026-10-21

- **类别**：变更 / 工程配置
- **范围**：`.vscode/settings.json`
- **摘要**：新增 `"deno.enablePaths": ["supabase/functions"]`，让 Deno 扩展只检查 Supabase Edge Functions 目录，避免在工作区启用 Deno 时把 `src/` 前端代码也按 Deno 规则检查、与 TypeScript 语言服务冲突。
- **验证**：`bunx eslint .vscode/settings.json` 通过；需在 VS Code 中重新加载窗口后生效，未做编辑器内人工确认。

## 2026-10-20

- **类别**：重构 / 工程优化
- **范围**：`scripts/sync-skills.mjs`（新增）、`scripts/engineering-guards.vitest.ts`、`package.json`、`AGENTS.md`；`CHANGELOG.MD` 与新增 `docs/changelog/2026-0{7,8,9}.md`；超大文件拆分（`src/services/apiOrderStatusDashboardCalculations.ts` → `src/services/orderStatusDashboard/`，`src/services/apiPrecisionFinishingCuttings.ts` → `src/services/precisionFinishingCuttings/`，`src/features/workshop/StandardTimeList/`，`src/features/syney/SafePartSetting/`）；ESLint 告警（`src/contexts/`、`src/ui/{PermissionGate,PermissionField,ExcelParseErrorList}.tsx`、syney 三个表单、14 个 Excel 导入组件等）；antd 废弃 API 迁移（约 60 个组件文件）；3 个偶发超时测试与 `remoteEmployeeSelect.vitest.tsx`、`usePo.vitest.tsx`、`lazyDocumentModules.vitest.ts`
- **摘要**：只做工程项，不改业务行为。① `git gc --prune=now` 清掉 27 MB 孤儿 pack（本地维护，不入库）。② 本机 `.claude/skills` 是指向 `.agents/skills` 的目录链接，但 git 里是两份普通文件，其他检出环境会漂移：新增 `bun run skills:sync`（以 `.agents/skills` 为准镜像到 `.claude/skills`，两者是同一目录时跳过），守卫测试校验两份内容一致。③ CHANGELOG 293 KB → 87 KB：07–09 月记录原文搬到 `docs/changelog/`（233 条逐行比对无丢失），根文件只留 10 月，"记录格式"挪到文件头。④ 偶发超时：守卫测试明确禁止全局 `testTimeout`，因此按现有约定只给 `remoteEmployeeSelect`、`MobileProductionOrderScanPage`、`ProductionOrderForm` 三个套件设 15s；另外 `remoteEmployeeSelect` 在真实 `.env` 下全量运行稳定失败，根因是断言取了中间帧（关键字走 `useDeferredValue`、已选项走 `Form.useWatch` + effect 回写，要多次渲染才稳定），改为在 `waitFor` 内断言最终状态。⑤ 拆分 4 个 700+ 行文件，原导入路径保留为 barrel（导出列表与拆分前逐项比对一致），调用方零改动：订单现状计算拆成 constants / textUtils / jobMatching / productionDetail / packaging；精加工切割接口拆成 types / normalize / queries / mutations；成本核算页 823 → 332 行（抽出 `buildStandardTimeSubmitValues` 纯函数、搜索 URL 同步、表单、批量操作、导出 5 个模块，搜索参数 8 段 if/else 改为按原顺序循环，URL 结果一致）；安全件设置页 761 → 250 行（表格 / 表单弹窗 / 图纸预览弹窗 / 图纸 hook / 常量，两处相同的"是/否"徽标合并成 `BooleanBadge`）。⑥ ESLint 43 条 warning 清零：Context 改 React 19 写法（`<Ctx value>` / `use()`）；syney 三个表单去掉 `forwardRef` 改 ref 作为 prop；修正 JSDoc（含两处被 `normalizePartNo` 插在中间、错挂到别的函数上的注释）；两个泄漏的 `setTimeout` 补清理（`useTableHeight` 取消定时器时同步复位 `isUpdatingRef`，避免后续计算被一直跳过）；3 处 `useState` 改惰性初始化；14 个 Excel 导入组件里完全相同的解析问题列表抽成 `ExcelParseErrorList`；静态只读列表下标 key、`PermissionGate`/`PermissionField` 的 `cloneElement` 属组件契约，保留并写明原因的行内 disable。⑦ `antd lint` 125 → 16：用 TS AST 按 lint 报告的文件/行号精确改写（`destroyOnClose`→`destroyOnHidden`、Alert `message`→`title`、Select/AutoComplete 的 `filterOption`/`optionFilterProp` 移入 `showSearch={{...}}`（所有涉及的 Select 原本都开了 showSearch，不改变是否可搜索）、Space/Splitter→`orientation`、Spin `tip`→`description`、Progress `trailColor`→`railColor`、Descriptions/Empty 改 `styles`、Tag `bordered={false}`→`variant="filled"`）；静态 `message`/`Modal.confirm` 改 `App.useApp()`；Input/InputNumber `addonAfter` 改 `Space.Compact` + `Space.Addon`（内层 `Form.Item noStyle` 绑定字段，外层补 `required` 星号）；两个机器编号下拉从 `Select.Option` 子元素改为 `options` + `optionRender`。
- **遗留**：`antd lint` 剩 16 条"受控 `fileList` 未提供 `onChange`"（Excel 导入组件），这些组件在 `beforeUpload` 里异步解析后自行设置列表、`onRemove` 清空，加同步型 `onChange` 会与异步解析竞争覆盖 `done` 状态，加空 `onChange` 只是规避检查，故保留；antd lint 不支持行内忽略，在此记录。根治方式是把 14 个几乎相同的导入弹窗收敛成一个公共 hook，另行处理。
- **验证**：`CI=true bunx eslint .` 0 error / 0 warning；`bun run typecheck` 通过；`bun run test` node 脚本测试 + Vitest 183 文件 / 823 项全部通过，真实 `.env` 下全量 Vitest 连续 3 次通过；`vitest run --coverage` 连续 3 次 823/823 通过、覆盖率门槛未报错；`vite build`、`bun run check:bundle`（入口 gzip 30.9 KB）通过；`bunx antd lint src` 0 deprecated / 16 usage（即上述遗留）。新增 / 调整测试：`buildStandardTimeSubmitValues.vitest.ts`、`useStandardTimeSearchParams.vitest.tsx`、`SafePartSettingPage.vitest.tsx`（拆分前后的页面都跑过并通过）、skills 一致性守卫（人为制造漂移后确认会失败，再同步恢复）。另在 HEAD 的临时 worktree 中，真实与占位 env 下各跑两次全量 Vitest，确认 `remoteEmployeeSelect` 的失败与本次业务改动无关（worktree 已清理）。**未做浏览器回归**（需要登录）：标准工时页、安全件设置页、两个移动端扫码页的"常用"输入框、排产弹窗的进度百分比、机器编号下拉，建议手动点一遍。

- **类别**：工程配置 / ESLint · 格式化
- **范围**：`eslint.config.js`（重写）、`package.json`、`bun.lock`、删除 `.prettierrc`、新增 `.vscode/settings.json`、`.vscode/extensions.json`、`.gitignore`、AI 指令（`AGENTS.md`、`.github/copilot-instructions.md`、`.github/ai-task-matrix.md`、`.claude/DEVELOPMENT_WORKFLOW.md`、`docs/ai-notes/{style_conventions,suggested_commands,task_completion}.md`）、守卫测试（`scripts/engineering-guards.vitest.ts`、`src/appShellConfig.vitest.ts`），以及全仓 ESLint 自动修复（约 860 个 TS/TSX/JS/JSON 文件）
- **摘要**：改用 `@antfu/eslint-config@9.5.1` 统一 lint 与格式化，移除 Prettier。依赖：新增 `@antfu/eslint-config`、`@eslint-react/eslint-plugin`、`eslint-plugin-better-tailwindcss`（Tailwind v4 类名排序 / 去重 / 多余空格，替代 `prettier-plugin-tailwindcss`）；移除 `prettier`、`prettier-plugin-tailwindcss`、`@eslint/js`、`typescript-eslint`、`globals`、`eslint-plugin-react-hooks`（由 antfu react 预设提供）。`bun format` 改为 `eslint . --fix`。配置要点：`react` + `typescript`，单引号 / 无分号 / 2 空格；忽略 `docs/**`、AI 工具目录、`openspec/**`、`supabase/config.toml`、生成文件 `database.types.ts`，关闭 Markdown 代码块 lint。沿用原规则：关闭 `ts/ban-ts-comment`、`ts/no-explicit-any`、`react/set-state-in-effect`，`_` 前缀变量可不使用，`react-refresh/only-export-components` 为 warn。为适配本仓库额外关闭或放宽的规则：`node/prefer-global/{process,buffer}`（多运行环境直接用全局变量）；`no-console`（只在 `aliyun-fc` / `api` / `scripts` / `server` / `supabase/functions` 关闭）；`new-cap` 例外 `jsPDF`；`ts/no-use-before-define` 允许变量在闭包中先引用后声明；`*.worker.ts` 允许用 `self`；`node --test` 脚本测试关闭 `test/no-import-node-test` 和 `test/consistent-test-it`（否则自动修复会把它们改成 vitest，导致测试失败）；`e18e/prefer-array-fill`（修复后 TS 推断成 `unknown[]`）；`style/jsx-one-expression-per-line`（修复时会丢 JSX 文本空格，如 `{a} / {b}` 渲染成 `a /b`；发现后全部 `.tsx` 回到原代码，关闭该规则后重新修复）；`test/prefer-lowercase-title`（保留原测试标题，已改动的 3 处已还原）。全仓自动修复只改格式和 import 顺序。手动处理了 autofix 改不了的报错：未使用的正则捕获组改成非捕获组并同步调整取值下标（`syney.ts` 的 `LENGTH_PATTERN`、日期标题正则 3 处、`queryClient`、`attendanceExcel`）；`isNaN` 改成 `Number.isNaN`（参数已经是 `Number()` 的结果，行为不变）；`new Array(n).fill(x)` 改成 `Array.from({ length }, () => x)`；调整 `RouteGuards.test` 中 hook 的顺序；`edge-runtime.d.ts` 改用函数属性签名；生产工单页 JSX 三元表达式换行；旧规则名的 disable 注释改为新名称；`new URL()` 校验和 2 处正则回溯告警加了带原因的行内 disable。守卫测试的正则改为同时兼容 antfu 风格（对象键可带引号、箭头函数参数可不带括号），ESLint 守卫改为断言使用 antfu 配置、未引入 Prettier。AI 指令新增强制步骤：写完代码后先 `bunx eslint --fix <改动文件>` 格式化，再确认 `bun lint` 0 error。剩余 43 条 warning（React 19 写法建议，如 `forwardRef`、`useContext`、数组下标作 key 等）保持 warning，没有批量改动。
- **验证**：`bun lint` 0 error / 43 warning；`bun run typecheck` 通过；`bun run test` 38 项 node 脚本测试 + 180 个 Vitest 文件 / 811 项全部通过；`bun run build` 通过；`bun run check:bundle` 通过（入口 gzip 30.9 KB）；`deno check supabase/functions/*/index.ts` 通过；用临时文件抽查 Tailwind 类名排序、去重和多余空格清理均生效；`database.types.ts` 未改动；除说明已移除的文字外，`rg prettier` 只剩历史文档、CHANGELOG 旧记录和锁文件中的间接依赖。未做浏览器端到端验证。

- **类别**：功能 / 金檀木业
- **范围**：`supabase/migrations/20261020000000_add_jintan_parts_inventory_safety_stock.sql`、`supabase/migrations/20261020000100_seed_jintan_parts_safety_stock_20261020_excel.sql`、`src/services/apiJintanPartsInventory.ts`、`src/services/database.types.ts`（重新生成）、`src/features/jintan/queryKeys.ts`、`src/features/jintan/PartsInventory/`（`index.tsx`、`JintanPartsInventoryTable.tsx`（含 vitest）、`JintanPartsInventorySearch.tsx`、`JintanPartsInventoryForm.tsx`、`useJintanPartsInventory.ts`、新增 `stockStatus.ts`（含 vitest）、`inventoryOptions.vitest.ts`）、`src/utils/jintanPartsInventoryExcel.ts`（含 vitest）
- **摘要**：配件库存按安全库存三色显示。`jintan_parts_inventory` 新增 `unit_quantity`（单台数量，空 = 未设置）和 `safety_multiple`（倍数，默认 10，至少 5），以及生成列 `safety_stock`（单台 × 倍数）、`threshold_stock`（单台 × 5）、`stock_status`（库存 ≥ 安全库存为 safe，< 阈值为 danger，介于两者之间为 warning，未设置为 unset）和 `stock_status_rank`。出入库只改 quantity，状态会自动重算。页面：库存数量显示为红/黄/绿 Tag，新增单台数量、安全库存、阈值三列；顶部状态统计可点击筛选；搜索栏加"库存状态"下拉（同步到 URL `status` 参数）；列表把不足的排在最前面；编辑弹窗可改单台数量和倍数，并实时预览。导出 Excel 增加单台数量、安全库存、阈值、状态四列，库存数量和状态单元格按状态填底色。导入模板不变。
- **数据**：按《凉亭螺丝安全库存.xlsx》（220U凉亭 + 140U凉亭 两个工作表，只取"倍数"列有值的行）写入 40 个配件的单台数量和倍数。口径已由用户确认：表格"倍数"列 = 单台 × 10；同一配件多行或跨型号时单台数量全部相加；扳手倍数按表格合计反推（4mm 2×15，5mm 1×20）；17 项名称或规格写法不一致的按同一配件合并（如 内六角沉头螺钉 → 内六角沉头螺丝、润滑油 → 润滑脂）。新增 8 个配件资料（库存 0）：玻璃胶、外六角螺钉 M10*55、毛刷 2883、手摇杆 2.2m、转角盖板 50*50*2.5、横梁盖板、转角组件、叶片固定盖板组件。型材件（铝合金固定座、固定座封头板）、叶片固定盖板、叶片弹簧盖板跳过。推送后库内共 56 条：不足 16 / 偏低 5 / 充足 19 / 未设置 16。已知：140U橡胶密封条库存按"卷"记、安全库存按根算，会一直显示红色（用户已知悉）。
- **验证**：`bun run db:push`（用户在交互终端确认后执行）成功，`db:push:dry-run` 显示已是最新；只读查询核对 40 行数值与表格一致；`bun run db:types` 已重新生成（CLI 同时把 `PostgrestVersion` 从 "14.5" 改为 "13.0.5"，未手动改回）；`bun run typecheck` 通过；`bun lint` 0 问题；`bun run test` 180 文件 / 811 项全部通过；`bun run build`、`bun run check:bundle`（入口 gzip 31.1 KB）通过。未在浏览器中验证页面效果（需要登录）。

## 2026-10-15

- **类别**：功能 / 车间
- **范围**：`src/services/apiOrderStatusDashboard{,Calculations,Types}.ts`（含 vitest）、`src/features/workshop/OrderStatusDashboard/`（`dashboardColumns.tsx`、`dashboardRenderUtils.tsx`（含 test）、`index.tsx`、`useOrderStatusDashboard.ts`）、`src/utils/orderStatusDashboardExcel.ts`
- **摘要**：订单现状页（`/production-scheduling`，`OrderStatusDashboard`）新增「库存」列，按项目号计算：库存 = 精切转入（`precisionCuttingQuantity`）+ 自动切合格（看板「切割 / 自动切」岗位末道工序产量）− 各工序报废（`totalDefectQuantity`）− 物料转移数量（`transferQuantity`）。所有输入都来自看板已有的 RPC 数据，不新增查询，也没有数据库迁移。列序调整为 返工返修 → 成品率 → 完工率 → 物料转移数量 → 接收车间 → 库存（固定右侧）→ 生产状态（固定右侧）。负数库存标红，悬停显示四项明细。Excel 导出在「接收车间」后面新增「库存」列。动态更新：看板每 30 秒自动刷新，切回窗口时也会刷新；后台刷新不显示遮罩，只有查询、翻页和手动刷新时才显示 loading。
- **撤销**：提交 4ee4614 误把库存列加到了订单排产页（`/order-scheduling`，`ProductionScheduling`），本次通过 `git revert --no-commit 4ee4614` 将其完整撤销（包括该提交写入的 CHANGELOG 条目）。
- **数据提示**：抽查生产库，非关闭订单中约 996 / 5495 个项目号的库存为负数。这些订单有转移记录，但没有精切转入或自动切报工数据。
- **验证**：`bun run typecheck` 通过；相关 vitest 全部通过（apiOrderStatusDashboard、OrderStatusDashboard 共 4 个文件 / 26 项；撤销后的订单排产相关测试也已通过）；改动文件 eslint 0 问题，没有引入新的 Prettier 问题。未在浏览器中验证页面效果（需要登录）。

## 2026-10-14

- **类别**：修复 / CI
- **范围**：`.github/workflows/ci.yml`、`package.json`、`bun.lock`、`scripts/engineering-guards.vitest.ts`、`supabase/functions/_shared/production-daily-report-summary-worksheet.ts`
- **摘要**：修复 CI 的三个既有失败（main 最近几次推送的 CI 都失败）：① gitleaks-action 在 `pull_request` 事件下必须提供 token，给 Secret scan 步骤加上 `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}`；② `deno check` 报 TS2345：7dc4d43 给 `ProductionDailyReportAbnormalDisplayRow` 新增了必填字段 `productModel`，但 Edge 版汇总表的 `ProductionDailyReportSummaryRow` 没有同步。运行时数据本来就带这个字段（`export-production-daily-report/index.ts` 组装行时会设置 `productModel`），所以只补了类型声明，不影响运行行为；③ `bun audit --production` 报 dompurify 3.4.12 有 GHSA-55q2-fjhq-7xh7（中危）和 GHSA-6688-9rhm-gjv2（低危），把 overrides 升到 3.4.17（在 jspdf 要求的 `^3.3.1` 范围内），工程守卫测试里的固定版本断言同步更新。
- **验证**：`bunx deno check supabase/functions/*/index.ts` 通过；`bun audit --production` 无漏洞；`bun run lint`、`bun run typecheck`、`bun run build`、`bun run check:bundle` 通过；`bun run test:coverage` 跑了两次，都是 178 文件 / 800 项中 798 项通过，但每次失败的 2 项都不一样（第一次是 dompurify 守卫断言 + `MobileProductionOrderScanPage` 超时，守卫断言修正后第二次是 `remoteEmployeeSelect` + 另一个超时），失败的文件单独运行均通过，判断为覆盖率模式下负载导致的偶发超时。

- **类别**：变更 / 依赖
- **范围**：`package.json`、`bun.lock`
- **摘要**：依赖升级第 3 批：antd 6.5.3 → 6.6.6（继续精确锁定）、@ant-design/cli → 6.6.6。antd 6.6.6 依赖 `@rc-component/util@^1.13.0`，但 bun 把顶层那份留在 1.12.0、只在 `antd/node_modules` 下另装 1.14.0；而 `vite.config.ts` 用 alias + dedupe 强制所有包使用顶层副本，导致构建报 79 个 `MISSING_EXPORT`（如 `isReactRenderable`）。执行 `bun update @rc-component/util` 把顶层副本升到 1.14.0（所有依赖方的版本范围均为 ^1.x，均满足），重复副本随之消失，package.json 无额外改动。
- **构建产物变化**：vendor-antd-core gzip 241.7 → 243.1 KB，首屏 JS 总量 571.3 → 573.0 KB。
- **验证**：`bun run typecheck` 通过；`bun lint` 0 问题；`bun run test` 178 文件 / 800 项全部通过；`bun run build`、`bun run check:bundle`（入口 gzip 31.1 KB）通过；`bunx antd lint src` 共 125 条，与用 6.5.3 规则跑出的结果逐类一致，6.6 没有新增废弃告警（这 125 条均为既有问题，本次未处理）。未在浏览器中逐页验证样式。
- **后续注意**：以后升级 antd 时，如果构建报 `@rc-component/util` 缺少导出，先检查顶层副本版本，原因是 `vite.config.ts` 的 alias / dedupe。

- **类别**：变更 / 依赖
- **范围**：`package.json`、`bun.lock`
- **摘要**：依赖升级第 2 批：react / react-dom 19.2.8 → 19.3.0，@types/react / @types/react-dom → 19.3.0，四者同步升级。
- **构建产物变化**：vendor-react chunk gzip 147.6 KB → 160.1 KB，首屏 JS 总量 558.8 KB → 571.3 KB（+12.5 KB，约 +2%）。已确认打包的是生产版（无开发版标记），增量来自 react-dom 19.3 本身。如需回退，单独 revert 本提交即可。
- **验证**：`bun run typecheck` 通过；`bun lint` 0 问题；`bun run test` 178 文件 / 800 项全部通过；`bun run build`、`bun run check:bundle`（入口 gzip 31.1 KB）通过。未在浏览器中逐页验证。

- **类别**：变更 / 依赖
- **范围**：`package.json`、`bun.lock`
- **摘要**：依赖升级第 1 批（补丁 / 小版本，semver 兼容）。生产依赖：@ant-design/icons 6.3.4、@supabase/supabase-js 2.117.3、@tanstack/react-query 5.104.2、dayjs 1.11.23、immer 11.1.21、jszip 3.10.2、pinyin-pro 3.29.5、react-router-dom 7.18.4、zustand 5.0.15；开发依赖：@tanstack/react-query-devtools 5.104.2、@testing-library/jest-dom 7.0.1、@testing-library/react 16.3.3、@testing-library/user-event 14.6.8、@types/node 26.6.5、@vitejs/plugin-react 6.1.2、eslint 10.12.0、eslint-plugin-react-refresh 0.5.7、globals 17.13.0、jsdom 30.1.2、postcss 8.5.30、prettier 3.9.10、supabase 2.120.0、typescript-eslint 8.71.2、vite 8.3.4、vitest / @vitest/coverage-v8 4.1.11。`bun outdated` 里 typescript 6.0.3→7.0.2 属于误报（`typescript` 有意指向 TS6，TS7 由 `@typescript/native` 提供），未改动；vitest 5 为大版本，另行处理。
- **构建产物变化**：入口 chunk gzip 26.0 KB → 31.1 KB。逐个回退定位到 rolldown 1.2.2 → 1.2.13（vite 的间接依赖，单独回退 vite / @vitejs/plugin-react 均不影响）：新版把 contexts、queryClient、apiPermissions、access 等小共享 chunk 合并进入口。按 manifest 统计首屏 JS 总量 560.3 KB → 558.8 KB、请求数 15 → 11，不是退化。
- **验证**：`bun run typecheck` 通过；`bun lint` 0 问题；`bun run test` 首次 178 文件 / 800 项中 799 项通过，失败的是已知偶发用例 `remoteEmployeeSelect.vitest.tsx`，单独运行通过，全量复跑 800/800 通过；`bun run build`、`bun run check:bundle` 通过。未在浏览器中逐页验证。

- **类别**：重构 / 路由
- **范围**：`src/routes/router.tsx`；新增 `src/routes/routeHelpers.tsx`、`src/routes/modules/*Routes.ts`（system、syney、workshop、production、tooling、inventory〔优迈 + 金坛〕、process〔别墅梯 + 包装〕）、`src/routes/router.vitest.ts`
- **摘要**：`router.tsx` 原有 953 行，70 个页面路由都重复写一遍 `Suspense` + `PermissionProtectedRoute` 包装。新增 `permissionRoute(path, permissionKey, Page)`、`redirectRoute`、`publicRoute` 三个辅助函数，路由按业务域拆到 `modules/` 下，`router.tsx` 只负责组合（约 75 行，路由相关文件合计约 520 行）。`permissionRoute` 额外在路由 `handle` 上记录 `permission`，便于测试和后续按路由读取权限。纯重构，路由行为不变。
- **测试**：新增 `router.vitest.ts`：布局内路由路径不重复；`PAGE_PERMISSION_ROUTES` 中每一项都存在同路径、同权限 key 的路由。已人为改错一个权限 key，确认该测试会失败。
- **验证**：重构前后各导出一次完整路由树快照（路径、errorElement、元素树、守卫的 permissionKey、懒加载页面组件），81 条路由逐行比对完全一致（临时脚本，已删除）。`bun run typecheck` 通过；`bunx eslint .` 0 问题；Vitest 178 个文件 / 800 项中 799 项通过，失败的是已知偶发超时用例 `ProductionOrderForm.vitest.tsx`，单独运行通过；`bun run build`、`check:bundle`（入口 gzip 26.0 KB）通过。未在浏览器中逐页点击验证。

## 2026-10-14

- **类别**：优化 / 服务层 / 配置
- **范围**：`src/services/supabase.ts`、`src/services/publicSupabase.ts`、`src/services/supabaseFetch.ts`（注释）、`src/config/queryClient.ts`；新增 `src/services/supabaseClients.vitest.ts`
- **摘要**：GET 查询遇到网络错误时原来有三层重试叠加：`createRetryingFetch` 3 次 × postgrest-js 2.112 内置重试 4 次（间隔 1s/2s/4s）× React Query 3 次，最坏 36 次请求、约 40 秒后用户才看到错误。① 两个 Supabase 客户端设置 `db: { retry: false }`，关闭 postgrest-js 内置重试，网络错误重试由 `createRetryingFetch` 负责。② React Query 对网络类错误（复用 `getErrorDisplayInfo` 的 `network` 分类）只再重试 1 次，同时兜底不经过 fetch 重试的 RPC/POST 查询；其他临时错误仍最多重试 2 次。最坏情况变为 6 次请求、约 4 秒。③ 修正上一条记录中 `isNonRetryableError` 的过度判断：`PGRST0xx`（连接失败、schema 缓存未加载等 503/504 临时错误）恢复为可重试，弥补关闭 postgrest-js 内置 503 重试后的空缺。
- **测试**：`queryClient.vitest.ts` 新增网络错误只重试 1 次、`PGRST002/003` 可重试的用例；新增 `supabaseClients.vitest.ts`，断言两个客户端都关闭了 `db.retry` 并注入了自定义 fetch。
- **验证**：`bun run typecheck` 通过；`bunx eslint .` 0 问题；Vitest 177 个文件 / 798 项全部通过。首次 `bun run test` 全量运行时 `ProductionOrderForm.vitest.tsx`、`remoteEmployeeSelect.vitest.tsx` 各 1 项超时失败，单独运行均通过，第二次全量运行全部通过，属于负载下的偶发超时，与本次改动无关。未在真实弱网环境下实测。

## 2026-10-14

- **类别**：优化 / 构建产物
- **范围**：新增 `src/utils/excelExport.worker.ts`、`src/utils/excelExportWorker.ts`；改写 `src/utils/productionOrderExcel.ts`、`src/utils/productionDailyReportExcel.ts`；删除 `productionOrderExcel.worker.ts`、`productionDailyReportExcel.worker.ts`
- **摘要**：原来生产工单导出和生产日报表导出各用一个 Worker，每个都完整打包了一份 `xlsx-js-style`（各约 852 KB）。现在合并为一个共享 Worker，按 `kind`（`productionOrder` / `productionDailyReport`）分派；启动 Worker 和下载文件的重复代码收进 `excelExportWorker.ts`。主线程兜底路径改为动态 `import()` 生成工作簿的模块，Worker 正常时主线程不再额外下载一份 xlsx（约 863 KB）。对外导出函数名、调用方式、文件名规则和 Worker 失败回退主线程的行为都不变。
- **验证**：`bun run typecheck` 通过；`bunx eslint .` 0 问题；`bun run build` 产物中两个 852 KB 的 Worker 变为一个 `excelExport.worker` 878 KB，`check:bundle` 通过（入口 gzip 26.2 KB）；`bun run test` 脚本测试 0 失败，Vitest 794/795 通过，失败的 `ProductionOrderForm.vitest.tsx` 是已记录的偶发超时用例，与本次改动无关，单独运行 4 项全部通过。未在浏览器中实际点导出验证下载文件。

## 2026-10-14

- **类别**：优化 / 配置 / 依赖 / 仓库卫生
- **范围**：`src/config/queryClient.ts`（+ 测试）、`src/features/workshop/OrderStatusDashboard/`（新增 `dashboardTableCells.tsx`）、`src/features/precision-finishing-cutting/index.tsx`、`src/features/tooling/ToolingData/index.tsx`、4 处扫码图标、`package.json`/`bun.lock`、`.gitignore`
- **摘要**：① React Query 默认配置：查询失败只有在没有缓存数据时才抛到路由错误边界，后台刷新失败不会再整页变成错误页；权限、参数、约束类确定性错误（HTTP 4xx，408/429 除外；`PGRST*`；SQLSTATE 22/23/42 类，如 `42501`）不再重试；`refetchOnReconnect` 改为 `true`，网络恢复后自动刷新过期数据。② ESLint 15 条警告清零：两个 `useCallback` 补上 `message` 依赖；`dashboardRenderUtils.tsx` 不再转发导出 `Text`/`Title`（调用方改为本地解构 `Typography`），可拖拽表头单元格和紧凑单元格两个组件拆到 `dashboardTableCells.tsx`。③ 仅 4 处使用的 `react-icons` `BiScan` 换成 heroicons `ViewfinderCircleIcon`，移除 `react-icons` 依赖。④ `*.tsbuildinfo` 加入 `.gitignore` 并取消跟踪。
- **测试**：`src/config/queryClient.vitest.ts` 新增 3 项（不重试的错误、错误边界抛出条件、408/429/网络错误仍可重试）。
- **验证**：`bun run typecheck` 通过；`bunx eslint .` 0 错误 0 警告；`bun run test` 脚本测试 0 失败，176 个 Vitest 文件 / 795 项全部通过；`bun run build`、`bun run check:bundle`（入口 gzip 26.2 KB）通过。未在浏览器中手动验证扫码图标显示和断网恢复刷新。

## 2026-10-14

- **类别**：文档 / 部署
- **范围**：`aliyun-fc/syney-store-report/README.md`、`aliyun-fc/supabase-proxy/README.md` 最小实例数建议
- **摘要**：用量明细显示 `syney-store-report` 10/1–10/14 每小时都有出账（含国庆凌晨），原因是控制台最小实例数 ≥ 1，实例常驻，闲置时内存仍计费。该函数只在手动拉取/打印入库单时调用，README 补充「最小实例数设为 0」及原因。`supabase-proxy` README 原写「预留实例建议 1 个」，改为写清 0（无请求不计费、有冷启动）与 1（无冷启动、7×24 计费）的取舍与费用估算。
- **验证**：仅文档改动，未运行测试；`bunx prettier --check`：`CHANGELOG.MD`、`supabase-proxy/README.md` 通过，`syney-store-report/README.md` 有格式告警，但改动前就已存在，未处理。控制台最小实例数由用户手动调整。

## 2026-10-14

- **类别**：修复 / 页面
- **范围**：`src/features/syney/ReportDetail/index.tsx` 入库单详情前端分页
- **摘要**：详情页把全部明细传给 `DetailTable`，未按当前页切片：pageSize=10、共 14 条时第 1 页显示全部 14 条，第 2 页仍是这 14 条但序号按页偏移成 11–24；"当前页小计"也合计了全部数据。pageSize=20 时只有一页，问题不显现。改为按 `page`/`pageSize` 切片后再传入表格（与 `PoDetail` 写法一致）；明细条数、选中金额、编辑行查找仍基于全部数据。
- **验证**：`bun run typecheck` 通过；`bunx eslint src/features/syney/ReportDetail` 0 问题。未在浏览器中实际翻页验证。

## 2026-10-13

- **类别**：修复 / 服务层 / 部署
- **范围**：新增 `aliyun-fc/supabase-proxy/`（FC Web 函数反代）、`scripts/package-supabase-proxy-fc.mjs`、`src/services/supabaseFetch.ts`；修改 `src/utils/env.ts`、`src/services/supabase.ts`、`src/services/publicSupabase.ts`、`package.json`、`.env.example`、`src/services/CLAUDE.md`
- **摘要**：中国移动网络访问 `*.supabase.co`（Cloudflare 前置、新加坡区域）偶发 `Failed to fetch`。① 新增阿里云 FC 香港区域透明反代：只放行 `/rest/v1/`、`/auth/v1/`、`/storage/v1/`、`/functions/v1/`，流式转发请求/响应并剥离 hop-by-hop 头，可选 `ALLOWED_ORIGINS` 白名单，上游失败返回 502，不新增鉴权（仍由 anon key + JWT + RLS 负责）；`bun run fc:package:supabase-proxy` 打包。② 前端新增可选 `VITE_REACT_APP_SUPABASE_PROXY_URL`，配置后两个 Supabase 客户端改走代理；登录态 `storageKey` 固定按 `VITE_REACT_APP_SUPABASE_URL` 的 project ref 生成（与 supabase-js 默认规则一致），切换或撤销代理不会掉登录。未配置时行为与原来一致（直连）。③ 两个客户端注入 `createRetryingFetch`：fetch 抛出网络错误时对 GET/HEAD 按 300ms/1000ms 重试 2 次；HTTP 错误响应、写操作与 RPC（POST）、已取消的请求不重试；token 刷新沿用 auth-js 自带的网络错误重试。
- **测试**：新增 `aliyun-fc/supabase-proxy/server.test.js`（7 项，含本地上游端到端转发、路径/Origin 拦截、上游失败 502，已纳入 `bun run test` 的 node 脚本测试）、`src/services/supabaseFetch.vitest.ts`（9 项）、`src/utils/env.vitest.ts`（4 项）。
- **验证**：`bun run typecheck` 通过；改动文件 `bunx eslint` 0 问题（`bun lint` 余 15 条警告均在无关的既有文件）；`bun run test` 38 项脚本测试 + 176 个 Vitest 文件 / 792 项全部通过（首次全量运行时 `ProductionOrderForm.vitest.tsx` 1 项失败，单独运行与第二次全量运行均通过，与本次改动无关）；`bun run build`、`bun run check:bundle`（入口 gzip 27.1 KB）通过；`bun run fc:package:supabase-proxy` 打包成功。本地启动代理对接真实项目：`/auth/v1/health` 200、REST 查询响应与直连一致、CORS 预检透传、非白名单路径 404。未部署到阿里云 FC，未在中国移动网络实测，未在浏览器中经代理登录验证。

## 2026-10-13

- **类别**：修复 / 页面
- **范围**：`src/features/production-order/MobileProductionOrderScanPage.tsx` 编辑模式机器编号带入
- **摘要**：编辑机器编号为「无」（`machine_equipment_id` 为 `null`）的工序明细时，原代码 `editingItem.machine_equipment_id ?? undefined` 把 `null` 转成「未选择」，页面显示「请选择机器编号」，直接保存会被拦截提示「请选择机器编号」，必须重新选一次「无」。改为原样带入 `null`（页面以 `null` 表示「无」、`undefined` 表示未选择，与新建选「无」及桌面端表单保存 `?? null` 的口径一致）。仅影响编辑已有明细的带入，新建与提交逻辑不变。
- **测试**：`MobileProductionOrderScanPage.vitest.tsx` 新增 1 项「编辑机器编号为「无」的明细时显示「无」，可直接保存」，修复前该用例失败、修复后通过。
- **验证**：`bun run typecheck` 通过；`bunx eslint src/features/production-order` 0 问题；该测试文件 4 项通过；`bun run test` 31 项脚本测试 + 174 个 Vitest 文件 / 779 项全部通过；`bun run build` 通过；`bun run check:bundle` 通过（入口 gzip 27.1 KB）。未在手机端浏览器实际编辑明细验证。

## 2026-10-13

- **类别**：重构 / 页面 / UI
- **范围**：`src/features/villa-lift/OrderList/index.tsx`（832 行）拆分；新增 `index.vitest.tsx`
- **摘要**：拆出 `VillaLiftOrderItemsModal.tsx`（原文件内 `ItemsModal` 明细编辑子弹窗，改名）、`useVillaLiftOrderBatchActions.ts`（批量删除、结案、反结案与标记完成日期，三个批量 mutation 移入）、`useVillaLiftOrderSearch.ts`（客户/项目/产品非受控输入框、三组日期范围、已提交筛选值与日期字符串、搜索/重置/切换页签）、`VillaLiftOrderToolbar.tsx`（新建、批量操作、搜索条件与导出按钮，权限开关以 `permissions` 对象传入）。`index.tsx` 保留权限、URL 状态、订单/明细弹窗状态、列表查询、新建/编辑/提交、导出提示（原内联 onClick 改为 `handleExportExcel`，函数体不变）、表格与分页，降至约 360 行。代码用脚本按原行号搬运，经忽略首尾空白后与 Prettier 格式化后的原文件逐行比对，差异仅为 import 拆分、props 改名（`selectedRowKeys.length` → `selectedCount` 等）、因缩进变浅合并的折行与原子弹窗分隔注释。批量操作 hook 的 `useCallback` 依赖补入作为参数传入的 `setSelectedRowKeys`（state setter 引用稳定，行为不变）。
- **测试**：新增 `index.vitest.tsx`（4 项），覆盖选中后显示批量按钮并批量结案、标记喷涂完成写入当天日期、搜索按输入值查询且切换已结案页签清空筛选、导出当前列表并提示条数；同一组测试临时指向拆分前的原组件也全部通过（临时文件已删除）。此前该页面没有测试。
- **验证**：`bun run typecheck` 通过；`bunx eslint src/features/villa-lift/OrderList` 0 问题；`bun run test` 31 项脚本测试 + 174 个 Vitest 文件 / 778 项全部通过；`bun run build` 通过；`bun run check:bundle` 通过（入口 gzip 27.1 KB）。未做浏览器端到端验证。

## 2026-10-13

- **类别**：重构 / 服务层
- **范围**：`src/services/apiProductionOrders.ts`（832 行）拆分为四个文件；新增 `apiProductionOrders.vitest.ts`
- **摘要**：拆出 `apiProductionOrderTypes.ts`（班别、工单行/新增/更新、带员工、列表项、导出、筛选、导出进度、按项目号生产明细类型）、`apiProductionOrderExportData.ts`（前端 Excel 导出取数：导出 select、按 ID 分批、按筛选分页取 ID、分块导出与进度回调、排序；与既有服务端导出任务文件 `apiProductionOrderExport.ts` 区分）、`apiProductionOrderProjectItems.ts`（`getProductionItemsByProjectNo` 按项目号分页查询明细并带出工单日期/班别/员工）。原文件保留列表（含正工时/合格工时/效率汇总）、详情、增删改、批量更新与当天工单查询，`export *` 重新导出类型，并显式重新导出 5 个导出函数/常量与 `getProductionItemsByProjectNo`，29 个引用方（含 Excel worker 的类型导入）与两处 `vi.mock('@/services/apiProductionOrders')` 均未改动。列表与导出取数中重复的筛选逻辑本次未合并，保持原样。函数体按行号原样搬运，经与 Prettier 格式化后的原文件逐行比对：原文件代码行全部保留，新增内容只有 import/export 行。
- **测试**：新增 `apiProductionOrders.vitest.ts`（3 项，链式 supabase mock），覆盖列表工时/效率汇总与标准工时为 0 的合格明细标记、分块导出去重排序与进度回调、按项目号明细的工单字段带出；此前该服务没有直接的单元测试。
- **验证**：`bun run typecheck` 通过；四个服务文件 `bunx eslint` 0 问题；`bun run test` 31 项脚本测试 + 173 个 Vitest 文件 / 774 项全部通过；`bun run build` 通过；`bun run check:bundle` 通过（入口 gzip 27.1 KB）。未做浏览器端到端验证（未实际导出工单 Excel）。

## 2026-10-13

- **类别**：重构 / 页面 / UI
- **范围**：`src/features/production-order/MobileProductionOrderScanPage.tsx`（842 行）拆分；新增 `MobileProductionOrderScanPage.vitest.tsx`
- **摘要**：拆出 `mobileProductionOrderScanTypes.ts`（弹层类型、项目号数据、路由 state 类型、`formatDisplayValue`）、`useMobileProductionOrderScanForm.ts`（项目号/工序/机器与 10 个数量、外协、调机、备注字段 state 及 `resetForm`）、`useMobileProductionOrderScanOptions.tsx`（项目号/机器查询、工序匹配查询与项目号/工序/机器选项、当前机器显示文本）、`MobileProductionOrderScanHeader.tsx`（标题、扫码按钮、录入日期与员工）、`MobileProductionOrderScanBasicInfo.tsx`（项目号/型号/工序/机器选择区）、`MobileProductionOrderScanQuantitySections.tsx`（数量明细、调机与外协、备注）。页面保留员工端权限判断、扫码/编辑带入、提交（含当天工单查找/创建与缓存失效）、底部按钮与三个选择弹层，降至约 450 行。代码用脚本按原行号搬运，经忽略首尾空白后与 Prettier 格式化后的原文件逐行比对，差异仅为 import 拆分、因缩进变浅合并的折行与两个 `useEffect` 依赖数组；两个 `useEffect` 依赖补入从表单 hook 取得的 state setter（引用稳定，不会多触发）。
- **测试**：新增 `MobileProductionOrderScanPage.vitest.tsx`（3 项），覆盖非员工端提示、编辑模式带出原明细并保存后调用更新与返回、新建时项目号/工序/机器/来料数量的依次校验；同一组测试临时指向拆分前的原组件也全部通过（临时文件已删除）。此前该页面没有测试。
- **发现但未修改**：编辑模式带入明细时 `setMachineEquipmentId(editingItem.machine_equipment_id ?? undefined)` 会把「机器编号为无（null）」的明细变成「未选择」，保存时提示「请选择机器编号」需重新选「无」；原代码即如此，本次重构保持不变，待确认是否需要修复。
- **验证**：`bun run typecheck` 通过；`bunx eslint src/features/production-order` 0 问题；`bun run test` 31 项脚本测试 + 172 个 Vitest 文件 / 771 项全部通过；`bun run build` 通过；`bun run check:bundle` 通过（入口 gzip 27.1 KB）。未做手机端浏览器端到端验证。

## 2026-10-13

- **类别**：重构 / 页面 / UI
- **范围**：`src/features/workshop/EmployeeList/index.tsx`（859 行）拆分；新增 `index.vitest.tsx`
- **摘要**：拆出 `useEmployeeAuthAccountActions.ts`（为现有员工开通账号、重置密码、解绑、重新绑定的弹窗状态、表单 ref、mutation 与回调，三个弹窗的取消逻辑收为 `handleCancel*`）、`useEmployeeBatchAuthAccounts.tsx`（批量开通账号确认与逐个创建、失败汇总弹窗）、`useEmployeeDelete.tsx`（删除前生产工单引用检查与确认删除）、`EmployeeToolbar.tsx`（工具栏与搜索）、`EmployeeAccountModals.tsx`（三个账号弹窗）。`index.tsx` 保留分页/搜索/选择状态、员工新建/编辑表单与提交（新建时同时开通账号复用 hook 返回的 `createEmployeeAuthMutation`）、表格与分页，降至约 255 行。代码用脚本按原行号搬运，经忽略首尾空白后与 Prettier 格式化后的原文件逐行比对，差异仅为 import 拆分、props 改名、弹窗取消回调改为 hook 函数及依赖数组。三个 hook 的 `useCallback` 依赖补入作为参数传入的 `setSelectedRowKeys`（state setter 引用稳定，行为不变）。
- **测试**：新增 `index.vitest.tsx`（4 项），覆盖未选择时解绑/批量开通的提示、未绑定员工可打开开通弹窗但不能重置密码、已绑定员工不能重复开通且解绑弹出确认；同一组测试临时指向拆分前的原组件也全部通过，确认行为一致（临时文件已删除）。此前该页面没有测试。
- **验证**：`bun run typecheck` 通过；`bunx eslint src/features/workshop/EmployeeList` 0 问题；目录 `bunx vitest run` 4 项通过；`bun run test` 31 项脚本测试 + 171 个 Vitest 文件 / 768 项全部通过；`bun run build` 通过；`bun run check:bundle` 通过（入口 gzip 27.1 KB）。未做浏览器端到端验证（未实际开通/解绑账号）。

## 2026-10-13

- **类别**：重构 / 页面 / UI
- **范围**：`src/features/workshop/OrderList/WorkshopOrderProductionStats.tsx`（865 行）拆分；新增 `WorkshopOrderProductionStats.vitest.tsx`
- **摘要**：拆出 `workshopOrderProductionStatsColumns.tsx`（工序颜色、`getOperationColor`、生产记录列定义 `recordColumns`、`OperationSummary` 类型）、`WorkshopOrderOperationRecordsTable.tsx`（单个工序的记录表与不良合计行，原内联在页签 `children` 中）、`WorkshopOrderInfoHeader.tsx`（原文件内 `OrderInfoHeader`：结案提醒、订单基础信息、出库进度、车间流转，改名为 `WorkshopOrderInfoHeader`）。主组件保留工序分组、未选中/加载中/无记录状态与页签，降至约 245 行；`index.tsx` 引用与 `index.vitest.tsx` 的 mock 未改动。代码用脚本按原行号搬运，经忽略首尾空白后与 Prettier 格式化后的原文件逐行比对，差异仅为组件改名、antd 导入拆分与记录表改为组件调用。
- **测试**：新增 `WorkshopOrderProductionStats.vitest.tsx`（3 项），覆盖未选中订单提示、按工序分组的合格汇总与合计行、出库已满时结案提醒并回调「已结案」；此前该组件在测试中一直被 mock，没有渲染覆盖。
- **验证**：`bun run typecheck` 通过；`bunx eslint src/features/workshop/OrderList` 0 问题；目录 `bunx vitest run` 6 文件 13 项通过；`bun run test` 31 项脚本测试 + 170 个 Vitest 文件 / 764 项全部通过；`bun run build` 通过；`bun run check:bundle` 通过（入口 gzip 27.1 KB）。未做浏览器端到端验证。

## 2026-10-13

- **类别**：重构 / 服务层
- **范围**：`src/services/apiPrecisionCuttingTransfers.ts`（883 行）拆分为三个文件；新增 `apiPrecisionCuttingTransfersCalculations.vitest.ts`
- **摘要**：拆出 `apiPrecisionCuttingTransfersTypes.ts`（车间/审核/接收人/操作人常量与精切转移行、新增、更新、筛选、统计、导出类型）与 `apiPrecisionCuttingTransfersCalculations.ts`（固定操作人名单校验、筛选条件拼装、转移数量/不良数/长料长度与数量校验、新增/更新数据规整、`roundTo`、`chunkArray`）。原文件保留 Supabase 取数与增删改（列表、详情、按项目号生产明细映射、导出含不良重量、数量统计、增删改、项目比重查询），`export *` 重新导出类型与常量，11 个引用方与 `permissions.vitest.tsx` 的模块 mock 均未改动。函数体按行号原样搬运，经与 Prettier 格式化后的原文件逐行比对：原文件代码行全部保留，新增内容只有 import/export 行。
- **测试**：新增 `apiPrecisionCuttingTransfersCalculations.vitest.ts`（5 项），覆盖新增数据规整与默认值、操作人名单/不良数/长料校验中文错误、更新数据只规整传入字段、筛选条件转查询调用、分块与保留小数；此前这些函数没有直接的单元测试。
- **验证**：`bun run typecheck` 通过；三个服务文件 `bunx eslint` 0 问题；精切转移与车间订单相关 `bunx vitest run` 8 文件 21 项通过；`bun run test` 31 项脚本测试 + 169 个 Vitest 文件 / 761 项全部通过；`bun run build` 通过；`bun run check:bundle` 通过（入口 gzip 27.1 KB）。未做浏览器端到端验证。

## 2026-10-13

- **类别**：重构 / 工具函数
- **范围**：`src/utils/excelUtils.ts`（888 行）拆分为四个文件；新增 `syneyExcelOrderInference.vitest.ts`
- **摘要**：拆出 `excelUtilsTypes.ts`（`ExcelData`、`ExcelRow`、`ValidationResult`、`TransformedOrderData`，`excelUtils.ts` 以 `export type *` 重新导出）、`excelZip64.ts`（ZIP64 常量与 `normalizeZip64ExcelBuffer` 本地文件头/中央目录大小回填）、`syneyExcelOrderInference.ts`（西尼采购单按生产编号推断规格、后备规格推断、后板商标提取、前/后/中板工艺要求提取）。`excelUtils.ts` 保留 xlsx 解析与有效区域计算、数据校验、Excel 日期转换、订单数据转换与导入流程。`@utils/excelUtils` 的类型导入与 `ExcelUpload.tsx` 的动态 import 均未改动；构建后三个新模块仍只打进 `excelUtils` 懒加载 chunk，入口包不含。函数体按行号原样搬运，经与 Prettier 格式化后的原文件逐行比对，差异仅为 `inferConsistentSpecFromRows` 加 `export` 后签名折行。
- **测试**：新增 `syneyExcelOrderInference.vitest.ts`（6 项），覆盖后板商标提取、工艺要求否定词排除与汇总、后备规格推断、按前沿板件号与中板规格推断、非 ZIP 数据原样返回、ZIP64 本地文件头大小回填；此前推断规则仅经 `transformToOrderData` 1 项间接覆盖，ZIP64 处理无测试。
- **验证**：`bun run typecheck` 通过；四个文件 `bunx eslint` 0 问题；Excel 与采购单相关 `bunx vitest run` 7 文件 64 项通过（含两处懒加载守卫）；`bun run test` 31 项脚本测试 + 168 个 Vitest 文件 / 756 项全部通过；`bun run build` 通过；`bun run check:bundle` 通过（入口 gzip 27.1 KB）。未做浏览器端到端验证（未实际上传采购单 Excel）。

## 2026-10-13

- **类别**：重构 / 服务层
- **范围**：`src/services/apiWorkshopOrders.ts`（906 行）拆分为四个文件；新增 `apiWorkshopOrdersCalculations.vitest.ts`
- **摘要**：拆出 `apiWorkshopOrdersCalculations.ts`（被引用项目号文案、重复项目号查找、文本/数字规整、简图存储路径、订单输入规整与有效内容校验、`buildSalesOrderPayload` 新建/更新数据、`buildWorkshopOrderStatusUpdateValues`）、`apiWorkshopOrderDeleteBlockers.ts`（`WorkshopOrderDeleteBlocker`、删除前生产/挤压明细引用检查 `getWorkshopOrderDeleteBlockers` 与 `assertWorkshopOrdersNotReferenced`）、`apiWorkshopOrderSketches.ts`（订单简图存储桶上传/删除/下载）。原文件保留订单列表（含出库汇总与可结案排序）、选项、详情、项目号查重与增删改，并重新导出 `findDuplicateProjectNos`、`buildWorkshopOrderStatusUpdateValues`、`getWorkshopOrderDeleteBlockers`、`WorkshopOrderDeleteBlocker`、`downloadWorkshopOrderSketchFile`，引用方与 `vi.mock('@/services/apiWorkshopOrders')` 的测试均未改动。`SalesOrderInsert/Update` 内部类型随 payload 构造移入计算文件，未对外导出。函数体按行号原样搬运；原文件此前未完全经过 Prettier，搬运后统一格式化，经与 Prettier 格式化后的原文件逐行比对，差异仅为两处函数签名因加 `export` 折行。
- **测试**：新增 `apiWorkshopOrdersCalculations.vitest.ts`（4 项），覆盖订单输入规整、无有效内容报错、新建/更新 payload 的 status 与 closed_at 写入规则、被引用项目号文案省略；既有 `apiWorkshopOrders.vitest.ts`、`apiWorkshopOrderOptions.vitest.ts` 不改动仍通过。
- **验证**：`bun run typecheck` 通过；四个服务文件 `bunx eslint` 0 问题；`bun run test` 31 项脚本测试 + 167 个 Vitest 文件 / 750 项全部通过；`bun run build` 通过；`bun run check:bundle` 通过（入口 gzip 27.1 KB）。中途按目录并行运行时 `ProductionOrderForm.vitest.tsx` 有 1 项因机器负载超时（单项 17 秒，导入阶段 44 秒），该目录本轮未改动，单独重跑 4 项通过，随后全量运行全部通过。未做浏览器端到端验证。

## 2026-10-13

- **类别**：重构 / 服务层
- **范围**：`src/services/apiMaterialTransfers.ts`（951 行）拆分为三个文件；新增 `apiMaterialTransfersCalculations.vitest.ts`
- **摘要**：拆出 `apiMaterialTransfersTypes.ts`（车间/审核/接收人常量、物料转移行/新增/更新/筛选/统计类型、`TransferWorkshopStat`、`ProjectTransferStats`、`MaterialTransferOrderProgress`）与 `apiMaterialTransfersCalculations.ts`（`applyMaterialTransferFilters` 筛选条件拼装、转移数量与操作人校验、新增/更新数据规整、`computeOrderProgress`、`buildOrderProgressMap`）。原文件保留 Supabase 取数与增删改（项目号/型号/长度选项、列表与订单外观补充、详情、导出、数量统计、增删改、按项目号统计与批量聚合），`export *` 重新导出类型与常量，并显式重新导出 `computeOrderProgress`、`buildOrderProgressMap`，15 个引用方与测试的导入路径均未改动。函数体按行号原样搬运，经逐行比对：原文件代码行全部保留，新增内容只有 import/export 行。
- **测试**：新增 `apiMaterialTransfersCalculations.vitest.ts`（5 项），覆盖新增数据去空格与操作人去重、数量/操作人校验中文错误、更新数据只规整传入字段、筛选条件转查询调用、订单进度合并；此前这些函数没有直接的单元测试。
- **验证**：`bun run typecheck` 通过；三个服务文件 `bunx eslint` 0 问题；物料转移相关 `bunx vitest run` 4 文件 14 项通过；`bun run test` 31 项脚本测试 + 166 个 Vitest 文件 / 746 项全部通过；`bun run build` 通过；`bun run check:bundle` 通过（入口 gzip 27.1 KB）。未做浏览器端到端验证。

## 2026-10-13

- **类别**：重构 / 页面 / UI
- **范围**：`src/features/workshop/OrderList/index.tsx`（970 行）拆分；新增 `WorkshopOrderControls.vitest.tsx`
- **摘要**：拆出 `types.ts`（`WorkshopOrder`、`WorkshopOrderProcessSchedule`、`WorkshopOrderProcessScheduleStatus`，`index.tsx` 以 `export type` 重新导出，外部 10 处 `@/features/workshop/OrderList` 与目录内 `./index` 的类型导入均未改动）、`useWorkshopOrderDelete.tsx`（删除前关联校验弹窗与确认删除，删除 mutation 移入）、`useWorkshopOrderStatusActions.ts`（单条结案/改回生产中与批量状态修改，批量状态 mutation 移入）、`WorkshopOrderStatusTabs.tsx`（生产中/已结案页签与数量徽标）、`WorkshopOrderToolbar.tsx`（新增/编辑/批量状态/删除/打印/导出按钮与已选数量）、`WorkshopOrderSearchPanel.tsx`（筛选条件面板）。`index.tsx` 保留 URL 与筛选状态、列表查询、打印/导出/新建/编辑/提交/表格筛选回调、上下分栏表格与生产统计、表单弹窗，降至约 550 行。函数体与 JSX 用脚本按原行号搬运，仅替换为 props；经逐行比对，原文件中仅 props 改名涉及的行不同。两个 hook 的 `useCallback` 依赖补入作为参数传入的 `setSelectedRowKeys`/`setActiveOrder`（state setter 引用稳定，行为不变）。
- **测试**：新增 `WorkshopOrderControls.vitest.tsx`（4 项），覆盖批量改为生产中/批量结案回调、无状态权限时隐藏批量按钮与导出回调、未选中时导出禁用、状态页签数量徽标与切换回调；既有 `index.vitest.tsx` 的布局与按钮权限 key 断言不改动仍通过。
- **验证**：`bun run typecheck` 通过；`bunx eslint src/features/workshop/OrderList` 0 问题；目录 `bunx vitest run` 通过；`bun run test` 31 项脚本测试 + 165 个 Vitest 文件 / 741 项全部通过；`bun run build` 通过；`bun run check:bundle` 通过（入口 gzip 27.1 KB）。未做浏览器端到端验证。

## 2026-10-13

- **类别**：重构 / 页面 / UI
- **范围**：`src/features/quality/ReworkRepair/index.tsx`（1004 行）拆分；新增 `ReworkRepairControls.vitest.tsx`
- **摘要**：拆出 `reworkRepairFormUtils.ts`（流程阶段类型与配置 `WORKFLOW_STAGES` 及按 key/状态索引、表单字段类型、默认表单值、URL 参数解析、订单带出文本、`toFormValues`/`buildPayload`）、`ReworkRepairStageFields.tsx`（车间/生产部/技术部/质量部四个 `memo` 字段分组组件）、`ReworkRepairToolbar.tsx`（新建/处理/删除按钮）、`ReworkRepairFormModal.tsx`（按处理阶段切换字段分组的表单弹窗，`form` 仍由父组件持有）。`index.tsx` 保留 URL 参数、列表与选择状态、新建/处理/删除/提交/页签切换/搜索回调、项目号带出与编号回填，降至约 400 行。工具函数、字段组件与页面逻辑用脚本按原行号搬运；工具栏与弹窗 JSX 经替换回原变量名后与原文件逐行比对一致。
- **测试**：新增 `ReworkRepairControls.vitest.tsx`（4 项），覆盖车间页签新建/处理回调、非车间页签隐藏新建并显示阶段文案、弹窗按阶段渲染字段分组、`buildPayload` 去空格与日期格式化；此前该页面没有渲染测试。
- **验证**：`bun run typecheck` 通过；`bunx eslint src/features/quality/ReworkRepair` 0 问题；目录及 `keyboardTableIntegration.vitest.ts` `bunx vitest run` 2 文件 33 项通过；`bun run test` 31 项脚本测试 + 164 个 Vitest 文件 / 737 项全部通过；`bun run build` 通过；`bun run check:bundle` 通过（入口 gzip 27.1 KB）。未做浏览器端到端验证。

## 2026-10-13

- **类别**：重构 / 服务层
- **范围**：`src/services/apiProductionScheduling.ts`（1073 行）拆分为三个文件；新增 `apiProductionSchedulingCalculations.vitest.ts`
- **摘要**：拆出 `apiProductionSchedulingTypes.ts`（`ProductionSchedulingFilters`、`ProductionSchedulingOrder`、`ProductionSchedulingOrderUpdate` 等公开类型、`PRODUCTION_SCHEDULING_PROCESS_OPTIONS` 工序常量，以及取数与计算共用的 `ProcessStandardCapacityRow`）与 `apiProductionSchedulingCalculations.ts`（文本/数量规整、工序解析、工序排程初始化与按工艺流程对齐、已排数量、标准产能匹配、排程行展开等纯函数）。原文件保留 Supabase 取数与保存（已加工数量、转移汇总、标准产能分页取数、筛选查询、订单列表、长度选项、保存排产），`export *` 重新导出类型，并显式重新导出原有 6 个公开工序函数，7 个引用方导入路径均未改动。仅在取数/保存中使用的内部类型与分页常量留在原文件，不对外暴露。函数体按行号原样搬运，经逐行比对：原文件代码行全部保留，新增内容只有 import/export 行。
- **测试**：新增 `apiProductionSchedulingCalculations.vitest.ts`（4 项），覆盖工序编号/名称解析（含"自动切"归为切割）、已排不足时补余排记录、订单已排数量取各工序最大值、百分比计算；此前该服务没有单元测试。
- **验证**：`bun run typecheck` 通过；三个服务文件 `bunx eslint` 0 问题；相关 `bunx vitest run` 3 文件 9 项通过；`bun run test` 31 项脚本测试 + 163 个 Vitest 文件 / 733 项全部通过；`bun run build` 通过；`bun run check:bundle` 通过（入口 gzip 27.1 KB）。未做浏览器端到端验证。

## 2026-10-13

- **类别**：重构 / 页面 / UI
- **范围**：`src/features/workshop/ProductionScheduling/index.tsx`（1122 行）拆分；新增 `ProductionSchedulingControls.vitest.tsx`
- **摘要**：拆出 `productionSchedulingUtils.tsx`（搜索/排产表单类型、默认筛选与分页常量、进度选项与快速筛选标签、渲染函数、进度计算、订单日期解析、表单初始值与保存 payload、汇总统计）、`productionSchedulingColumns.tsx`（`makeOrderColumns` 列定义）、`ProductionSchedulingHeader.tsx`（标题与进度快速筛选标签）、`ProductionSchedulingSearchBar.tsx`（搜索表单）、`ProductionSchedulingSummaryBar.tsx`（汇总统计、导出与刷新）、`ProductionSchedulingEditModal.tsx`（排产编辑弹窗，`schedulingForm` 仍由父组件持有）。`index.tsx` 保留筛选/分页/选择状态、查询与保存、导出（Excel 动态 import 与预加载仍在页面内，`lazyDocumentModules.vitest.ts` 无需改动）、紧凑行表格与分页，降至约 340 行。函数体与 JSX 原样搬运，仅替换为 props；快速筛选标签的点击逻辑原样收进 `handleProgressStatusChange`，原组件内每次渲染重建的 `PROGRESS_STATUS_TAGS` 改为模块常量。
- **测试**：新增 `ProductionSchedulingControls.vitest.tsx`（4 项），覆盖快速筛选标签回调、搜索栏提交值与重置、汇总条选中导出/刷新、编辑弹窗保存/取消；此前该页面没有渲染测试。
- **验证**：`bun run typecheck` 通过；`bunx eslint src/features/workshop/ProductionScheduling` 0 问题；Prettier 检查通过；目录及相关守卫测试 `bunx vitest run` 4 文件 60 项通过；`bun run test` 31 项脚本测试 + 162 个 Vitest 文件 / 729 项全部通过；`bun run build` 通过；`bun run check:bundle` 通过（入口 gzip 27.1 KB）。未做浏览器端到端验证。

## 2026-10-13

- **类别**：重构 / 页面 / UI
- **范围**：`src/features/production-order/index.tsx`（1295 行）拆分；`src/features/lazyDocumentModules.vitest.ts` 守卫路径更新；新增 `ProductionOrderManagementControls.vitest.tsx`
- **摘要**：拆出三个 hook：`useProductionOrderManagementAccess.ts`（管理锁定/解锁、改密码状态与回调、员工视图自动锁定效果）、`useProductionOrderExport.ts`（工单导出与夜宵明细导出、Excel 动态加载与预加载）、`useProductionOrderSubmit.ts`（工单创建/编辑提交，含工序同步 `syncOrderItemsSequentially`，原 5 个 mutation 移入该 hook）；拆出三个组件：`ProductionOrderManagementLock.tsx`（管理锁定界面）、`ProductionOrderManagementPasswordModal.tsx`（改密码弹窗，原页面内两处重复实现合并为一份）、`ProductionOrderAdminToolbar.tsx`（管理工具栏）；`productionOrderPageUtils.ts` 承载表单类型与 `isAuditedRecord`。页面保留筛选、表格、分页、批量审核、删除与详情弹窗，降至约 590 行。函数体与 JSX 原样搬运，仅替换为 props/hook 返回值；导出 `useCallback` 依赖补入 `setSelectedRowKeys`。`lazyDocumentModules.vitest.ts` 中两条工单 Excel 动态 import 的源文件改为 `useProductionOrderExport.ts`，预加载触发断言指向 `ProductionOrderAdminToolbar.tsx`（断言条数与语义不变）。
- **测试**：新增 `ProductionOrderManagementControls.vitest.tsx`（4 项），覆盖锁定界面修改密码按钮、提交管理密码回调 `onUnlock`、工具栏批量审核/反审核/锁定、工具栏修改密码按钮；此前这些回调连接没有渲染覆盖。
- **验证**：`bun run typecheck` 通过；`bunx eslint src/features/production-order src/features/lazyDocumentModules.vitest.ts` 0 错误 0 警告；目录内 `bunx vitest run` 11 项通过（既有 3 项 + 表单 4 项 + 管理控件 4 项）；`bun run test` 31 项脚本测试 + 161 个 Vitest 文件 / 725 项通过（期间有两次全量运行失败：一次为守卫路径未更新，已修复；另一次偶发失败未能定位到具体用例，此后三次完整运行均通过）；`bun run build` 通过；`bun run check:bundle` 通过（入口 gzip 27.1 KB）。未做浏览器端到端验证。

## 2026-10-13

- **类别**：重构 / 页面 / UI
- **范围**：`src/features/production-order/ProductionOrderForm.tsx`（1364 行）拆分；新增 `ProductionOrderForm.vitest.tsx`
- **摘要**：拆出 `productionOrderFormTypes.ts`（`ProductionOrderFormProps`、`OrderItem`、`ProjectNoData`、匹配等级标签/颜色、工序表单初始值）、`ProductionOrderFormBaseFields.tsx`（日期、操作人、班别、工时、备注等基础字段）、`ProductionOrderFormItemsMobileList.tsx`（紧凑模式工序卡片列表）、`ProductionOrderFormItemsTable.tsx`（桌面模式工序表格，列定义原样保留）、`ProductionOrderFormItemModal.tsx`（添加/编辑工序弹窗，`itemForm` 仍由父组件持有）。父组件保留订单表单状态、工序增删改回调与主 `Form`，降至约 500 行；删除工序统一经 `handleDeleteItem`，桌面表格与移动端的删除确认方式保持原有差异。新建组件命名统一加 `ProductionOrderForm` 前缀，避免与同目录既有的 `ProductionOrderItem*` 文件混淆。
- **测试**：新增 `ProductionOrderForm.vitest.tsx`（4 项），覆盖桌面模式基础字段与添加弹窗、编辑弹窗、删除工序后行移除、紧凑模式移动端添加；此前该表单在测试中一直被 mock，拆分后的回调连接没有真正的渲染覆盖。
- **验证**：`bun run typecheck` 通过；`bunx eslint src/features/production-order` 0 问题；`bunx vitest run` 目录内 4 项新增 + 3 项既有通过；`bun run test` 31 项脚本测试 + 160 个 Vitest 文件 / 721 项全部通过；`bun run build` 通过；`bun run check:bundle` 通过（入口 gzip 27.1 KB）。未做浏览器端到端验证。

## 2026-10-13

- **类别**：重构 / 页面 / UI
- **范围**：`src/features/workshop/OrderStatusDashboard/index.tsx`（1231 行）拆分；`src/features/lazyDocumentModules.vitest.ts` 守卫路径更新
- **摘要**：拆出 `dashboardColumns.tsx`（`createOrderStatusDashboardColumns` 纯函数，承接原 270 行列定义 useMemo，常量 `STATUS_COLOR` 与岗位列顺序一并迁入）、`OrderStatusDashboardHeader.tsx`（标题与「看板/导出/刷新」按钮区）、`OrderStatusDashboardSearchBar.tsx`（搜索表单区）、`useOrderStatusDashboardExport.ts`（导出当前筛选结果逻辑与 Excel 动态加载、悬停/聚焦预加载）；`index.tsx` 保留 URL 参数状态、表格、分页、弹窗与结案逻辑，降至约 550 行。JSX 与回调以原样搬运，仅替换为 props 名称；导出的 `total` 判断保持 `data?.total` 语义。`lazyDocumentModules.vitest.ts` 中该页动态 import 的源文件改为 hook 文件，并新增 `PRELOAD_TRIGGER_FILES` 映射，使悬停/聚焦预加载断言指向 Header 组件，断言条数与语义不变。
- **验证**：`bun run typecheck` 通过；改动目录 `bunx eslint` 0 错误（剩余 13 条 warning 均来自未改动的 `dashboardRenderUtils.tsx`）；目录相关 `bunx vitest run` 8 文件 26 项通过；`bun run test` 31 项脚本测试 + 159 个 Vitest 文件 / 717 项全部通过（首次全量运行时 `lazyDocumentModules.vitest.ts` 因源文件路径变更失败，已修正后通过）；`bun run build` 通过；`bun run check:bundle` 通过（入口 gzip 27.1 KB）。未做浏览器端到端验证（列表、弹窗、导出、结案未在页面上手动点击）。

## 2026-10-13

- **类别**：重构 / 服务层
- **范围**：`src/services/apiOrderStatusDashboard.ts`（1398 行）拆分为三个文件
- **摘要**：拆出 `apiOrderStatusDashboardTypes.ts`（类型、常量、REWORK 状态颜色/标签、EMPTY KPIs）与 `apiOrderStatusDashboardCalculations.ts`（工序匹配索引、生产/包装明细、返工汇总、岗位列等纯计算函数）；原文件仅保留请求函数（`getAllProcessStandardJobRows`、`getPackagingWorkOrderRowsByProjectNos`、`getOrderStatusDashboard`、`getOrderStatusDashboardForExport`），并 `export *` 重新导出类型与原有公开函数，6 个引用方与测试的导入路径均未改动。函数体按行号原样搬运，业务逻辑未改，仅经过 Prettier 格式化。
- **验证**：`bun run typecheck` 通过；目标文件 `bunx eslint` 无输出；`bunx vitest run` 覆盖订单现状看板相关 4 个测试文件 20 项通过；`bun run test` 31 项脚本测试 + 159 个 Vitest 文件 / 717 项全部通过；`bun run build` 通过；`bun run check:bundle` 通过（入口 gzip 27.1 KB）。未做浏览器端到端验证。

## 2026-10-12

- **类别**：页面 / UI
- **范围**：优迈货品资料加「复制新增」（参考刀具资料，全字段原样带出、全部可改）
- **摘要**：`youmai/ProductData/index.tsx` 仿照 `tooling/ToolingData/index.tsx`：新增 `isCopyCreate` 状态与 `handleCopyCreate`（非单选提示「请选择一条数据进行复制新增」）、工具栏编辑按钮后加 `DocumentDuplicateIcon`「复制新增」按钮（`YOUMAI_MANAGE_PERMISSION_KEY` + 查看员守卫）、Modal 标题「复制新增优迈货品资料」、表单 `initialValues` 改为 `(isEdit || isCopyCreate) && editingRecord`、提交沿用创建分支与既有物料编码唯一中文校验（`material_code` 保留原值由用户改）。表单组件未动。新增 `ProductData/index.vitest.tsx`（单选校验 + 标题/initialValues + 只调 create 不调 update）。
- **验证**：`bun run typecheck` 通过；目标文件 `bunx vitest run` 2 项通过；目标 2 文件 `bunx eslint` 无输出；改动文件 Prettier 格式化；`bun run test` 31 项脚本测试 + 159 个 Vitest 文件 / 717 项全部通过（较上轮 +1 文件 / +2 项）；未跑 `bun run build`；未做浏览器登录后端到端操作验证。

## 2026-10-09

- **类别**：页面 / UI
- **范围**：金檀木业素材资料、型材资料、配件资料加「查看」行详情抽屉与快捷新建入库/出库（参考刀具资料抽屉）
- **摘要**：三张资料表（`JintanParts/Profiles/MaterialsDataTable.tsx`）加右侧「库存/出入库」查看列（有任一库存/出入库权限才渲染，`scroll.x` 补 120）；三页 `index.tsx` 加 `detailRecord` 与 `canOpenDetail` 并挂载抽屉。新建 `Jintan*DataDetailDrawer.tsx`（资料头 + 当前库存摘要/错误重试 + 快捷新建入库/出库 + 入库/出库记录 Tabs，成功留在抽屉内刷新，无审核、建单直接更新库存）与 `Jintan*StockRecordsTabs.tsx`（数量/备注/创建时间，10 条分页）及 `useJintan*DataDetail.ts`（库存详情 + 出入库记录，键挂在库存/出入库根下以沿用 mutation 失效链）。服务层：3 个 `getJintan*InventoryByDataId`（`maybeSingle`，缺行返回 null，抽屉内提示暂不能建单）与 6 个出入库列表函数加可选 `inventoryId` + `signal` 筛选；`queryKeys.ts` 加 3 个 `detail` 与 6 个 `byInventory` 键。6 个出入库表单加 `quickInventory` 快捷锁定模式（隐藏选择器、出库保留 `≤当前库存` 上限校验），原独立页面表单行为不变。测试：3 个 `index.vitest` 各 +1 查看打开用例，新增 3 个抽屉 `vitest`（头/库存/Tab + 快捷建单走 create）。
- **验证**：`bun run typecheck` 通过；目标 6 文件 `bunx vitest run` 18 项通过；改动目录 `bunx eslint` 0 错误 0 警告；改动文件 Prettier 格式化；`bun run test` 31 项脚本测试 + 158 个 Vitest 文件 / 715 项全部通过（较上轮 +3 文件 / +12 项）；`bun run build` 通过；`git diff --check` 无问题。未做浏览器登录后端到端操作验证，前端尚未发布。

## 2026-10-09

- **类别**：页面 / UI
- **范围**：金檀木业素材资料、型材资料、配件资料加「复制新增」（参考刀具资料，全字段原样带出、全部可改）
- **摘要**：三页 `PartsData/ProfilesData/MaterialsData/index.tsx` 同构仿照 `ToolingData/index.tsx`：新增 `isCopyCreate` 状态与 `handleCopyCreate`（非单选提示「请选择一条数据进行复制新增」）、工具栏编辑按钮后加 `DocumentDuplicateIcon`「复制新增」按钮（同页权限键 + 查看员守卫）、Modal 标题「复制新增金檀木业××资料」、表单 `initialValues` 改为 `(isEdit || isCopyCreate) && editingRecord`、提交沿用创建分支与既有唯一键中文校验（配件名称+规格、型材/素材型号+名称+规格）。表单组件未加禁用，按确认口径全部可改。新增三页 `index.vitest.tsx`（单选校验 + 标题/initialValues + 只调 create 不调 update）。
- **验证**：`bun run typecheck` 通过；目标 4 文件 `bunx vitest run` 8 项通过；`bunx eslint` 目标 6 文件 0 问题；改动文件 Prettier 格式化；`bun run test` 31 项脚本测试 + 155 个 Vitest 文件 / 703 项全部通过（较上轮 +3 文件 / +6 项）；`bun run build` 通过。未做浏览器登录后端到端操作验证，前端尚未发布。

## 2026-10-08

- **类别**：新建 / 页面 / 数据库
- **范围**：金檀木业配件出库免登录扫码登记（仿刀具出库 H5），仅配件出库、复用现有三字段
- **摘要**：新增固定二维码公开页 `/h5/jintan-parts-stock-out`，扫码后无需登录即可选择配件、填写出库数量和备注并提交，提交后由数据库触发器自动扣减库存、超库存报错。数据库新增迁移 `20261008030000_allow_public_jintan_parts_stock_out.sql`：给 anon 开库存表 SELECT 与出库表 INSERT（`grant select/insert`），新增两条 RLS 策略（库存公开读全行、出库公开插入校验 `inventory_id 非空、quantity > 0、备注 ≤500 字`）；不改表结构，库存扣减复用已有 `security definer` 触发器。前端仿刀具出库全套：`jintanPartsStockOutPublicQr.ts`（路径与取值）、`JintanPartsStockOutPublicPage.tsx`（移动端卡片 + 底部 sticky 确认登记 + 成功继续登记，数量做当前库存上限校验）、`usePrintJintanPartsStockOutPublicQrPoster.tsx`（A4 海报打印）；PC 出库页工具栏加「打印二维码」按钮（同权限键管控）；`lazyPages.ts` + `router.tsx` 注册免登录公开路由。服务层 `apiJintanPartsInventory.ts` / `apiJintanPartsStockOut.ts` 拆出 `*WithClient` 并新增 `getPublicJintanPartsInventoryOptions` / `createPublicJintanPartsStockOut`（走 `publicSupabase`）；`queryKeys.ts` 加 `partsInventory.publicOptions`；hooks 加 `usePublicJintanPartsInventoryOptions` / `useCreatePublicJintanPartsStockOut`。PC 端原有表单与权限逻辑未动。
- **验证**：`bun run typecheck` 通过；`bun run test` 31 项脚本测试 + 152 个 Vitest 文件 / 697 项全部通过（新增 QR 常量 2 项 + 公开 mutation 缓存 1 项）；目标文件 `bunx eslint` 0 问题；改动文件 Prettier 格式化；`bun run build` 通过（新 chunk `JintanPartsStockOutPublicPage` 7.42 kB）；`bun run check:bundle` 通过（入口 gzip 26.9 KB）；`bun run db:push:dry-run` 仅列出本迁移。正式 `bun run db:push` 待用户在交互终端执行（推送脚本含 SQL 指纹三次确认门槛，非交互调用会被拦截），推送后需真机扫码走一遍正常提交与超库存报错。无 `database.types.ts` 变更（无表结构改动）。
- **推送结果（2026-10-08 补记）**：用户在交互终端推送成功。只读复查（`bun run db:query`）：两条新策略均存在（库存表 SELECT / 出库表 INSERT，角色均为 `{anon,authenticated}`），出库表 anon INSERT 授权已生效；`bun run db:push:dry-run` 显示 `Remote database is up to date`；推送后跑 `bun run db:types`，`database.types.ts` 无变化（本次仅策略与授权变更、无表结构改动，符合预期）。剩余待真机扫码走一遍正常提交与超库存报错。

## 2026-10-08

- **类别**：数据 / 数据库
- **范围**：金檀木业配件出库流水补录（来源：《金檀木业配件资料_37条_2026-10-06_10-56-32 - 副本.xlsx》出库列），库存不动
- **摘要**：按用户确认口径（仅 20 行有出库数的行记流水，28 行空白=无出库不建记录；库存最终不动）新增数据迁移 `20261008020000_seed_jintan_parts_stock_out_20261006_excel.sql`。库内出库原为 0 条。20 行出库数由公式求值：转轴固定座 1、固定轴套 29、4mm 扳手 2、5mm 扳手 1、圆头 M8*25 18、沉头 M6*16 46 / M6*25 28 / M8*25 4、十字圆头 168、垫片 22/6、手摇机 1、连接杆套件 1、膨胀螺栓 32、衬套 20/3、防松 M6 3 / M8 34、圆头 M6*25 5、防松 M10 1，合计 425（出库表 `quantity > 0` 约束，空白行只能跳过）。机制：出库 BEFORE INSERT 触发器必然扣减库存，本迁移同事务内等额补回，触发器全程保持启用；迁移前对全库库存做快照，终态逐行比对保证零变化。单个 DO 块实现幂等：20 行已存在则 NOTICE 跳过、部分存在则报错；前置断言（行数/全匹配/足额）与终态断言（出库 20 行合计 425、库存快照一致），失败整体回滚。备注与表格一致留空，快照由触发器从库存行填写。无 schema 变更，无需 `db:types`。
- **验证**：生成器自检通过（20 行、键唯一且全在 48 行库存内、逐行足额、合计 425）；迁移文件已逐行读审；`bun run db:push:dry-run` 仅列出本迁移且远端连接正常。正式 `bun run db:push` 与推送后数据复查待用户在交互终端执行（推送脚本含 SQL 指纹三次确认门槛，非交互调用会被拦截）。
- **推送结果（2026-10-08 补记）**：用户在交互终端推送成功。只读复查（`bun run db:query`）：出库 20 行合计 425，库存 48 行合计 17197 与推送前一致、零变化；`bun run db:push:dry-run` 显示 `Remote database is up to date`（首次 dry-run 撞上临时登录密码失效，重试通过，属工具层瞬态问题）。无 schema 变更，未跑 `db:types`。

## 2026-10-08

- **类别**：数据 / 数据库
- **范围**：金檀木业型材库存数据更新（来源：《金檀木业型材库存_49条_2026-10-08_10-01-36.xlsx》，实际 57 行）
- **摘要**：按用户确认口径（57 行全量覆盖数量/备注；4 格公式按求值入库；8 个新品自动补型材资料）新增数据迁移 `20261008010000_seed_jintan_profiles_inventory_20261008_excel.sql`。文件名“49条”为旧数，表格实际 57 个不同自然键（编号 1–49 有复用：#28×3、#32×2、#33×3、#48×3、#49×2，但型号+名称+规格无重复）。迁移用临时表暂存表格：A. 从暂存表 `INSERT … ON CONFLICT (profile_model, profile_name, specification) DO NOTHING` 补 8 个新品资料（水槽 2227/2229、YDG222-179/手摇机固定座/80、百叶片左/右、盖板 1/2/3 孔；INSERT 触发器自动建 0 库存行）；B. 兜底补 0 库存行；C. 前置断言 57 行全部匹配到库存行；D. 全量更新数量/备注（快照字段以型材资料为准不覆盖）；E. 事后复核一致，否则整体回滚。公式求值：百叶片左 333、百叶片右 392、盖板 1 孔 801、盖板 2 孔 521；数字型规格按文本入库（'2227'/'2229'/'80'/'0'）；备注全空。表格总量 3426（库内原 49 行合计 94；入库 0 条、出库 51 条为凉亭历史，不动）。迁移由表格提取脚本逐行生成（非手工转录），生成器已与库内 49 行键集合交叉核对（全命中、新品恰为预期 8 个）。无 schema 变更，无需 `db:types`。
- **验证**：生成器自检通过（57 行、自然键唯一、库内 49 键全命中、新品 8 个吻合、公式 333/392/521/801、总量 3426）；迁移文件已逐行读审；`bun run db:push:dry-run` 仅列出本迁移且远端连接正常。正式 `bun run db:push` 与推送后数据复查待用户在交互终端执行（推送脚本含 SQL 指纹三次确认门槛，非交互调用会被拦截）。
- **推送结果（2026-10-08 补记）**：用户在交互终端推送成功。只读复查（`bun run db:query`）：57 行逐行核对不符数为 0，对应库存总量 3426 与表格一致（其中一次总量查询撞上 CLI 登录角色并发竞态 `tuple concurrently updated`，串行重跑后通过，属工具层瞬态问题）；`bun run db:push:dry-run` 显示 `Remote database is up to date`。无 schema 变更，未跑 `db:types`。

## 2026-10-08

- **类别**：数据 / 数据库
- **范围**：金檀木业配件库存数据补录（来源：《金檀木业配件资料_37条_2026-10-06_10-56-32.xlsx》，实际 48 行）
- **摘要**：按用户确认口径（空库存数量按 0 入库；缺失新品自动补配件资料；全量覆盖数量/备注）新增数据迁移 `20261008000000_seed_jintan_parts_inventory_20261006_excel.sql`。迁移用临时表暂存表格 48 行：A. 从暂存表 `INSERT … ON CONFLICT (part_name, specification) DO NOTHING` 补 11 个新品资料（内六角圆头 M6*20/M6*25/M8*35/M5*18、十字平头 M6*16、防松螺母 M10、衬套 φ8*10*22、轴套 φ8*10*8、无规格轴套、水槽折弯件、水槽焊接铝片；INSERT 触发器自动建 0 库存行）；B. 兜底补 0 库存行；C. 前置断言 48 行全部匹配到库存行；D. 按表格全量更新数量/备注（快照字段以配件资料为准不覆盖）；E. 事后复核数量/备注一致，否则整体回滚。5 行空数量按 0 计（手摇杆 1.5m、毛巾、纸箱、线手套、转轴销 φ14*31），表格库存总量 17197。迁移由表格提取脚本逐行生成（非手工转录），Excel 规格中的 `φ`（U+03C6）已与既有 seed 逐字节核对一致。无 schema 变更，无需 `db:types`。
- **验证**：生成器自检通过（48 行、名称+规格唯一、与 seed 差集恰为 11 新品、总量 17197）；迁移文件已逐行读审；`bun run db:push:dry-run` 仅列出本迁移且远端连接正常。正式 `bun run db:push` 与推送后数据复查待用户在交互终端执行（推送脚本含 SQL 指纹三次确认门槛，非交互调用会被拦截）。
- **推送结果（2026-10-08 补记）**：用户在交互终端推送成功。只读复查（`bun run db:query`）：48 行逐行核对不符数为 0，48 行对应库存总量 17197 与表格一致；`bun run db:push:dry-run` 显示 `Remote database is up to date`。无 schema 变更，未跑 `db:types`。

## 2026-10-06

- **类别**：UI / 导航菜单
- **范围**：金檀木业导航菜单按「配件 / 型材 / 素材」分为三个子分组
- **摘要**：按用户确认口径（子项保留完整名称；分组不设独立权限、按子项权限自动显隐；页签/标题保持「金檀木业 / ××」现状）将金檀木业原 12 个平铺页面项重构为三级菜单：`jintan-parts`「配件」/ `jintan-profiles`「型材」/ `jintan-materials`「素材」各 4 项，叶子 key/label/permission、路由、权限注册与 `routeLabels.ts` 全部未改。把菜单定义与过滤/查找纯函数（`MenuItemDef`、`allMenuItems`、`filterMenuByPermissions`、`findAncestorMenuKeys`）从 `MainMenu.tsx` 抽出到新文件 `src/ui/mainMenuItems.tsx`，`MainMenu.tsx` 仅保留组件（消除 react-refresh/only-export-components 告警并便于单测）。原只查一层的 `findParentMenuKey` 改为递归 `findAncestorMenuKeys` 返回祖先 key 链（如 `jintan-parts-data` → `['jintan','jintan-parts']`），组件初始 `openKeys` 与路径变化 effect 同步展开整条链，保证直接刷新/打开子页面时「金檀木业 + 对应分组」自动展开。新增 `src/ui/MainMenu.vitest.tsx`（7 项：分组顺序与 12 项、仅素材权限只显示素材组、无权限/缺 nav:jintan 整组隐藏、三级祖先链、未知 key 空数组）。
- **验证**：菜单 12 个叶子 key 与 `pagePermissionRoutes.ts` 路径/权限逐项核对一致（路由入口检查）。`bun run typecheck` 通过；`bun run test` 31 项脚本测试 + 151 个 Vitest 文件 / 694 项全部通过（较上轮 +1 文件 / +7 项 = 本次菜单单测）；`bun lint` 0 错误 / 15 个既有警告（均在未改文件，本次改动文件 0 告警）；`bun run build` 通过；`bun run check:bundle` 通过（入口 gzip 26.8 KB）；`git diff --check` 无问题。未做浏览器登录后端到端点击验证（前端未发布），多级展开链与权限边界已由单测覆盖。

## 2026-10-06

- **类别**：新建 / 页面 / 数据库
- **范围**：金檀木业「素材资料 / 素材库存 / 素材入库 / 素材出库」四模块与素材数据表
- **摘要**：按用户确认口径（仿照型材模块全套 4 页；字段=型号/名称/规格/材质/备注，唯一键=型号+名称+规格；空模块无初始数据，库存行由触发器在素材资料新增时自动建 0 行，后续用 Excel 导入）新增素材模块。数据库新增 5 个迁移：`jintan_materials_data` / `jintan_materials_inventory` / `jintan_materials_stock_in` / `jintan_materials_stock_out` 四表（资料→库存同步触发器、出入库同事务联动触发器、10 条 RLS 策略含出入库页对库存表只读、14 条约束、3 个函数、索引与 updated_at/查看员防 DML 触发器）与 4 条页面权限种子（`page:jintan-materials-*`，admin 由既有触发器自动授权）。前端仿照型材模块新增 4 个页面（资料 CRUD/多选删除/模板导入导出，库存编辑/模板导入导出，入库、出库新增/改备注/删除）：新建 `src/features/jintan/MaterialsData|MaterialsInventory|MaterialsStockIn|MaterialsStockOut` 共 27 个文件、4 个服务 `apiJintanMaterials*.ts`、2 个 Excel 工具 `jintanMaterials*Excel.ts`（模板/解析/导出，文件名与标题为「金檀木业素材××」）及配套测试；同步更新 `jintan/permissions.ts`（+4 权限键与定义）、`jintan/queryKeys.ts`（+4 键组含 options）、`lazyPages.ts`、`router.tsx`、`routeLabels.ts`、`pagePermissionRoutes.ts`、`MainMenu.tsx`（型材出库后追加 4 项）、`lazyDocumentModules.vitest.ts`（+4 条懒加载登记）。英文标识统一为 materials（表 `jintan_materials_*`、路由 `/jintan-materials-*`）。既有历史文件保持最小 diff，未做无关格式重排。
- **验证**：`bun run db:push:dry-run` 仅列出 5 个迁移；用户本人在交互终端确认后推送成功；`bun run db:types` 自动生成新表类型（+174 行，仅新增）；只读复查（information_schema / pg_policies / pg_constraint / pg_proc / permissions / role_permissions）：四表结构与列、10 条策略、24 项触发器、14 条约束、3 个函数、4 条权限及 admin 自动授权全部与设计一致，四表 0 行；复查 dry-run 为 `Remote database is up to date`。`bun run test` 31 项脚本测试 + 150 个 Vitest 文件 / 687 项全部通过（较上轮 +9 文件 / +44 项：素材 Excel 13、服务 12、表单 10、缓存 5、懒加载登记 4）；`bun run typecheck`、`bun run build`、`bun run check:bundle`（入口 gzip 26.8 KB）通过；`bun lint` 0 错误 / 15 个既有警告（未改文件）；`bunx antd lint` 素材资料、库存各 1 条与既有模块同源的 Upload 受控告警，入库/出库 0 问题；新建文件已 Prettier 格式化；`git diff --check` 无问题。未做浏览器登录后端到端操作验证，前端尚未发布。

## 2026-10-05

- **类别**：页面 / UI
- **范围**：刀具菜单组前端表格补「创建时间」数据列（刀具资料 / 刀具库存 / 刀具入库 / 刀具出库 / 刀具资料详情抽屉「出库记录」Tab）
- **摘要**：按用户确认口径（范围=仅刀具菜单组，不含工装管理；格式=跟随各表现有「更新时间」）在「更新时间」之前插入 `created_at` 列：`ToolingDataTable.tsx`、`ToolingStockInTable.tsx` 沿用本表「全列排序+筛选」约定（sorter + filters + filterSearch + onFilter + `toLocaleString('zh-CN')`，宽 180）；`ToolingInventoryTable.tsx`、`ToolingStockOutTable.tsx` 与本表「更新时间」同款纯渲染（宽 180/170）；`ToolingStockRecordsTabs.tsx` 详情抽屉「出库记录」Tab 补 170 宽创建时间列（「入库记录」Tab 原本已有）。各表 `scroll.x` 随新增列宽同步 +180/+170（资料 1480→1660、含操作列 1600→1780；库存 1680→1860；入库 1570→1750；出库 2260→2430；抽屉出库 Tab 1040→1210）。同步更新 `ToolingDataTable.vitest.tsx`（2 处）与 `ToolingStockInTable.vitest.tsx` 的列清单断言。无服务层/类型/数据库改动（`created_at` 已在各类型与 `select('*')` 返回中）。
- **验证**：`bunx antd info Table --format json` 核对列 props；`bun run typecheck` 通过；`bunx antd lint src/features/tooling --format json` 仅 3 条既有 Upload 受控告警（均在未改文件）；`bun run test` 31 项脚本测试 + 141 个 Vitest 文件 / 643 项全部通过（目标用例 4 文件 / 8 项先单独复跑通过，较上轮总数不变，仅改列断言）；`bun lint` 0 错误 / 15 个既有警告（未改文件）；`bun run build` 通过；`bun run check:bundle` 通过（入口 gzip 26.5 KB）；改动文件经 Prettier 格式化（`ToolingStockInTable.tsx` / `ToolingStockOutTable.tsx` 顺带归一 2 处既有超长行），`git diff --check` 无问题。未做浏览器登录后的端到端页面回归，前端改动仍在工作区、尚未发布。

## 2026-10-05

- **类别**：数据 / 数据库
- **范围**：金檀木业型材「凉亭」初始库存与出库数据填充（来源：桌面《凉亭.xlsx》Sheet1）
- **摘要**：新增数据迁移 `20261005135441_seed_jintan_profiles_liangting_inventory_stock_out.sql`，覆盖表格内 37 个型材（35 条 + 已补建的 YDJ222-159-3、YDT-026）。按用户确认口径：目标结余 = 表格入库（合计 83）；已录入的出库按同一表格计入，本次补录差额 = 表格出库 − 已录出库；库存设为「表格入库 + 补录出库」，出库由数据库触发器同事务扣减。迁移用临时表动态统计已录出库并做三重断言（库存行全部匹配、已录出库不得超过表格出库、结余与累计出库校验），失败整体回滚、重复执行不会重复扣减。预检发现用户已手工录入 14 条出库（其中 11 条恰为表格出库的一半，3 条为表格外的 155-1/173/175-1），按「保留已有、差额补录」处理，表格外型材与其库存保持不动；`水槽配件 YDJ222-159-2` 库存按公式重置。共补录出库 37 条 / 493，出库累计 51 条 / 556，37 个型材结余合计 83，全系统库存合计 94；未录入任何入库数据。
- **验证**：`bun run db:push:dry-run` 仅列出该迁移；用户本人在交互终端三次确认后推送成功。只读复查：37/37 个型材结余等于表格入库、匹配数与期望数一致、无缺失；出库流水 51 条 / 556（旧记录 14 条/63 + 本次 37 条/493）；入库 0 条；表格外 155-1/173/175-1 库存保持 3/4/4；库存行 49 条、合计 94。`git diff --check` 无问题。未做浏览器页面端操作验证（数据层面已完整核对）。

## 2026-10-05

- **类别**：新建 / 页面 / 数据库
- **范围**：金檀木业「型材资料 / 型材库存 / 型材入库 / 型材出库」四模块与型材数据表
- **摘要**：依据用户提供的《金檀木业样品清单.xlsx》4 张 BOM 表（140U2米 / 140U3米 / 220U150立柱3米 / 220U120立柱3米），按「材质为 6063铝合金且名称非空、型号+名称+规格去重」提取 47 条型材数据（含 6 条无型号件；5 张库存样式表与 2 条无名称记录未导入）；新增 `jintan_profiles_data` / `jintan_profiles_inventory` / `jintan_profiles_stock_in` / `jintan_profiles_stock_out` 四表、资料→库存同步触发器、出入库同事务联动触发器、RLS 策略（含出入库页对库存表的只读策略）及 4 个页面权限种子；前端仿照配件模块新增 4 个页面（资料 CRUD/多选删除/模板导入导出，库存编辑/模板导入导出，入库、出库新增/改备注/删除），服务层、Query 键、路由、菜单、路由标签、懒加载文档登记与测试同步补齐；型材每套用量不落库，保留在 Excel 原表。
- **经用户确认的取舍**：范围=仅 6063铝合金 行；字段=型号/名称/规格/材质/备注（不含采购厂家）；库存初始=全部 0；Excel=提供模板/导入/导出，与配件模块完全对齐。
- **验证**：`bun run db:push:dry-run` 列出 7 个迁移；用户本人在交互终端三次确认后执行推送成功；`bun run db:types` 自动生成新表类型（+174 行，仅新增），`bun run typecheck`、`bun run build`、`bun run check:bundle`（入口 gzip 26.5 KB）通过。数据库只读复查：型材资料 47 / 库存 47 / 出入库流水 0；10 条 RLS 策略、全套触发器与 14 条约束、9 条金檀权限（含 4 条型材）均与设计一致。`bun run test` 31 项脚本测试 + 141 个 Vitest 文件 / 643 项测试全部通过（较上轮 +9 文件 / +44 项：型材 Excel 13、服务 12、表单 10、缓存 5、懒加载登记 4）；`bun lint` 0 错误 / 15 个既有警告；`bunx antd lint` 型材资料、库存各 1 条与 8 个既有模块同源的 Upload 受控告警，入库/出库 0 问题；新建文件已 Prettier 格式化；`git diff --check` 无问题。未做浏览器登录后端到端操作验证，前端尚未发布。

## 2026-10-05

- **类别**：新建 / 页面 / 数据库
- **范围**：金檀木业「配件出库」与出入库共享库存选项
- **摘要**：新增出库流水页、服务层、Query 键与数据库迁移；出库通过带库存条件的原子更新扣减，库存不足时流水和库存一起回滚，删除流水回补库存；只允许编辑备注，有出库历史的配件不可删除。入库和出库共用库存选项查询及缓存，库存调整和出入库操作均刷新两页选件库存。新增服务、表单、缓存及事务/并发验证脚本。
- **验证**：`bun run test` 通过 31 项脚本测试 + 132 个 Vitest 文件 / 599 项测试；新增出库服务、表单及共享缓存共 15 项。`bun lint` 0 错误 / 15 个既有警告，出库目录 Ant Design 检查 0 问题。用户终端执行迁移后复查为最新；`bun run db:types` 自动生成新表类型，类型检查、构建通过。真实数据库并发测试（专用测试配件库存 10、两个同时出库 7 的请求）一成一败，复查库存 3、流水 1 条；新表启用 RLS，2 条策略及 3 个触发器生效。事务规则/权限验证与专用测试配件清理脚本由用户确认已执行，随后数据库只读复查确认测试配件、库存、出库流水残留均为 0（未直接获取用户终端断言输出）。`git diff --check` 无问题。未做浏览器登录端到端验证，前端尚未发布。

## 2026-10-05

- **类别**：新建 / 页面 / 数据库
- **范围**：金檀木业「配件入库」流水与库存联动
- **摘要**：新增 `jintan_parts_stock_in` 入库表与数据库触发器，新增时原子增加库存、删除时在库存充足时原子回退，创建后只允许改备注；关联库存外键阻止删除有入库历史的配件资料。入库记录保存配件资料快照，新增库存只读权限供入库页选件；页面提供搜索分页、配件资料四列、入库数量/备注/时间及新增、改备注、删除操作。新增服务层、Query 缓存失效联动、自动生成数据库类型，以及事务回滚验证 SQL。
- **验证**：迁移预演及两次迁移执行成功，远端复查为最新；`bun run db:types` 自动生成新表类型。数据库只读检查确认新表 RLS、2 条策略、3 个触发器、库存只读策略、默认值及 RESTRICT 外键；事务回滚脚本由用户确认已执行，随后复查测试残留为 0（未直接获取用户终端的断言输出）。`bun run test` 最终通过 31 项脚本测试 + 128 个 Vitest 文件 / 584 项测试，其中本次新增服务、缓存、表单共 12 项；中途一次未改动的包装工单人员选择测试失败，单独复跑与完整复跑均通过。`bun run typecheck`、`bun run build` 通过；`bun lint` 0 错误 / 15 个既有警告；`bunx antd lint src/features/jintan/PartsStockIn --format json` 0 问题。未做浏览器登录后的端到端操作验证，前端尚未发布。
