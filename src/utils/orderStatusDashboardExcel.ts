import type {
  OrderProductionStatus,
  OrderStatusDashboardItem,
  OrderStatusJobColumn,
} from '@/services/apiOrderStatusDashboard'

import * as XLSX from 'xlsx-js-style'
import { getDashboardJobColumns } from '@/features/workshop/OrderStatusDashboard/dashboardJobColumns'
import { buildDashboardSummary, PRODUCTION_STATUS_OPTIONS } from '@/features/workshop/OrderStatusDashboard/dashboardUtils'
import { autoFitColumnWidths, EXCEL_WRITE_OPTIONS, setColumnWidths } from '@/utils/excelStyleUtils'
import { formatDate, formatDateTime } from '@/utils/format'

type ExportRow = Record<string, string | number>
type CellValue = string | number

export interface ExportOrderStatusDashboardOptions {
  exportedAt?: Date
  tabLabel?: string
}

const FONT_NAME = '微软雅黑'
const HEADER_ROW_INDEX = 2
const DATA_START_ROW_INDEX = 3

const PALETTE = {
  bannerBg: 'F8FAFC',
  bannerBorder: '334155',
  borderLight: 'E2E8F0',
  borderMedium: 'CBD5E1',
  headerBg: 'EEF2F6',
  headerBorderBottom: '334155',
  headerText: '0F172A',
  mutedText: '94A3B8',
  negativeBg: 'FEF2F2',
  negativeText: 'DC2626',
  orderActiveText: '1D4ED8',
  orderClosedText: '64748B',
  subtitleText: '64748B',
  summaryBg: 'F1F5F9',
  summaryBorderBottom: '334155',
  summaryBorderTop: '475569',
  textPrimary: '0F172A',
  zebraEven: 'FFFFFF',
  zebraOdd: 'F8FAFC',
} as const

const PRODUCTION_STATUS_CELL_STYLES: Record<OrderProductionStatus, { bg: string, text: string }> = {
  正常: { bg: 'F0FDF4', text: '15803D' },
  预警: { bg: 'FFFBEB', text: 'B45309' },
  延期: { bg: 'FEF2F2', text: 'B91C1C' },
}

const CENTERED_HEADERS = new Set(['序号', '交货日期', '生产状态', '订单状态'])
const LEFT_TEXT_HEADERS = new Set(['项目号', '型号', '客户', '客户型号', '料号', '图材质', '接收车间'])

const FIXED_COLUMN_WIDTHS: Record<string, number> = {
  '序号': 7,
  '项目号': 16,
  '型号': 12,
  '长度': 9,
  '订单数量': 11,
  '交货日期': 13,
  '料号': 24,
  '图材质': 10,
  '物料转移数量': 13,
  '库存': 12,
  '返工待生产': 11,
  '返工待技术': 11,
  '返工待品质': 11,
  '返工已完成': 11,
  '成品率': 10,
  '完工率(%)': 11,
  '生产状态': 14,
  '订单状态': 10,
}

const DYNAMIC_COLUMN_WIDTH_BOUNDS: Record<string, [number, number]> = {
  客户: [16, 28],
  客户型号: [18, 30],
  接收车间: [12, 24],
}

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function resolveColumnWidths(
  worksheet: XLSX.WorkSheet,
  tableRows: CellValue[][],
  headers: string[],
): number[] {
  autoFitColumnWidths(worksheet, tableRows, 9, 30)

  return headers.map((header, index) => {
    const fixed = FIXED_COLUMN_WIDTHS[header]
    if (fixed !== undefined) {
      return fixed
    }

    const autoWidth = worksheet['!cols']?.[index]?.wch ?? 11
    const bounds = DYNAMIC_COLUMN_WIDTH_BOUNDS[header]
    if (bounds) {
      return clamp(autoWidth, bounds[0], bounds[1])
    }

    return clamp(autoWidth, 9, 14)
  })
}

function getStatusBadgeStyle(statusText: unknown) {
  if (statusText === '正常' || statusText === '预警' || statusText === '延期') {
    return PRODUCTION_STATUS_CELL_STYLES[statusText]
  }
  return null
}

function applyBannerStyles(
  worksheet: XLSX.WorkSheet,
  columnCount: number,
  halfCol: number,
): void {
  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    const titleAddress = XLSX.utils.encode_cell({ r: 0, c: columnIndex })
    worksheet[titleAddress] = worksheet[titleAddress] ?? { t: 's', v: '' }
    worksheet[titleAddress].s = {
      font: {
        name: FONT_NAME,
        sz: 15,
        bold: true,
        color: { rgb: PALETTE.textPrimary },
      },
      fill: { patternType: 'solid', fgColor: { rgb: PALETTE.bannerBg } },
      alignment: {
        horizontal: 'center',
        vertical: 'center',
      },
    }

    const isRightMeta = columnIndex >= halfCol
    const metaAddress = XLSX.utils.encode_cell({ r: 1, c: columnIndex })
    worksheet[metaAddress] = worksheet[metaAddress] ?? { t: 's', v: '' }
    worksheet[metaAddress].s = {
      font: {
        name: FONT_NAME,
        sz: 9.5,
        color: { rgb: PALETTE.subtitleText },
      },
      fill: { patternType: 'solid', fgColor: { rgb: PALETTE.bannerBg } },
      alignment: {
        horizontal: isRightMeta ? 'right' : 'left',
        vertical: 'center',
        indent: isRightMeta ? 0 : 1,
      },
      border: {
        bottom: { style: 'medium', color: { rgb: PALETTE.bannerBorder } },
      },
    }
  }
}

function applyExportStyles(
  worksheet: XLSX.WorkSheet,
  exportRows: ExportRow[],
  headers: string[],
): void {
  const columnCount = headers.length
  const halfCol = Math.max(1, Math.floor(columnCount / 2))
  const tableRows: CellValue[][] = [
    headers,
    ...exportRows.map(row => headers.map(header => row[header] ?? '')),
  ]
  const widths = resolveColumnWidths(worksheet, tableRows, headers)
  setColumnWidths(worksheet, widths)

  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: columnCount - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: halfCol - 1 } },
    { s: { r: 1, c: halfCol }, e: { r: 1, c: columnCount - 1 } },
  ]

  worksheet['!rows'] = [
    { hpt: 34, hpx: 34 },
    { hpt: 22, hpx: 22 },
  ]
  applyBannerStyles(worksheet, columnCount, halfCol)

  tableRows.forEach((row, tableRowIndex) => {
    const sheetRowIndex = HEADER_ROW_INDEX + tableRowIndex
    const isHeader = tableRowIndex === 0
    const isSummary = tableRowIndex === tableRows.length - 1
    let lines = 1

    row.forEach((value, columnIndex) => {
      const address = XLSX.utils.encode_cell({ r: sheetRowIndex, c: columnIndex })
      const cell = worksheet[address] ?? { t: 's', v: '' }
      worksheet[address] = cell

      const header = headers[columnIndex]
      const isNumber = typeof value === 'number'
      const isPercent = header === '成品率' || header === '完工率(%)'
      const centered = CENTERED_HEADERS.has(header)
      const isLeftText = LEFT_TEXT_HEADERS.has(header)
      const isNegativeStock = header === '库存' && isNumber && value < 0
      const isMutedZero = !isHeader && !isSummary && (
        (isNumber && value === 0 && header !== '序号')
        || value === '-'
      )
      const statusBadge = !isHeader && !isSummary && header === '生产状态'
        ? getStatusBadgeStyle(value)
        : null

      let fillRgb: string = isHeader
        ? PALETTE.headerBg
        : isSummary
          ? PALETTE.summaryBg
          : (sheetRowIndex - DATA_START_ROW_INDEX) % 2 === 0
              ? PALETTE.zebraEven
              : PALETTE.zebraOdd

      let fontColor: string = isHeader ? PALETTE.headerText : PALETTE.textPrimary
      let isBold = isHeader || isSummary

      if (statusBadge) {
        fillRgb = statusBadge.bg
        fontColor = statusBadge.text
        isBold = true
      }
      else if (isNegativeStock) {
        fillRgb = isSummary ? PALETTE.summaryBg : PALETTE.negativeBg
        fontColor = PALETTE.negativeText
        isBold = true
      }
      else if (isMutedZero) {
        fontColor = PALETTE.mutedText
      }
      else if (!isHeader && !isSummary && header === '订单状态') {
        fontColor = value === '已结案' ? PALETTE.orderClosedText : PALETTE.orderActiveText
      }

      const horizontal = isHeader || centered
        ? 'center'
        : isNumber || isPercent
          ? 'right'
          : 'left'

      cell.s = {
        font: {
          name: FONT_NAME,
          sz: isHeader ? 10.5 : 10,
          bold: isBold,
          color: { rgb: fontColor },
        },
        fill: { patternType: 'solid', fgColor: { rgb: fillRgb } },
        alignment: {
          horizontal,
          vertical: 'center',
          wrapText: true,
          ...(horizontal === 'left' && isLeftText ? { indent: 1 } : {}),
        },
        border: {
          top: {
            style: isSummary ? 'medium' : 'thin',
            color: { rgb: isSummary ? PALETTE.summaryBorderTop : isHeader ? PALETTE.borderMedium : PALETTE.borderLight },
          },
          bottom: {
            style: isHeader || isSummary ? 'medium' : 'thin',
            color: { rgb: isHeader ? PALETTE.headerBorderBottom : isSummary ? PALETTE.summaryBorderBottom : PALETTE.borderLight },
          },
          left: {
            style: 'thin',
            color: { rgb: isHeader || isSummary ? PALETTE.borderMedium : PALETTE.borderLight },
          },
          right: {
            style: 'thin',
            color: { rgb: isHeader || isSummary ? PALETTE.borderMedium : PALETTE.borderLight },
          },
        },
      }

      if (isNumber) {
        cell.z = isPercent ? '0.0%' : header === '序号' ? '0' : '#,##0;-#,##0;"-"'
      }

      const effectiveWidth = Math.max(1, widths[columnIndex] - (horizontal === 'left' && isLeftText ? 5 : 4))
      const wrappedLines = String(value ?? '').split('\n').reduce(
        (count, line) => count + Math.max(1, Math.ceil(getTextWidth(line) / effectiveWidth)),
        0,
      )
      lines = Math.max(lines, wrappedLines)
    })

    const minHeight = isHeader ? 28 : isSummary ? 28 : 24
    const rowHeight = Math.max(minHeight, lines * 16 + 10)
    worksheet['!rows']![sheetRowIndex] = { hpt: rowHeight, hpx: rowHeight }
  })
}

export function exportOrderStatusDashboardToExcel(
  rows: readonly OrderStatusDashboardItem[],
  jobColumns: readonly OrderStatusJobColumn[],
  startIndex = 0,
  options: ExportOrderStatusDashboardOptions = {},
): void {
  if (rows.length === 0)
    return

  const outputJobColumns = getDashboardJobColumns(jobColumns)
  const dataRows = toExportRows(rows, outputJobColumns, startIndex)
  const headers = Object.keys(dataRows[0])
  const exportRows = [...dataRows, toSummaryRow(rows, outputJobColumns, headers)]
  const columnCount = headers.length
  const halfCol = Math.max(1, Math.floor(columnCount / 2))
  const exportedAt = options.exportedAt ?? new Date()
  const titleText = options.tabLabel
    ? `订单现状生产进度报表（${options.tabLabel}）`
    : '订单现状生产进度报表'

  const titleRow: CellValue[] = Array.from({ length: columnCount }, (_, index) =>
    index === 0 ? titleText : '')
  const metaRow: CellValue[] = Array.from({ length: columnCount }, (_, index) => {
    if (index === 0) {
      return `当前页第 ${startIndex + 1} - ${startIndex + rows.length} 条（共 ${rows.length} 条）`
    }
    if (index === halfCol) {
      return `导出时间：${formatDateTime(exportedAt)}`
    }
    return ''
  })

  const sheetData: CellValue[][] = [
    titleRow,
    metaRow,
    headers,
    ...exportRows.map(row => headers.map(header => row[header] ?? '')),
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData)
  const workbook = XLSX.utils.book_new()

  applyExportStyles(worksheet, exportRows, headers)
  XLSX.utils.book_append_sheet(workbook, worksheet, '订单现状')
  XLSX.writeFile(
    workbook,
    `订单现状_当前页_${rows.length}条_${formatDate(exportedAt)}.xlsx`,
    EXCEL_WRITE_OPTIONS,
  )
}
