import * as XLSX from 'xlsx-js-style'

import type {
  OrderStatusDashboardItem,
  OrderStatusJobColumn,
} from '@/services/apiOrderStatusDashboard'
import { EXCEL_WRITE_OPTIONS, setColumnWidths } from '@/utils/excelStyleUtils'

type ExportRow = Record<string, string | number>

function formatCellText(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean).join('、')
  }

  return String(value)
}

function formatPercent(value: number | null | undefined) {
  return value === null || value === undefined ? '' : `${value}%`
}

function getJobColumns(jobColumns: OrderStatusJobColumn[]) {
  return jobColumns.filter((column) => column.key !== '精切')
}

function toExportRows(
  rows: OrderStatusDashboardItem[],
  jobColumns: OrderStatusJobColumn[],
) {
  const outputJobColumns = getJobColumns(jobColumns)

  return rows.map<ExportRow>((row, index) => {
    const exportRow: ExportRow = {
      序号: index + 1,
      项目号: formatCellText(row.project_no),
      型号: formatCellText(row.product_model),
      长度: Number(row.length_mm || 0),
      订单数量: Number(row.order_quantity || 0),
      客户: formatCellText(row.customer),
      客户型号: formatCellText(row.customer_model),
      交货日期: formatCellText(row.product_delivery_date),
      料号: formatCellText(row.material_code),
      图材质: formatCellText(row.material_name),
      挤压: Number(row.extrusionQuantity || 0),
      精切: Number(row.precisionCuttingQuantity || 0),
    }

    outputJobColumns.forEach((column) => {
      exportRow[column.title] = Number(row.jobOutputs[column.key] || 0)
    })

    exportRow.物料转移数量 = Number(row.transferQuantity || 0)
    exportRow.接收车间 = formatCellText(row.transferWorkshops)
    exportRow.返工待生产 = row.reworkRepairInfo.pendingProductionCount
    exportRow.返工待技术 = row.reworkRepairInfo.pendingTechnicalCount
    exportRow.返工待品质 = row.reworkRepairInfo.pendingQualityCount
    exportRow.返工已完成 = row.reworkRepairInfo.completedCount
    exportRow.成品率 = formatPercent(row.yieldRate)
    exportRow['完工率(%)'] = formatPercent(row.completionRate)
    exportRow.生产状态 = row.productionStatus
    exportRow.订单状态 = formatCellText(row.status)

    return exportRow
  })
}

export function exportOrderStatusDashboardToExcel(
  rows: OrderStatusDashboardItem[],
  jobColumns: OrderStatusJobColumn[],
) {
  const exportRows = toExportRows(rows, jobColumns)
  const worksheet = XLSX.utils.json_to_sheet(exportRows)
  const workbook = XLSX.utils.book_new()

  setColumnWidths(
    worksheet,
    Object.keys(exportRows[0] ?? {}).map((header) =>
      Math.max(10, Math.min(24, header.length + 6)),
    ),
  )
  XLSX.utils.book_append_sheet(workbook, worksheet, '订单现状')
  XLSX.writeFile(
    workbook,
    `订单现状_${rows.length}条_${new Date().toISOString().slice(0, 10)}.xlsx`,
    EXCEL_WRITE_OPTIONS,
  )
}
