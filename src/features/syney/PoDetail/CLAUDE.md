# PoDetail 模块 - 采购订单明细管理

> [根目录](../../../../CLAUDE.md) > [src](../../../) > [features](../../) > [syney](../) > **PoDetail**

---

## 模块职责

PoDetail 模块负责管理单个采购订单的明细项，主要功能包括：
- 订单明细的查询与展示
- 明细项的编辑、新增、删除
- 明细数据的规格自动填充
- 订单基本信息的显示

---

## 入口与启动

### 页面入口
- **路由路径**：`/syney-po-list/:PoId`
- **页面组件**：`src/pages/SyneyPoDetail.tsx`
- **主容器组件**：`./index.tsx`

### 路由参数
```typescript
// 通过 React Router 的 useParams 获取
const { PoId } = useParams()  // 订单主键 ID
```

### 主要依赖
```typescript
import { DetailTable } from './DetailTable'       // 明细表格组件
import { DetailForm } from './DetailForm'         // 明细表单（编辑/新增）
import { useDetail } from './useDetail'           // 订单明细查询 Hook
import { useItem } from './useItem'               // 单个明细项查询 Hook
import { useUpdate } from './useUpdate'           // 明细更新 Hook
```

---

## 对外接口

### 组件导出
```typescript
// 主容器组件（默认导出）
export default PoDetailContainer

// 子组件（命名导出）
export { DetailTable }
export { DetailForm }
```

### Hooks 导出
```typescript
export { useDetail }      // 查询订单明细列表
export { useItem }        // 查询单个明细项
export { useUpdate }      // 更新订单明细
```

---

## 关键依赖与配置

### TanStack Query 缓存键
```typescript
// 订单明细列表查询
['syney-po-items', PoId]

// 单个明细项查询
['syney-po-item', itemId]
```

### API 服务依赖
- `services/apiSyneyPo.ts`：订单详情查询
- 直接操作 `syney-po-items` 表进行明细的 CRUD

### 关键配置
- **明细项上限**：建议单个订单不超过 200 条明细
- **规格自动填充**：编辑件号（`PartNo`）时自动从规格表匹配并填充 `ParamSpec`

---

## 数据模型

### ISyneyItem（订单明细实体）
```typescript
interface ISyneyItem {
  id?: number                    // 主键
  PoId?: number | null           // 订单外键（关联 syney-pos 表）
  No: string | null              // 订单号
  PartNo: string | null          // 件号（如 "XN2808X001"）
  PartName: string | null        // 零件名称（如 "前沿板"）
  Spec: string | null            // 规格参数（如 "1000型"）
  ParamSpec: string | null       // 参数规格（如 "1000mm x 300mm"）
  Unit: string | null            // 单位（如 "件"）
  Qty: number | null             // 数量
  SONo: string | null            // 生产号（订单号）
  Remark: string | null          // 备注
  TaxUnitPrice?: number | null   // 含税单价
  TaxTotalPrice?: number | null  // 含税总价
  created_at?: string            // 创建时间
}
```

### 典型明细示例
```json
{
  "PoId": 123,
  "No": "PO20250101001",
  "PartNo": "XN2808X001",
  "PartName": "前沿板",
  "Spec": "1000型",
  "ParamSpec": "1000mm x 300mm x 10mm",
  "Unit": "件",
  "Qty": 100,
  "SONo": "SO20250101",
  "Remark": "品牌: 现代电梯"
}
```

---

## 核心功能详解

### 1. 订单明细查询
**文件**：`useDetail.ts`

**功能**：
- 根据订单 ID（`PoId`）查询所有明细项
- 按创建时间排序
- 提供加载状态与错误处理

**关键代码**：
```typescript
// services/apiSyneyPo.ts（或直接在 Hook 中实现）
export async function getSyneyPoItems(PoId: string) {
  const { data, error } = await supabase
    .from('syney-po-items')
    .select('*')
    .eq('PoId', Number(PoId))
    .order('created_at', { ascending: true })

  if (error) {
    throw handleApiError(error, '订单明细获取失败')
  }

  return data
}
```

### 2. 规格自动填充
**文件**：`DetailForm.tsx`

**功能**：
- 用户输入件号（`PartNo`）后，自动查询规格表（`syney-specs`）
- 如果匹配到规格，自动填充 `ParamSpec`、`PartName`、`Unit` 等字段
- 如果未匹配，允许用户手动输入

**关键代码**：
```typescript
// DetailForm.tsx
const handlePartNoChange = async (partNo: string) => {
  if (!partNo) return

  // 查询规格表
  const { data: spec } = await supabase
    .from('syney-specs')
    .select('*')
    .eq('PartNo', partNo)
    .single()

  if (spec) {
    // 自动填充字段
    form.setFieldsValue({
      PartName: spec.PartName,
      ParamSpec: spec.ParamSpec,
      Unit: spec.Unit,
      Spec: spec.Spec,
    })
  }
}

<Form.Item label="件号" name="PartNo">
  <Input onBlur={(e) => handlePartNoChange(e.target.value)} />
</Form.Item>
```

### 3. 明细更新
**文件**：`useUpdate.ts`

**功能**：
- 更新单个明细项（编辑数量、规格、备注等）
- 新增明细项
- 删除明细项
- 自动关联到父订单（`PoId`）

**核心逻辑**：
```typescript
// 更新明细
export async function updateSyneyPoItem(item: ISyneyItem) {
  const { id, ...data } = item

  const { error } = await supabase
    .from('syney-po-items')
    .update(data)
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '订单明细更新失败')
  }
}

// 新增明细
export async function createSyneyPoItem(item: ISyneyItem) {
  const { error } = await supabase
    .from('syney-po-items')
    .insert([item])

  if (error) {
    throw handleApiError(error, '订单明细创建失败')
  }
}

// 删除明细
export async function deleteSyneyPoItem(id: number) {
  const { error } = await supabase
    .from('syney-po-items')
    .delete()
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '订单明细删除失败')
  }
}
```

### 4. 表格内联编辑
**文件**：`DetailTable.tsx`

**功能**：
- 使用 Ant Design 的 `EditableTable` 实现表格内联编辑
- 点击单元格即可编辑，编辑完成后自动保存
- 支持批量选择与删除

**实现示例**：
```typescript
// DetailTable.tsx
const columns = [
  {
    title: '件号',
    dataIndex: 'PartNo',
    editable: true,
    render: (text: string, record: ISyneyItem) => (
      <EditableCell
        value={text}
        onChange={(value) => handleUpdate({ ...record, PartNo: value })}
      />
    ),
  },
  // ...
]
```

---

## 测试与质量

### 当前测试状态
- 无单元测试
- 无集成测试

### 测试建议
1. **单元测试**：
   - 规格自动填充逻辑（`handlePartNoChange`）
   - 明细更新逻辑（`updateSyneyPoItem`）
   - 明细删除逻辑（级联检查）

2. **集成测试**：
   - 明细编辑 → 列表刷新
   - 新增明细 → 自动关联订单
   - 删除明细 → 数据库记录删除

---

## 常见问题 (FAQ)

### 1. 如何新增明细项？
点击"新增"按钮，在弹出的表单中填写明细信息，提交后将创建新的明细记录并关联到当前订单。

### 2. 规格自动填充不生效？
检查以下几点：
- 规格表（`syney-specs`）中是否存在该件号的记录
- 件号输入是否完全匹配（区分大小写）
- 网络请求是否成功（查看浏览器控制台）

### 3. 删除明细后如何更新订单数量？
当前删除明细不会自动更新订单主表的 `Qty` 字段。建议：
- 在删除后重新计算订单的总数量
- 或在订单主表中移除 `Qty` 字段，改为动态计算（`SUM(syney-po-items.Qty)`）

### 4. 如何批量导入明细？
参考 PoList 模块的 `ExcelUpload` 组件，实现 Excel 导入功能，将明细数据解析后批量插入 `syney-po-items` 表。

### 5. 明细表格性能优化？
当明细数量较多时（如 > 500 条），建议：
- 使用虚拟滚动（Ant Design 的 `VirtualTable`）
- 分页加载明细（默认只显示前 50 条）
- 优化表格列宽（减少重排）

---

## 相关文件清单

### 组件
- `index.tsx` - 主容器组件
- `DetailTable.tsx` - 明细表格
- `DetailForm.tsx` - 明细表单（编辑/新增）

### Hooks
- `useDetail.ts` - 查询订单明细列表
- `useItem.ts` - 查询单个明细项
- `useUpdate.ts` - 更新订单明细

### API 服务
- `services/apiSyneyPo.ts` - 订单详情 API
- 直接操作 `syney-po-items` 表

---

## 变更记录 (Changelog)

### 2025-11-26
- 初始化 PoDetail 模块文档
- 记录核心功能与数据模型

---

**下一步建议**：
1. 查看 [PoList 模块文档](../PoList/CLAUDE.md) 了解订单列表管理
2. 添加明细项的批量导入功能（Excel）
3. 实现明细删除后的订单数量自动更新
4. 优化大数据量下的表格性能（虚拟滚动）
