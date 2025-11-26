# ReportDetail 模块 - 库存报告明细管理

> [根目录](../../../../CLAUDE.md) > [src](../../../) > [features](../../) > [syney](../) > **ReportDetail**

---

## 模块职责

ReportDetail 模块负责管理单个库存报告的明细项，主要功能包括：
- 报告明细的查询与展示
- 明细项的编辑、新增、删除
- 明细数据的实时计算（总金额自动更新）
- 报告基本信息的显示

---

## 入口与启动

### 页面入口
- **路由路径**：`/syney-store-report-list/:reportNo`
- **页面组件**：`src/pages/SyneyStoreReportDetail.tsx`
- **主容器组件**：`./index.tsx`

### 路由参数
```typescript
// 通过 React Router 的 useParams 获取
const { reportNo } = useParams()  // 对账单号（如 "RPT20250101001"）
```

### 主要依赖
```typescript
import { DetailTable } from './DetailTable'           // 明细表格组件
import { DetailForm } from './DetailForm'             // 明细表单（编辑/新增）
import { useDetail } from './useDetail'               // 报告详情查询 Hook
import { useUpdateDetail } from './useUpdateDetail'   // 明细更新 Hook
import { useDeleteDetail } from './useDeleteDetail'   // 明细删除 Hook
```

---

## 对外接口

### 组件导出
```typescript
// 主容器组件（默认导出）
export default ReportDetailContainer

// 子组件（命名导出）
export { DetailTable }
export { DetailForm }
```

### Hooks 导出
```typescript
export { useDetail }          // 查询报告详情
export { useUpdateDetail }    // 更新报告明细
export { useDeleteDetail }    // 删除报告明细
```

---

## 关键依赖与配置

### TanStack Query 缓存键
```typescript
// 报告详情查询
['syney-store-report', reportNo]
```

### API 服务依赖
- `services/apiSyneyStoreReport.ts`：报告详情查询与更新

### 关键配置
- **明细项上限**：建议单个报告不超过 100 条明细
- **自动保存**：编辑明细后自动计算总金额并更新

---

## 数据模型

### 报告详情数据结构
```typescript
interface ISyneyStoreReport {
  id?: number
  No: string                     // 对账单号
  Status?: string                // 状态（未确认 / 已确认）
  TotalAmount?: number | null    // 总金额（自动计算）
  Detail?: string | null         // 明细数据（JSON 字符串）
  created_at?: string
}
```

### Detail 字段结构（数组）
```json
[
  {
    "id": 1,
    "PartNo": "XN2808X001",
    "PartName": "前沿板",
    "Spec": "1000型",
    "Qty": 100,
    "UnitPrice": 150.00,
    "TotalPrice": 15000.00,
    "Remark": "备注信息"
  },
  {
    "id": 2,
    "PartNo": "XN2808X002",
    "PartName": "中板",
    "Spec": "室内",
    "Qty": 50,
    "UnitPrice": 120.00,
    "TotalPrice": 6000.00,
    "Remark": ""
  }
]
```

---

## 核心功能详解

### 1. 报告详情查询
**文件**：`useDetail.ts`

**功能**：
- 根据对账单号查询报告详情
- 自动解析 `Detail` 字段（JSON → 数组）
- 提供加载状态与错误处理

**关键代码**：
```typescript
// services/apiSyneyStoreReport.ts
export async function getSyneyStoreReport(No: string) {
  const { data, error } = await supabase
    .from('syney-store-reports')
    .select('*')
    .eq('No', No)
    .single()

  if (error) {
    throw handleApiError(error, '库存报告详情获取失败')
  }

  // 解析 Detail 字段
  if (data.Detail) {
    data.Detail = JSON.parse(data.Detail)
  }

  return data
}
```

### 2. 明细更新
**文件**：`useUpdateDetail.ts`

**功能**：
- 更新单个明细项（编辑件号、数量、单价等）
- 新增明细项
- 自动计算总价（`TotalPrice = Qty × UnitPrice`）
- 更新后重新计算报告总金额

**核心逻辑**：
```typescript
// services/apiSyneyStoreReport.ts
export async function updateSyneyStoreReport(updates: Partial<ISyneyStoreReport>) {
  const { No, ...data } = updates

  // 如果更新了 Detail，需要重新计算总金额
  if (data.Detail) {
    const details = JSON.parse(data.Detail)
    data.TotalAmount = details.reduce((sum: number, item: any) => {
      return sum + (item.TotalPrice || 0)
    }, 0)
  }

  const { error } = await supabase
    .from('syney-store-reports')
    .update(data)
    .eq('No', No)

  if (error) {
    throw handleApiError(error, '库存报告更新失败')
  }
}
```

**使用场景**：
- 编辑表格中的某一行明细
- 新增一行明细
- 删除某行明细后重新计算总金额

### 3. 明细删除
**文件**：`useDeleteDetail.ts`

**功能**：
- 删除指定的明细项（通过数组索引或 `id`）
- 删除后自动更新报告总金额
- 二次确认机制

**关键代码**：
```typescript
// 在组件中的实现
const handleDeleteDetail = async (detailId: number) => {
  const report = await getSyneyStoreReport(reportNo)
  const details = JSON.parse(report.Detail || '[]')

  // 过滤掉要删除的明细
  const updatedDetails = details.filter((item: any) => item.id !== detailId)

  // 更新报告
  await updateSyneyStoreReport({
    No: reportNo,
    Detail: JSON.stringify(updatedDetails),
  })
}
```

### 4. 实时计算逻辑
**表单编辑时的自动计算**：
```typescript
// DetailForm.tsx
const handleQtyOrPriceChange = () => {
  const qty = form.getFieldValue('Qty')
  const unitPrice = form.getFieldValue('UnitPrice')

  if (qty && unitPrice) {
    const totalPrice = qty * unitPrice
    form.setFieldsValue({ TotalPrice: totalPrice })
  }
}

<Form.Item label="数量" name="Qty">
  <InputNumber onChange={handleQtyOrPriceChange} />
</Form.Item>

<Form.Item label="单价" name="UnitPrice">
  <InputNumber onChange={handleQtyOrPriceChange} />
</Form.Item>

<Form.Item label="总价" name="TotalPrice">
  <InputNumber disabled />  {/* 禁用，自动计算 */}
</Form.Item>
```

---

## 测试与质量

### 当前测试状态
- 无单元测试
- 无集成测试

### 测试建议
1. **单元测试**：
   - 总金额计算逻辑（`TotalAmount` 自动更新）
   - 明细删除逻辑（确保数组正确过滤）
   - JSON 解析与序列化

2. **集成测试**：
   - 明细编辑 → 总金额更新
   - 明细删除 → 列表刷新
   - 新增明细 → 自动生成 ID

---

## 常见问题 (FAQ)

### 1. 如何新增明细项？
在 `DetailForm` 中填写新明细的信息，提交后将其追加到 `Detail` 数组末尾，并更新报告。

### 2. 明细项的 `id` 字段如何生成？
明细项的 `id` 是前端生成的临时 ID（如使用 `Date.now()` 或 UUID），不是数据库主键。它仅用于前端列表的 `key` 属性。

### 3. 为什么明细数据存储为 JSON 字符串？
因为明细项数量不固定，使用 JSON 字符串存储在单个字段中比创建独立的明细表更简单。但这种设计有以下缺点：
- 不支持复杂查询（如按件号筛选明细）
- 数据量大时性能较差
- 无法利用数据库的外键约束

**建议**：如果明细数据量较大或需要复杂查询，应创建独立的 `syney-store-report-items` 表。

### 4. 如何处理并发编辑？
当前没有锁机制，多人同时编辑同一报告可能导致数据丢失。建议：
- 添加乐观锁（版本号字段）
- 使用 WebSocket 实现实时同步
- 或限制"已确认"状态的报告不可编辑

### 5. 总金额计算不准确？
检查以下几点：
- 明细项的 `TotalPrice` 是否正确（`Qty × UnitPrice`）
- JSON 解析是否成功（查看浏览器控制台）
- 更新时是否调用了 `updateSyneyStoreReport`

---

## 相关文件清单

### 组件
- `index.tsx` - 主容器组件
- `DetailTable.tsx` - 明细表格
- `DetailForm.tsx` - 明细表单（编辑/新增）

### Hooks
- `useDetail.ts` - 查询报告详情
- `useUpdateDetail.ts` - 更新报告明细
- `useDeleteDetail.ts` - 删除报告明细

### API 服务
- `services/apiSyneyStoreReport.ts` - 报告详情 API

---

## 变更记录 (Changelog)

### 2025-11-26
- 初始化 ReportDetail 模块文档
- 记录核心功能与数据模型

---

**下一步建议**：
1. 查看 [ReportList 模块文档](../ReportList/CLAUDE.md) 了解报告列表管理
2. 添加明细项的批量导入功能（Excel）
3. 实现并发编辑的锁机制
4. 优化大数据量下的性能（考虑分页加载明细）
