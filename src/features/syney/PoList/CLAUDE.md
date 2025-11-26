# PoList 模块 - 采购订单列表管理

> [根目录](../../../../CLAUDE.md) > [src](../../../) > [features](../../) > [syney](../) > **PoList**

---

## 模块职责

采购订单列表模块（PoList）是西尼业务的核心模块之一，负责：
- 采购订单（PO）的 CRUD 操作
- 订单列表的分页、筛选、排序
- 订单批量操作（打印、导出、状态更新）
- Excel 文件上传解析并创建订单
- PDF 打印（中文版、英文版、分解单）
- 安全件信息导出至 Excel

---

## 入口与启动

### 页面入口
- **路由路径**：`/syney-po-list`
- **页面组件**：`src/pages/SyneyPoList.tsx`
- **主容器组件**：`./index.tsx`

### 主要依赖
```typescript
import { PoTable } from './PoTable'           // 订单表格组件
import { PoForm } from './PoForm'             // 订单表单（创建/编辑）
import { ExcelUpload } from './ExcelUpload'   // Excel 上传组件
import { usePos } from './usePos'             // 订单列表查询 Hook
import { useCreatePo } from './useCreatePo'   // 订单创建 Hook
import { usePrint } from './usePrint'         // 中文打印 Hook
import { usePrintEnglish } from './usePrintEnglish' // 英文打印 Hook
import { usePrintDecomposition } from './usePrintDecomposition' // 分解单打印 Hook
```

---

## 对外接口

### 组件导出
```typescript
// 主容器组件（默认导出）
export default PoListContainer

// 子组件（命名导出）
export { PoTable }
export { PoForm }
export { ExcelUpload }
export { PoSearchInput }
export { PoDateFilter }
export { PoSelected }
export { PoSelectedFilter }
export { PrintDecompositionButton }
export { ExportInfoButton }
```

### Hooks 导出
```typescript
export { usePos }                     // 查询订单列表
export { usePo }                      // 查询单个订单
export { useCreatePo }                // 创建订单
export { useDeletePo }                // 删除订单
export { useUpdatePos }               // 批量更新订单
export { useSelectedPos }             // 获取选中订单详情
export { usePrint }                   // 中文打印
export { usePrintEnglish }            // 英文打印
export { usePrintDecomposition }      // 分解单打印
export { useExportSafePartInfoAsExcel } // 导出安全件信息
export { useSerialNo }                // 查询序列号配置
export { useUpdateSerialNo }          // 更新序列号配置
```

---

## 关键依赖与配置

### TanStack Query 缓存键
```typescript
// 订单列表查询
['syney-pos', { page, pageSize, Status, startDate, endDate, SONo }]

// 单个订单查询
['syney-po', id]

// 序列号配置查询
['syney-serial-no']
```

### API 服务依赖
- `services/apiSyneyPos.ts`：订单 CRUD 操作
- `services/apiSyneyPo.ts`：订单明细查询
- `services/apiSyneySerialNo.ts`：序列号管理

### 关键配置
- **分页大小**：默认 10 条/页
- **状态筛选**：全部 / 处理中 / 已完成 / 已取消
- **日期筛选**：按截止日期（EndDate）范围筛选
- **批量操作上限**：建议单次不超过 100 条订单

---

## 数据模型

### ISyneyPo（采购订单实体）
```typescript
interface ISyneyPo {
  id: number                    // 主键
  No: string | null             // 订单号
  SONo: string | null           // 生产号（订单号）
  Spec: string | null           // 规格（如 "1000型-室内-扶梯"）
  EndDate: string | null        // 截止日期
  Status: string | null         // 状态（处理中/已完成/已取消）
  Qty: number | null            // 数量
  Brand: string | null          // 品牌（自动提取或手动输入）
  Technique: string | null      // 工艺要求
  SerialNo: number | null       // 序列号（自动生成）
  Remark: string | null         // 备注
  Detail?: string | null        // 明细数据（JSON 字符串）
  created_at: string            // 创建时间
}
```

### 订单状态枚举
```typescript
const PO_STATUS = {
  ALL: '全部',
  PROCESSING: '处理中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
}
```

---

## 核心功能详解

### 1. Excel 上传创建订单
**文件**：`ExcelUpload.tsx`、`useCreatePo.ts`

**流程**：
1. 用户上传 Excel 文件（支持 `.xlsx`、`.xls`）
2. 前端解析 Excel，提取订单数据（使用 `xlsx` 库）
3. 调用 `apiSyneyPos.createPo()` 批量创建订单
4. 自动推断规格（`extractSpecFromItems`）和品牌（`extractBrandFromItems`）
5. 创建订单同时创建关联的订单明细（`syney-po-items` 表）

**关键代码**：
```typescript
// services/apiSyneyPos.ts
export async function createPo({
  po,
  map,
}: {
  po: ISyneyPo
  map: Map<string, ISyneyItem[]>
}) {
  const createdPoIds: number[] = []
  try {
    await Promise.all(
      Array.from(map.keys()).map(async (key) => {
        const [SONo, SerialNo] = key.split('~')
        const items = map.get(key)

        // 自动提取品牌和规格
        const extractedBrand = items ? extractBrandFromItems(items) : null
        const finalBrand = po.Brand || extractedBrand

        const extractedSpec = items ? extractSpecFromItems(items) : null
        const finalSpec = po.Spec || extractedSpec

        // 创建订单和明细...
      })
    )
  } catch (error) {
    // 失败时自动回滚已创建的订单
    if (createdPoIds.length > 0) {
      await supabase.from('syney-pos').delete().in('id', createdPoIds)
    }
    throw error
  }
}
```

### 2. 订单打印功能
支持三种打印格式：

**① 中文打印**（`usePrint.ts`）
- 生成 PDF 文件，包含订单表头和明细表格
- 使用 `jspdf` + `jspdf-autotable` 库
- 支持自定义字体（`src/assets/myFont.ts`）

**② 英文打印**（`usePrintEnglish.ts`）
- 与中文打印类似，但列名和内容翻译为英文
- 适用于外贸订单

**③ 分解单打印**（`usePrintDecomposition.ts`）
- 将订单明细按件号分组
- 生成汇总表，包含总数量、件号、规格等信息

### 3. 批量操作
**选中订单的批量操作**：
- 批量更新状态（使用 `useUpdatePos.ts`）
- 批量删除（使用 `useDeletePo.ts`）
- 批量打印（支持多订单合并打印）
- 导出安全件信息至 Excel（使用 `useExportSafePartInfoAsExcel.ts`）

**实现机制**：
```typescript
// 使用 Ant Design Table 的 rowSelection
const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])

const rowSelection = {
  selectedRowKeys,
  onChange: (keys: Key[]) => setSelectedRowKeys(keys),
}

// 批量更新
const { mutate: updatePos } = useUpdatePos()
updatePos({ ids: selectedRowKeys as string[], data: { Status: '已完成' } })
```

### 4. 规格自动推断
**文件**：`services/apiSyneyPos.ts`

**规则**：
1. 从**前沿板**的 `Spec` 字段提取型号（1000型/800型/600型）
2. 从**前沿板**的 `PartNo` 判断类型（扶梯/人行道）
   - `XN2808*` → 扶梯
   - `XN3024*` → 人行道
3. 从**中板**的 `Spec` 字段判断环境（室内/室外）
4. 组合规格：`{型号}-{环境}-{类型}`（如 "1000型-室内-扶梯"）

**支持的规格列表**：
```typescript
const validSpecs = [
  '1000型-室内-扶梯', '1000型-室外-扶梯',
  '1000型-室内-人行道', '1000型-室外-人行道',
  '800型-室内-扶梯', '800型-室外-扶梯',
  '800型-室内-人行道', '800型-室外-人行道',
  '600型-室内-扶梯', '600型-室外-扶梯',
  '1000型-室内-老围框', '800型-室内-老围框', '600型-室内-老围框',
]
```

---

## 测试与质量

### 当前测试状态
- 无单元测试
- 无集成测试
- 无 E2E 测试

### 测试建议
1. **单元测试**：
   - `extractBrandFromItems()` 函数（测试正则匹配逻辑）
   - `extractSpecFromItems()` 函数（测试规格推断规则）
   - `usePos` Hook（测试分页、筛选逻辑）

2. **集成测试**：
   - Excel 上传解析流程
   - 订单创建 + 明细关联
   - 批量删除的回滚机制

3. **E2E 测试**：
   - 用户完整操作流程：上传 Excel → 创建订单 → 打印 PDF

---

## 常见问题 (FAQ)

### 1. 为什么上传 Excel 后部分订单没有规格？
规格推断依赖于订单明细中的**前沿板**和**中板**组件。如果 Excel 中缺少这些组件或 `Spec` 字段格式不符合预期，则无法自动推断规格，需手动补充。

### 2. 打印 PDF 时中文显示乱码怎么办？
需要确保 `src/assets/myFont.ts` 中嵌入了正确的中文字体（Base64 编码）。如果字体文件损坏或缺失，可以重新生成：
```bash
# 使用 jsPDF 的字体转换工具
npx jspdf-font-converter path/to/your-font.ttf myFont.ts
```

### 3. 如何修改订单列表的默认排序？
修改 `services/apiSyneyPos.ts` 中的 `getSyneyPos` 函数：
```typescript
.order('EndDate', { ascending: false })  // 按截止日期倒序
.order('No', { ascending: true })        // 同一截止日期按订单号升序
```

### 4. 批量操作时性能慢怎么办？
当前批量操作使用 `Promise.all` 并行执行，建议：
- 限制单次批量操作的数量（如最多 50 条）
- 使用 Supabase 的批量 API（`insert` 支持数组）
- 添加加载进度提示

### 5. 如何扩展新的打印格式？
参考 `usePrint.ts` 的实现，创建新的 Hook（如 `usePrintCustom.ts`），核心步骤：
1. 使用 `jsPDF` 实例化 PDF 对象
2. 使用 `autoTable` 插件绘制表格
3. 调用 `pdf.save('filename.pdf')` 下载

---

## 相关文件清单

### 组件
- `index.tsx` - 主容器组件
- `PoTable.tsx` - 订单表格
- `PoForm.tsx` - 订单表单（创建/编辑）
- `ExcelUpload.tsx` - Excel 上传组件
- `PoSearchInput.tsx` - 搜索输入框
- `PoDateFilter.tsx` - 日期筛选器
- `PoSelected.tsx` - 选中订单面板
- `PoSelectedFilter.tsx` - 选中订单筛选器
- `PrintDecompositionButton.tsx` - 分解单打印按钮
- `ExportInfoButton.tsx` - 导出信息按钮

### Hooks
- `usePos.ts` - 查询订单列表
- `usePo.ts` - 查询单个订单
- `useCreatePo.ts` - 创建订单
- `useDeletePo.ts` - 删除订单
- `useUpdatePos.ts` - 批量更新订单
- `useSelectedPos.ts` - 获取选中订单详情
- `usePrint.ts` - 中文打印
- `usePrintEnglish.ts` - 英文打印
- `usePrintDecomposition.ts` - 分解单打印
- `useExportSafePartInfoAsExcel.ts` - 导出安全件信息
- `useSerialNo.ts` - 查询序列号配置
- `useUpdateSerialNo.ts` - 更新序列号配置

### API 服务
- `services/apiSyneyPos.ts` - 订单 CRUD API
- `services/apiSyneyPo.ts` - 订单详情 API
- `services/apiSyneySerialNo.ts` - 序列号管理 API

---

## 变更记录 (Changelog)

### 2025-11-26
- 初始化模块文档
- 记录核心功能与数据流

---

**下一步操作建议**：
1. 查看 [PoDetail 模块文档](../PoDetail/CLAUDE.md) 了解订单明细管理
2. 查看 [services 文档](../../../services/CLAUDE.md) 了解 API 设计
3. 添加单元测试覆盖规格推断逻辑
