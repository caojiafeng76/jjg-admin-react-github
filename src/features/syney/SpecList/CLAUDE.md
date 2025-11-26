# SpecList 模块 - 踏板规格管理

> [根目录](../../../../CLAUDE.md) > [src](../../../) > [features](../../) > [syney](../) > **SpecList**

---

## 模块职责

SpecList 模块负责管理电梯踏板的规格信息，主要功能包括：
- 踏板规格的 CRUD 操作（创建、读取、更新、删除）
- 规格列表的分页与筛选
- 按件号（PartNo）模糊搜索
- 规格数据的批量管理

---

## 入口与启动

### 页面入口
- **路由路径**：`/syney-spec-list`
- **页面组件**：`src/pages/SyneySpecList.tsx`
- **主容器组件**：`./index.tsx`

### 主要依赖
```typescript
import { SpecTable } from './SpecTable'           // 规格表格组件
import { SpecForm } from './SpecForm'             // 规格表单（创建/编辑）
import { PartNoInput } from './PartNoInput'       // 件号搜索输入框
import { useSyneySpecs } from './useSyneySpecs'   // 规格列表查询 Hook
import { useCreateSyneySpec } from './useCreateSpec' // 规格创建 Hook
import { useUpdateSyneySpec } from './useUpdateSyneySpec' // 规格更新 Hook
import { useDeleteSyneySpecs } from './useDeleteSyneySpecs' // 规格删除 Hook
```

---

## 对外接口

### 组件导出
```typescript
// 主容器组件（默认导出）
export default SpecListContainer

// 子组件（命名导出）
export { SpecTable }
export { SpecForm }
export { PartNoInput }
```

### Hooks 导出
```typescript
export { useSyneySpecs }          // 查询规格列表
export { useSyneySpec }           // 查询单个规格
export { useCreateSyneySpec }     // 创建规格
export { useUpdateSyneySpec }     // 更新规格
export { useDeleteSyneySpecs }    // 批量删除规格
```

---

## 关键依赖与配置

### TanStack Query 缓存键
```typescript
// 规格列表查询
['syney-specs', { PartNo, page, pageSize, isAll }]

// 单个规格查询
['syney-spec', id]
```

### API 服务依赖
- `services/apiSyneySpecs.ts`：规格 CRUD 操作

### 关键配置
- **分页大小**：默认 10 条/页
- **全量查询上限**：1000 条（用于订单创建时的规格匹配）
- **搜索模式**：件号（PartNo）模糊匹配（使用 Supabase 的 `ilike` 操作符）

---

## 数据模型

### ISyneySpec（规格实体）
```typescript
interface ISyneySpec {
  id?: number                    // 主键
  PartNo: string | null          // 件号（如 "XN2808X001"）
  PartName: string | null        // 零件名称（如 "前沿板"）
  Spec: string | null            // 规格参数（如 "1000型"）
  ParamSpec: string | null       // 参数规格（如 "1000mm x 300mm"）
  Unit: string | null            // 单位（如 "件"、"米"）
  created_at?: string            // 创建时间
}
```

### 典型规格示例
```json
{
  "PartNo": "XN2808X001",
  "PartName": "前沿板",
  "Spec": "1000型",
  "ParamSpec": "1000mm x 300mm x 10mm",
  "Unit": "件"
}
```

---

## 核心功能详解

### 1. 规格列表查询与分页
**文件**：`useSyneySpecs.ts`

**功能**：
- 支持分页查询（`page`、`pageSize`）
- 支持按件号模糊搜索（`PartNo`）
- 支持全量查询（`isAll=true`，用于订单创建时的规格匹配）

**关键代码**：
```typescript
// services/apiSyneySpecs.ts
export async function getSyneySpecs({
  PartNo,
  page = 1,
  pageSize = 10,
  isAll = false,
}: {
  PartNo?: string
  page?: number
  pageSize?: number
  isAll?: boolean
}) {
  let query = supabase
    .from('syney-specs')
    .select('*', { count: 'exact' })

  // 按件号模糊搜索
  if (PartNo) {
    query = query.ilike('PartNo', `%${PartNo}%`)
  }

  // 分页或全量查询
  if (isAll) {
    query = query.limit(1000)  // 全量查询限制上限
  } else {
    const from = (page - 1) * pageSize
    const to = from + pageSize
    query = query.range(from, to - 1)
  }

  const { data, error, count } = await query

  if (error) {
    throw handleApiError(error, '踏板规格列表获取失败')
  }

  return { syneySpecs: data, count }
}
```

**使用场景**：
- **分页查询**：在规格列表页面展示规格数据
- **全量查询**：在订单创建时匹配规格参数（`ParamSpec`）

### 2. 规格创建
**文件**：`useCreateSpec.ts`

**功能**：
- 创建新的规格记录
- 自动去重（检查 `PartNo` 是否已存在）
- 表单验证（必填字段、格式校验）

**核心逻辑**：
```typescript
// services/apiSyneySpecs.ts
export async function createSyneySpec(newSyneySpec: ISyneySpec) {
  // 检查件号是否已存在
  const { data: existingSpec } = await supabase
    .from('syney-specs')
    .select('id')
    .eq('PartNo', newSyneySpec.PartNo)
    .single()

  if (existingSpec) {
    throw new Error(`件号 ${newSyneySpec.PartNo} 已存在`)
  }

  const { data, error } = await supabase
    .from('syney-specs')
    .insert([newSyneySpec])
    .select()
    .single()

  if (error) {
    throw handleApiError(error, '踏板规格创建失败')
  }

  return data
}
```

### 3. 规格编辑
**文件**：`useUpdateSyneySpec.ts`

**功能**：
- 单条规格的更新操作
- 仅允许编辑一条规格（多选时显示警告）
- 自动校验必填字段

**限制**：
- 不支持批量编辑（业务逻辑决定）
- 编辑时需选中且仅选中一条规格

### 4. 批量删除
**文件**：`useDeleteSyneySpecs.ts`

**功能**：
- 支持多选批量删除
- 二次确认机制（Ant Design Popconfirm）
- 删除前检查规格是否被订单引用（TODO：未实现）

**安全性建议**：
- 添加级联删除检查（检查 `syney-po-items` 表中是否有引用）
- 考虑软删除（添加 `deleted_at` 字段）

---

## 测试与质量

### 当前测试状态
- 无单元测试
- 无集成测试

### 测试建议
1. **单元测试**：
   - `getSyneySpecs()` 函数（测试分页、搜索逻辑）
   - `createSyneySpec()` 函数（测试去重逻辑）
   - `useDeleteSyneySpecs` Hook（测试批量删除）

2. **集成测试**：
   - 规格创建 → 列表刷新
   - 规格编辑 → 数据更新
   - 规格删除 → 列表更新

---

## 常见问题 (FAQ)

### 1. 为什么编辑只能选择一条规格？
规格编辑涉及多个字段的修改，批量编辑容易导致数据不一致。如需批量修改相同字段（如 `Unit`），可以扩展 `useUpdateSyneySpec` 支持批量更新。

### 2. 件号搜索不区分大小写？
是的，使用 Supabase 的 `ilike` 操作符实现模糊搜索，不区分大小写。如需精确匹配，改用 `eq` 操作符。

### 3. 如何导入大量规格数据？
当前仅支持手动逐条创建。建议：
- 添加 Excel 导入功能（参考 PoList 模块的 `ExcelUpload` 组件）
- 或使用 Supabase 的批量 `insert` API

### 4. 删除规格后订单明细中的规格参数会怎样？
当前删除操作未检查引用关系。建议：
- 实现软删除（添加 `is_deleted` 字段）
- 或添加外键约束（`ON DELETE RESTRICT`）

### 5. `ParamSpec` 字段的作用？
`ParamSpec` 用于订单明细中自动填充规格参数。在订单创建时，系统会根据 `PartNo` 匹配规格表，自动填充 `ParamSpec` 字段。

---

## 相关文件清单

### 组件
- `index.tsx` - 主容器组件
- `SpecTable.tsx` - 规格表格
- `SpecForm.tsx` - 规格表单（创建/编辑）
- `PartNoInput.tsx` - 件号搜索输入框

### Hooks
- `useSyneySpecs.ts` - 查询规格列表
- `useSyneySpec.ts` - 查询单个规格
- `useCreateSpec.ts` - 创建规格
- `useUpdateSyneySpec.ts` - 更新规格
- `useDeleteSyneySpecs.ts` - 批量删除规格

### API 服务
- `services/apiSyneySpecs.ts` - 规格 CRUD API

---

## 变更记录 (Changelog)

### 2025-11-26
- 初始化 SpecList 模块文档
- 记录核心功能与数据模型

---

**下一步建议**：
1. 添加 Excel 导入功能（批量创建规格）
2. 实现软删除机制（避免误删）
3. 添加单元测试覆盖核心逻辑
4. 检查规格删除时的引用关系
