# ReportList 模块 - 库存报告列表

> [根目录](../../../../CLAUDE.md) > [src](../../../) > [features](../../) > [syney](../) > **ReportList**

---

## 模块职责

ReportList 模块负责管理西尼电梯踏板的库存对账单，主要功能包括：
- 对账单的 CRUD 操作
- 对账单列表的分页、筛选、状态管理
- 对账单批量操作（确认、取消确认、删除）
- PDF 打印（对账单、汇总表）
- Excel 导出（明细数据）

---

## 入口与启动

### 页面入口
- **路由路径**：`/syney-store-report-list`
- **页面组件**：`src/pages/SyneyStoreReportList.tsx`
- **主容器组件**：`./index.tsx`

### 主要依赖
```typescript
import { ReportTable } from './ReportTable'           // 报告表格组件
import { ReportForm } from './ReportForm'             // 报告表单（创建）
import { ReportSelect } from './ReportSelect'         // 状态筛选下拉框
import { useReports } from './useReports'             // 报告列表查询 Hook
import { useCreateReport } from './useCreateReport'   // 报告创建 Hook
import { useDeleteReport } from './useDeleteReport'   // 报告删除 Hook
import { useUpdateReports } from './useUpdateReports' // 批量更新 Hook
import { useSelectedReports } from './useSelectedReports' // 选中报告详情 Hook
import { useGenerateSyneyStoreReportPDF } from './useGenerateSyneyStoreReportPDF' // PDF 生成 Hook
import { useExportReportsAsExcel } from './useExportReportsAsExcel' // Excel 导出 Hook
```

---

## 对外接口

### 组件导出
```typescript
// 主容器组件（默认导出）
export default ReportListContainer

// 子组件（命名导出）
export { ReportTable }
export { ReportForm }
export { ReportSelect }
export { ConfirmButton }
export { UnConfirmedButton }
export { ExportAsExcelButton }
export { ExportPDFButton }
```

### Hooks 导出
```typescript
export { useReports }                         // 查询报告列表
export { useCreateReport }                    // 创建报告
export { useDeleteReport }                    // 删除报告
export { useUpdateReports }                   // 批量更新报告状态
export { useSelectedReports }                 // 获取选中报告详情
export { useGenerateSyneyStoreReportPDF }     // 生成对账单 PDF
export { useGenerateSummaryPDF }              // 生成汇总表 PDF
export { useExportReportsAsExcel }            // 导出 Excel
```

---

## 关键依赖与配置

### TanStack Query 缓存键
```typescript
// 报告列表查询
['syney-store-reports', { page, pageSize, Status, No }]

// 单个报告查询（在 ReportDetail 模块中）
['syney-store-report', No]

// 选中报告详情
['selected-syney-store-reports', selectedIds]
```

### API 服务依赖
- `services/apiSyneyStoreReports.ts`：报告列表 CRUD 操作
- `services/apiSyneyStoreReport.ts`：报告详情查询与更新

### 关键配置
- **分页大小**：默认 10 条/页
- **状态筛选**：全部 / 未确认 / 已确认
- **批量操作上限**：建议单次不超过 50 条报告

---

## 数据模型

### ISyneyStoreReport（库存报告实体）
```typescript
interface ISyneyStoreReport {
  id?: number                    // 主键
  No: string                     // 对账单号（如 "RPT20250101001"）
  Status?: string                // 状态（未确认 / 已确认）
  TotalAmount?: number | null    // 总金额
  Detail?: string | null         // 明细数据（JSON 字符串）
  created_at?: string            // 创建时间
}
```

### Detail 字段结构
`Detail` 字段存储 JSON 字符串，包含报告的明细项：
```json
[
  {
    "PartNo": "XN2808X001",
    "PartName": "前沿板",
    "Spec": "1000型",
    "Qty": 100,
    "UnitPrice": 150.00,
    "TotalPrice": 15000.00,
    "Remark": "备注信息"
  }
]
```

### 报告状态枚举
```typescript
const REPORT_STATUS = {
  ALL: '全部',
  UNCONFIRMED: '未确认',
  CONFIRMED: '已确认',
}
```

---

## 核心功能详解

### 1. 报告列表查询与筛选
**文件**：`useReports.ts`

**功能**：
- 支持分页查询（`page`、`pageSize`）
- 支持按状态筛选（`Status`）
- 支持按对账单号搜索（`No`）

**关键代码**：
```typescript
// services/apiSyneyStoreReports.ts
export async function getSyneyStoreReports({
  page = 1,
  pageSize = 10,
  Status,
  No,
}: {
  page?: number
  pageSize?: number
  Status?: string
  No?: string
}) {
  let query = supabase
    .from('syney-store-reports')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  // 按状态筛选
  if (Status && Status !== '全部') {
    query = query.eq('Status', Status)
  }

  // 按对账单号搜索
  if (No) {
    query = query.ilike('No', `%${No}%`)
  }

  // 分页
  const from = (page - 1) * pageSize
  const to = from + pageSize
  query = query.range(from, to - 1)

  const { data, error, count } = await query

  if (error) {
    throw handleApiError(error, '库存报告列表获取失败')
  }

  return { reports: data, count }
}
```

### 2. 报告创建
**文件**：`useCreateReport.ts`

**功能**：
- 创建新的对账单记录
- 自动生成对账单号（基于日期 + 序号）
- 自动计算总金额（从 `Detail` 字段提取）

**核心逻辑**：
```typescript
// services/apiSyneyStoreReports.ts
export async function createSyneyStoreReport(report: ISyneyStoreReport) {
  // 自动生成对账单号
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const { count } = await supabase
    .from('syney-store-reports')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', new Date().toISOString().slice(0, 10))

  const serialNo = String((count || 0) + 1).padStart(3, '0')
  const No = `RPT${date}${serialNo}`

  // 计算总金额
  let TotalAmount = 0
  if (report.Detail) {
    const details = JSON.parse(report.Detail)
    TotalAmount = details.reduce((sum: number, item: any) => {
      return sum + (item.TotalPrice || 0)
    }, 0)
  }

  const { data, error } = await supabase
    .from('syney-store-reports')
    .insert([{ ...report, No, TotalAmount, Status: '未确认' }])
    .select()
    .single()

  if (error) {
    throw handleApiError(error, '库存报告创建失败')
  }

  return data
}
```

### 3. 批量状态更新
**文件**：`useUpdateReports.ts`

**功能**：
- 批量确认/取消确认报告
- 使用 Supabase 的 `in` 操作符批量更新
- 更新后自动刷新列表

**关键代码**：
```typescript
// services/apiSyneyStoreReports.ts
export async function updateSyneyStoreReports({
  ids,
  data,
}: {
  ids: string[]
  data: Partial<ISyneyStoreReport>
}) {
  const { error } = await supabase
    .from('syney-store-reports')
    .update(data)
    .in('id', ids.map(Number))

  if (error) {
    throw handleApiError(error, '库存报告批量更新失败')
  }
}
```

**使用场景**：
- **确认按钮**（`ConfirmButton.tsx`）：将选中报告状态改为"已确认"
- **取消确认按钮**（`UnConfirmedButton.tsx`）：将选中报告状态改为"未确认"

### 4. PDF 打印功能
**文件**：`useGenerateSyneyStoreReportPDF.ts`、`useGenerateSummaryPDF.ts`

**功能**：
- **对账单 PDF**：单个报告的详细对账单（包含明细表格）
- **汇总表 PDF**：多个报告的汇总信息（仅显示总金额等关键信息）

**实现机制**：
```typescript
// useGenerateSyneyStoreReportPDF.ts
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { myFont } from '@assets/myFont'

export function useGenerateSyneyStoreReportPDF() {
  const { selectedReports } = useSelectedReports()

  const print = () => {
    const doc = new jsPDF()

    // 添加中文字体
    doc.addFileToVFS('myFont.ttf', myFont)
    doc.addFont('myFont.ttf', 'myFont', 'normal')
    doc.setFont('myFont')

    selectedReports.forEach((report, index) => {
      if (index > 0) doc.addPage()

      // 标题
      doc.setFontSize(16)
      doc.text(`对账单 - ${report.No}`, 105, 20, { align: 'center' })

      // 明细表格
      const details = JSON.parse(report.Detail || '[]')
      autoTable(doc, {
        startY: 30,
        head: [['件号', '名称', '规格', '数量', '单价', '总价', '备注']],
        body: details.map((item: any) => [
          item.PartNo,
          item.PartName,
          item.Spec,
          item.Qty,
          item.UnitPrice.toFixed(2),
          item.TotalPrice.toFixed(2),
          item.Remark || '',
        ]),
        foot: [['', '', '', '', '合计', report.TotalAmount.toFixed(2), '']],
      })
    })

    doc.save(`对账单_${Date.now()}.pdf`)
  }

  return { print }
}
```

### 5. Excel 导出
**文件**：`useExportReportsAsExcel.ts`

**功能**：
- 将选中报告的明细数据导出为 Excel 文件
- 使用 `xlsx` 库生成 `.xlsx` 文件
- 自动合并多个报告的明细数据

**关键代码**：
```typescript
import * as XLSX from 'xlsx'

export function useExportReportsAsExcel() {
  const { selectedReports } = useSelectedReports()

  const exportExcel = () => {
    const allDetails: any[] = []

    selectedReports.forEach((report) => {
      const details = JSON.parse(report.Detail || '[]')
      details.forEach((item: any) => {
        allDetails.push({
          对账单号: report.No,
          件号: item.PartNo,
          名称: item.PartName,
          规格: item.Spec,
          数量: item.Qty,
          单价: item.UnitPrice,
          总价: item.TotalPrice,
          备注: item.Remark || '',
        })
      })
    })

    const worksheet = XLSX.utils.json_to_sheet(allDetails)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '对账单明细')

    XLSX.writeFile(workbook, `对账单明细_${Date.now()}.xlsx`)
  }

  return { exportExcel }
}
```

---

## 测试与质量

### 当前测试状态
- 无单元测试
- 无集成测试

### 测试建议
1. **单元测试**：
   - 对账单号自动生成逻辑
   - 总金额计算逻辑
   - PDF 生成函数（测试输出文件）

2. **集成测试**：
   - 报告创建 → 列表刷新
   - 批量确认 → 状态更新
   - Excel 导出 → 文件下载

---

## 常见问题 (FAQ)

### 1. 对账单号的生成规则？
格式：`RPT + YYYYMMDD + 序号（3位）`
- 例如：`RPT20250101001`（2025年1月1日的第1个对账单）
- 序号每天从 001 开始递增

### 2. 如何修改对账单的明细？
在 ReportList 中只能创建和删除报告，明细的编辑需要进入 **ReportDetail 模块**（路由：`/syney-store-report-list/:reportNo`）。

### 3. 打印 PDF 时中文显示乱码？
需要确保 `src/assets/myFont.ts` 中嵌入了正确的中文字体（Base64 编码）。如果字体文件损坏，请重新生成。

### 4. Excel 导出的字段顺序如何调整？
修改 `useExportReportsAsExcel.ts` 中的对象键顺序即可：
```typescript
allDetails.push({
  对账单号: report.No,  // 顺序1
  件号: item.PartNo,     // 顺序2
  // ...
})
```

### 5. 如何实现报告的审核流程？
当前仅支持"未确认"和"已确认"两种状态。如需多级审核，建议：
- 扩展 `Status` 字段（待审核 → 已审核 → 已确认）
- 添加审核人、审核时间字段
- 实现权限控制（不同角色看到不同按钮）

---

## 相关文件清单

### 组件
- `index.tsx` - 主容器组件
- `ReportTable.tsx` - 报告表格
- `ReportForm.tsx` - 报告表单（创建）
- `ReportSelect.tsx` - 状态筛选下拉框
- `ConfirmButton.tsx` - 确认按钮
- `UnConfirmedButton.tsx` - 取消确认按钮
- `ExportAsExcelButton.tsx` - 导出 Excel 按钮
- `ExportPDFButton.tsx` - 导出 PDF 按钮

### Hooks
- `useReports.ts` - 查询报告列表
- `useCreateReport.ts` - 创建报告
- `useDeleteReport.ts` - 删除报告
- `useUpdateReports.ts` - 批量更新报告状态
- `useSelectedReports.ts` - 获取选中报告详情
- `useGenerateSyneyStoreReportPDF.ts` - 生成对账单 PDF
- `useGenerateSummaryPDF.ts` - 生成汇总表 PDF
- `useExportReportsAsExcel.ts` - 导出 Excel

### API 服务
- `services/apiSyneyStoreReports.ts` - 报告列表 CRUD API
- `services/apiSyneyStoreReport.ts` - 报告详情 API

---

## 变更记录 (Changelog)

### 2025-11-26
- 初始化 ReportList 模块文档
- 记录核心功能与数据模型

---

**下一步建议**：
1. 查看 [ReportDetail 模块文档](../ReportDetail/CLAUDE.md) 了解明细编辑功能
2. 添加单元测试覆盖核心逻辑
3. 实现多级审核流程
4. 优化 PDF 打印性能（大量数据时）
