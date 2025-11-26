# Services 模块 - 数据访问层

> [根目录](../../../CLAUDE.md) > [src](../../) > **services**

---

## 模块职责

Services 模块是应用的数据访问层，负责：
- 封装所有 Supabase 数据库操作
- 统一错误处理与异常转换
- 提供类型安全的 API 接口
- 实现业务逻辑（数据提取、转换、验证）

---

## 关键文件说明

### 1. supabase.ts - Supabase 客户端初始化
```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

export const supabaseUrl = import.meta.env.VITE_REACT_APP_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_REACT_APP_SUPABASE_KEY

const supabase = createClient<Database>(supabaseUrl, supabaseKey)
export default supabase
```

**环境变量**：
- `VITE_REACT_APP_SUPABASE_URL`：Supabase 项目 URL
- `VITE_REACT_APP_SUPABASE_KEY`：Supabase Anon Key（公开密钥）

### 2. database.types.ts - 数据库类型定义
**⚠️ 此文件由 Supabase CLI 自动生成，请勿手动修改！**

**更新方法**：
```bash
supabase gen types typescript --project-id your-project-id > src/services/database.types.ts
```

### 3. types.ts - 业务类型定义
定义应用层使用的业务实体类型：
- `ISyneySpec`：踏板规格实体
- `ISyneyItem`：订单明细实体
- `ISyneyStoreReport`：库存报告实体
- `ISyneyPo`：采购订单实体
- `ISyneySpecFormRef`、`ISyneyPoFormRef` 等：表单引用类型

---

## API 服务列表

### apiSyneySpecs.ts - 踏板规格管理
**CRUD 操作**：
```typescript
getSyneySpecs({ PartNo, page, pageSize, isAll }) // 查询规格列表
getSyneySpec(id)                                  // 查询单个规格
createSyneySpec(newSyneySpec)                     // 创建规格
updateSyneySpec(updates)                          // 更新规格
deleteSyneySpecs(ids)                             // 批量删除规格
```

**特性**：
- 支持按件号模糊搜索（`ilike`）
- 分页查询（`range`）
- 全量查询限制上限 1000 条

### apiSyneyPos.ts - 采购订单管理
**CRUD 操作**：
```typescript
getSyneyPos({ page, pageSize, Status, startDate, endDate, SONo, signal }) // 查询订单列表
getSyneyPo(id, signal)                           // 查询单个订单
createPo({ po, map })                             // 批量创建订单（含明细）
deletePo(ids)                                     // 批量删除订单
updatePos({ ids, data })                          // 批量更新订单
getSelectedPosWithItems(PoIds)                    // 查询选中订单及明细
```

**核心业务逻辑**：
1. **规格自动推断**（`extractSpecFromItems`）
   - 从前沿板 `Spec` 提取型号（1000型/800型/600型）
   - 从前沿板 `PartNo` 判断类型（扶梯/人行道）
   - 从中板 `Spec` 判断环境（室内/室外）
   - 组合规格：`{型号}-{环境}-{类型}`

2. **品牌自动提取**（`extractBrandFromItems`）
   - 从后板 `Remark` 字段提取"品牌:"后的内容
   - 支持括号格式（如"现代电梯(杭州)有限公司"）

3. **事务性创建**
   - 批量创建订单时，如果任一订单失败，自动回滚已创建的订单
   - 使用 `Promise.all` 并行创建提升性能

### apiSyneyPo.ts - 订单详情管理
```typescript
getSyneyPo(id, signal)  // 查询单个订单详情（与 apiSyneyPos.ts 中的重复）
```

### apiSyneyStoreReports.ts - 库存报告列表
```typescript
getSyneyStoreReports({ page, pageSize, Status, No }) // 查询报告列表
createSyneyStoreReport(report)                        // 创建报告
deleteSyneyStoreReports(ids)                          // 批量删除报告
updateSyneyStoreReports({ ids, data })                // 批量更新报告状态
```

### apiSyneyStoreReport.ts - 库存报告详情
```typescript
getSyneyStoreReport(No)         // 查询报告详情
updateSyneyStoreReport(updates) // 更新报告
```

### apiSyneySerialNo.ts - 序列号管理
```typescript
getSerialNo()            // 查询序列号配置
updateSerialNo(updates)  // 更新序列号配置
```

---

## 错误处理机制

所有 API 函数统一使用 `utils/errorHandler.ts` 中的 `handleApiError` 处理错误：

```typescript
import { handleApiError } from '@utils/errorHandler'

export async function getSyneySpecs({ PartNo, page, pageSize, isAll }) {
  const { data, error, count } = await query

  if (error) {
    throw handleApiError(error, '踏板规格列表获取失败')
  }

  return { syneySpecs: data, count }
}
```

**错误转换规则**：
- Supabase 错误 → 用户友好的中文提示
- 保留原始错误信息用于调试
- 自动记录错误日志（可选）

---

## 数据表结构说明

### 主要表
| 表名 | 说明 | 关键字段 |
|-----|------|---------|
| `syney-pos` | 采购订单表 | id, No, SONo, Spec, EndDate, Status, Qty, Brand, Technique, SerialNo, Remark, Detail |
| `syney-po-items` | 订单明细表 | id, PoId, No, PartNo, PartName, Spec, ParamSpec, Unit, Qty, SONo, Remark |
| `syney-specs` | 踏板规格表 | id, PartNo, PartName, Spec, ParamSpec, Unit |
| `syney-store-reports` | 库存报告表 | id, No, Status, TotalAmount, Detail |
| `syney-serial-no` | 序列号配置表 | id, SerialNo |

### 表关系
```
syney-pos (1) ←→ (N) syney-po-items
    ↓ PoId
订单主表 ← 订单明细表
```

---

## 性能优化建议

### 1. 使用请求取消（AbortSignal）
避免用户快速切换页面时产生无效请求：
```typescript
const { data } = useQuery({
  queryKey: ['syney-pos', page],
  queryFn: ({ signal }) => getSyneyPos({ page, pageSize, signal }),
})
```

### 2. 分页查询
使用 `range(from, to)` 替代 `limit`，提升性能：
```typescript
const from = (page - 1) * pageSize
const to = from + pageSize
query = query.range(from, to - 1)
```

### 3. 选择必要字段
避免 `select('*')`，只查询必要字段：
```typescript
.select('id, No, SONo, Spec, EndDate, Status, Qty, Brand', { count: 'exact' })
```

### 4. 并行查询
使用 `Promise.all` 并行查询多个独立资源：
```typescript
const [itemsResult, posResult] = await Promise.all([
  supabase.from('syney-po-items').select('*').in('PoId', PoIds),
  supabase.from('syney-pos').select('*').in('id', PoIds),
])
```

---

## 测试建议

### 单元测试
1. **数据提取函数**：
   - `extractBrandFromItems()` - 测试正则匹配逻辑
   - `extractSpecFromItems()` - 测试规格推断规则

2. **事务性创建**：
   - 测试 `createPo()` 的回滚机制
   - 模拟部分订单创建失败的场景

### 集成测试
1. 使用 Supabase 测试环境
2. 测试完整的 CRUD 流程
3. 测试并发请求的数据一致性

---

## 常见问题 (FAQ)

### 1. 如何调试 Supabase 查询？
在浏览器控制台查看 Supabase 的网络请求：
```typescript
// 启用调试模式（仅开发环境）
if (import.meta.env.DEV) {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event, session)
  })
}
```

### 2. 为什么查询结果为空但 count 不为 0？
可能是 `range` 的 `to` 参数计算错误，检查：
```typescript
const to = from + pageSize - 1  // ❌ 错误
const to = from + pageSize      // ✅ 正确
query.range(from, to - 1)       // 注意这里要 -1
```

### 3. 如何处理数据库字段名与 TypeScript 命名冲突？
使用 Supabase 的字段别名：
```typescript
.select('id, PartNo:part_no, PartName:part_name')
```

### 4. 批量操作的性能瓶颈？
- 使用 Supabase 的批量 API（`insert([...])`、`delete().in()`）
- 避免在循环中调用 API，改用 `Promise.all`
- 限制单次批量操作的数量（建议 ≤ 100 条）

---

## 相关文件清单

- `supabase.ts` - Supabase 客户端
- `database.types.ts` - 数据库类型（自动生成）
- `types.ts` - 业务类型定义
- `apiSyneySpecs.ts` - 踏板规格 API
- `apiSyneyPos.ts` - 采购订单列表 API
- `apiSyneyPo.ts` - 采购订单详情 API
- `apiSyneyStoreReports.ts` - 库存报告列表 API
- `apiSyneyStoreReport.ts` - 库存报告详情 API
- `apiSyneySerialNo.ts` - 序列号管理 API

---

## 变更记录 (Changelog)

### 2025-11-26
- 初始化 Services 模块文档
- 记录所有 API 服务接口
- 补充性能优化建议

---

**下一步建议**：
1. 添加 API 单元测试（使用 Vitest + MSW）
2. 优化批量操作的事务处理
3. 添加 API 请求日志记录
