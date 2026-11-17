import type {
  OrderStatusDashboardItem,
  OrderStatusJobColumn,
} from '@/services/apiOrderStatusDashboard'

import * as XLSX from 'xlsx-js-style'
import { getDashboardJobColumns } from '@/features/workshop/OrderStatusDashboard/dashboardJobColumns'
import { buildDashboardSummary, PRODUCTION_STATUS_OPTIONS } from '@/features/workshop/OrderStatusDashboard/dashboardUtils'
import { autoFitColumnWidths, EXCEL_WRITE_OPTIONS, setColumnWidths } from '@/utils/excelStyleUtils'
import { formatDate } from '@/utils/format'

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

function formatPercent(value: number | null | undefined): string | number {
  return value === null || value === undefined ? '-' : value / 100
}

function toExportRows(
  rows: readonly OrderStatusDashboardItem[],
  outputJobColumns: readonly OrderStatusJobColumn[],
  startIndex: number,
): ExportRow[] {
  return rows.map<ExportRow>((row, index) => {
    const exportRow: ExportRow = {
      序号: startIndex + index + 1,
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
    exportRow.库存 = Number(row.inventoryQuantity || 0)
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

function toSummaryRow(
  rows: readonly OrderStatusDashboardItem[],
  jobColumns: readonly OrderStatusJobColumn[],
  headers: string[],
): ExportRow {
  const summary = buildDashboardSummary(rows, jobColumns.map(column => column.key))
  const result: ExportRow = Object.fromEntries(headers.map(header => [header, '']))
  Object.assign(result, {
    '序号': '汇总',
    '订单数量': summary.orderQuantity,
    '挤压': summary.extrusionQuantity,
    '精切': summary.precisionCuttingQuantity,
    '物料转移数量': summary.transferQuantity,
    '库存': summary.inventoryQuantity,
    '返工待生产': summary.reworkRepairInfo.pendingProductionCount,
    '返工待技术': summary.reworkRepairInfo.pendingTechnicalCount,
    '返工待品质': summary.reworkRepairInfo.pendingQualityCount,
    '返工已完成': summary.reworkRepairInfo.completedCount,
    '成品率': formatPercent(summary.yieldRate),
    '完工率(%)': formatPercent(summary.completionRate),
    '生产状态': PRODUCTION_STATUS_OPTIONS
      .filter(option => summary.productionStatusCounts[option.value] > 0)
      .map(option => `${option.label} ${summary.productionStatusCounts[option.value]}`)
      .join('\n'),
  })
  for (const column of jobColumns) {
    result[column.title] = summary.jobOutputs[column.key] ?? 0
  }
  return result
}

function getTextWidth(text: string): number {
  return Array.from(text).reduce((width, character) => width + (character.charCodeAt(0) > 255 ? 2 : 1), 0)
}

function applyExportStyles(worksheet: XLSX.WorkSheet, exportRows: ExportRow[], headers: string[]): void {
  const data = [headers, ...exportRows.map(row => headers.map(header => row[header]))]
  autoFitColumnWidths(worksheet, data, 10, 36)
  const textWidths: Record<string, number> = {
    序号: 8,
    项目号: 18,
    客户: 34,
    客户型号: 34,
    交货日期: 14,
    料号: 28,
    接收车间: 28,
    生产状态: 22,
  }
  const widths = headers.map((header, index) => textWidths[header] ?? worksheet['!cols']![index].wch ?? 12)
  setColumnWidths(
    worksheet,
    widths,
  )
  worksheet['!rows'] = []
  data.forEach((row, rowIndex) => {
    const isHeader = rowIndex === 0
    const isSummary = rowIndex === data.length - 1
    let lines = 1
    row.forEach((value, columnIndex) => {
      const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })
      const cell = worksheet[address] ?? { t: 's', v: '' }
      worksheet[address] = cell
      const header = headers[columnIndex]
      const isNumber = typeof value === 'number'
      const isPercent = header === '成品率' || header === '完工率(%)'
      const centered = ['序号', '交货日期', '生产状态', '订单状态'].includes(header)
      const fill = isHeader ? '2563EB' : isSummary ? 'DBEAFE' : rowIndex % 2 === 0 ? 'EFF6FF' : 'FFFFFF'
      cell.s = {
        font: {
          name: '微软雅黑',
          sz: 11,
          bold: isHeader || isSummary,
          color: { rgb: isHeader ? 'FFFFFF' : header === '库存' && isNumber && value < 0 ? 'DC2626' : '1E293B' },
        },
        fill: { patternType: 'solid', fgColor: { rgb: fill } },
        alignment: {
          horizontal: isHeader || centered ? 'center' : isNumber || isPercent ? 'right' : 'left',
          vertical: 'center',
          wrapText: true,
        },
        border: {
          top: { style: isSummary ? 'medium' : 'thin', color: { rgb: isSummary ? '2563EB' : 'CBD5E1' } },
          bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
          left: { style: 'thin', color: { rgb: 'CBD5E1' } },
          right: { style: 'thin', color: { rgb: 'CBD5E1' } },
        },
      }
      if (isNumber) {
        cell.z = isPercent ? '0.0%' : header === '序号' ? '0' : '#,##0;-#,##0;"-"'
      }
      const wrappedLines = String(value ?? '').split('\n').reduce(
        (count, line) => count + Math.max(1, Math.ceil(getTextWidth(line) / Math.max(1, widths[columnIndex] - 4))),
        0,
      )
      lines = Math.max(lines, wrappedLines)
    })
    worksheet['!rows']![rowIndex] = { hpt: Math.max(isHeader ? 30 : 26, lines * 17 + 10) }
  })
}

export function exportOrderStatusDashboardToExcel(
  rows: readonly OrderStatusDashboardItem[],
  jobColumns: readonly OrderStatusJobColumn[],
  startIndex = 0,
): void {
  if (rows.length === 0)
    return

  const outputJobColumns = getDashboardJobColumns(jobColumns)
  const exportRows = toExportRows(rows, outputJobColumns, startIndex)
  const headers = Object.keys(exportRows[0])
  exportRows.push(toSummaryRow(rows, outputJobColumns, headers))
  const worksheet = XLSX.utils.json_to_sheet(exportRows)
  const workbook = XLSX.utils.book_new()

  applyExportStyles(worksheet, exportRows, headers)
  XLSX.utils.book_append_sheet(workbook, worksheet, '订单现状')
  XLSX.writeFile(
    workbook,
    `订单现状_当前页_${rows.length}条_${formatDate(new Date())}.xlsx`,
    EXCEL_WRITE_OPTIONS,
  )
}
