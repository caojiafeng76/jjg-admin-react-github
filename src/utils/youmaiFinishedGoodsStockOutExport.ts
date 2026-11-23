import type { YoumaiFinishedGoodsStockOut } from '@/services/apiYoumaiFinishedGoodsStockOut'
import type {
  ExcelPrintMargins,
  ExcelPrintSetupOptions,
} from '@/utils/excelPrintSetup'
import dayjs from 'dayjs'

import * as XLSX from 'xlsx-js-style'
import { downloadExcelBuffer } from '@/utils/excelExportWorker'
import { applyExcelPrintSetup } from '@/utils/excelPrintSetup'
import { EXCEL_WRITE_OPTIONS } from '@/utils/excelStyleUtils'
import { formatNumber } from '@/utils/format'
import { calculateYoumaiWeightKg } from '@/utils/youmaiWeight'

const SHEET_NAME = '优迈成品出库'
const TITLE = '优迈成品出库'

const TABLE_HEADERS = [
  '#',
  '交货日期',
  '采购订单号',
  '行号',
  '合同号',
  '物料编码',
  '物料名称',
  '型号',
  '规格',
  '出库数量',
  '重量(KG)',
  '最终库存',
  '计划数量',
  '加工数量',
] as const

// A4 横向 100% 比例 + 窄边距（0.2 in）下精确列宽（合计 137.0，预留打印安全余量）
const COLUMN_WIDTHS = [3.8, 10.8, 20.2, 5, 14, 15.5, 9.2, 6.5, 6.5, 9, 9.5, 9, 9, 9]
const BORDER_COLOR = '000000'
const HEADER_FILL = 'FFFFFF'
const BASE_BODY_ROW_HEIGHT = 22
const BASE_HEADER_ROW_HEIGHT = 24
const PRINT_MARGINS: ExcelPrintMargins = {
  left: 0.2,
  right: 0.2,
  top: 0.35,
  bottom: 0.35,
  header: 0.15,
  footer: 0.15,
}
const PRINT_SETUP: ExcelPrintSetupOptions = {
  paperSize: 9,
  orientation: 'landscape',
  scale: 100,
  horizontalCentered: true,
  margins: PRINT_MARGINS,
}

function colLetter(index: number) {
  let letter = ''
  let i = index
  while (i >= 0) {
    letter = String.fromCharCode((i % 26) + 65) + letter
    i = Math.floor(i / 26) - 1
  }
  return letter
}

function formatCellText(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return String(value)
}

const HALF_WIDTH_CHAR_PX = 6.8
const FULL_WIDTH_CHAR_PX = 13.5
const EXCEL_MDW_PX = 7
const EXCEL_CELL_PADDING_PX = 5

function getLineDisplayWidthPx(line: string): number {
  let widthPx = 0

  for (let index = 0; index < line.length; index += 1) {
    const code = line.charCodeAt(index)

    if (
      (code >= 0x4E00 && code <= 0x9FFF)
      || (code >= 0x3400 && code <= 0x4DBF)
      || (code >= 0xF900 && code <= 0xFAFF)
      || (code >= 0x3000 && code <= 0x303F)
      || (code >= 0xFF00 && code <= 0xFFEF)
    ) {
      widthPx += FULL_WIDTH_CHAR_PX
    }
    else {
      widthPx += HALF_WIDTH_CHAR_PX
    }
  }

  return widthPx
}

function estimateWrappedLines(value: string | number, columnWidth: number): number {
  const text = String(value)
  if (!text) {
    return 1
  }

  const availablePx = Math.max(
    HALF_WIDTH_CHAR_PX,
    columnWidth * EXCEL_MDW_PX - EXCEL_CELL_PADDING_PX,
  )
  return text.split(/\r?\n/).reduce((lines, segment) => {
    const displayWidthPx = getLineDisplayWidthPx(segment)
    return lines + Math.max(1, Math.ceil(displayWidthPx / availablePx))
  }, 0)
}

function estimateRowHeight(
  row: Array<string | number>,
  baseHeight: number,
  extraPadding: number,
): number {
  const maxLines = row.reduce<number>((max, cell, columnIndex) => {
    const colWidth = COLUMN_WIDTHS[columnIndex] ?? 10
    return Math.max(max, estimateWrappedLines(cell, colWidth))
  }, 1)

  if (maxLines <= 1) {
    return baseHeight
  }

  return Math.max(baseHeight, maxLines * 14 + extraPadding)
}

export function buildWorkbook(items: YoumaiFinishedGoodsStockOut[]) {
  const totalWeight = items.reduce((sum, item) => {
    const w = calculateYoumaiWeightKg({
      specification: item.specification,
      specificGravity: item.specific_gravity,
      quantity: item.stock_out_quantity,
    })
    return sum + (w ?? 0)
  }, 0)

  const printDate = dayjs(new Date()).format('YYYY-MM-DD HH:mm')
  const colCount = TABLE_HEADERS.length
  const halfCol = Math.floor(colCount / 2)

  const titleRow = Array.from({ length: colCount }, () => '' as string | number)
  titleRow[0] = TITLE

  const infoRow = Array.from({ length: colCount }, () => '' as string | number)
  infoRow[0] = `重量合计: ${formatNumber(totalWeight, 3)} KG`
  infoRow[halfCol] = `打印日期: ${printDate}`

  const headerRow = [...TABLE_HEADERS] as (string | number)[]

  const bodyRows: (string | number)[][] = items.map((item, index) => {
    const weight = calculateYoumaiWeightKg({
      specification: item.specification,
      specificGravity: item.specific_gravity,
      quantity: item.stock_out_quantity,
    })

    return [
      index + 1,
      formatCellText(item.delivery_date),
      formatCellText(item.purchase_order_no),
      formatCellText(item.purchase_order_line_no),
      formatCellText(item.contract_no),
      formatCellText(item.material_code),
      formatCellText(item.material_name),
      formatCellText(item.model),
      formatCellText(item.specification),
      Number(formatNumber(item.stock_out_quantity, 0)),
      weight === null ? '-' : Number(formatNumber(weight, 3)),
      item.final_stock === null || item.final_stock === undefined
        ? '-'
        : Number(formatNumber(item.final_stock, 0)),
      '',
      '',
    ]
  })

  const data = [titleRow, infoRow, headerRow, ...bodyRows]
  const ws = XLSX.utils.aoa_to_sheet(data)

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: halfCol - 1 } },
    { s: { r: 1, c: halfCol }, e: { r: 1, c: colCount - 1 } },
  ]

  ws['!cols'] = COLUMN_WIDTHS.map(width => ({ width }))
  ws['!margins'] = { ...PRINT_MARGINS }

  const headerRowHeight = estimateRowHeight(
    headerRow,
    BASE_HEADER_ROW_HEIGHT,
    8,
  )
  ws['!rows'] = [
    { hpt: 30, hpx: 30 },
    { hpt: 22, hpx: 22 },
    { hpt: headerRowHeight, hpx: headerRowHeight },
    ...bodyRows.map((row) => {
      const height = estimateRowHeight(row, BASE_BODY_ROW_HEIGHT, 6)
      return { hpt: height, hpx: height }
    }),
  ]

  // 标题
  const titleRef = `${colLetter(0)}1`
  if (ws[titleRef]) {
    ws[titleRef].s = {
      font: { name: '宋体', sz: 18, bold: true },
      alignment: { horizontal: 'center', vertical: 'center' },
    }
  }

  // 信息行
  const weightRef = `${colLetter(0)}2`
  if (ws[weightRef]) {
    ws[weightRef].s = {
      font: { name: '宋体', sz: 11 },
      alignment: { horizontal: 'left', vertical: 'center' },
    }
  }
  const dateRef = `${colLetter(halfCol)}2`
  if (ws[dateRef]) {
    ws[dateRef].s = {
      font: { name: '宋体', sz: 11 },
      alignment: { horizontal: 'right', vertical: 'center' },
    }
  }

  // 表头（第 3 行）
  for (let c = 0; c < colCount; c += 1) {
    const ref = `${colLetter(c)}3`
    if (!ws[ref])
      ws[ref] = { v: '' }
    ws[ref].s = {
      font: { name: '宋体', sz: 10, bold: true },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      fill: { fgColor: { rgb: HEADER_FILL } },
      border: {
        top: { style: 'thin', color: { rgb: BORDER_COLOR } },
        bottom: { style: 'thin', color: { rgb: BORDER_COLOR } },
        left: { style: 'thin', color: { rgb: BORDER_COLOR } },
        right: { style: 'thin', color: { rgb: BORDER_COLOR } },
      },
    }
  }

  // 数据行
  const totalRows = data.length
  for (let r = 3; r < totalRows; r += 1) {
    for (let c = 0; c < colCount; c += 1) {
      const ref = `${colLetter(c)}${r + 1}`
      if (!ws[ref])
        ws[ref] = { v: '' }
      ws[ref].s = {
        font: { name: '宋体', sz: 10 },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: BORDER_COLOR } },
          bottom: { style: 'thin', color: { rgb: BORDER_COLOR } },
          left: { style: 'thin', color: { rgb: BORDER_COLOR } },
          right: { style: 'thin', color: { rgb: BORDER_COLOR } },
        },
      }
    }
  }

  // 数值列格式：数量/库存整数，重量保留 3 位
  const integerColumns = [9, 11]
  for (let r = 3; r < totalRows; r += 1) {
    integerColumns.forEach((c) => {
      const ref = `${colLetter(c)}${r + 1}`
      if (ws[ref] && typeof ws[ref].v === 'number') {
        ws[ref].z = '0'
      }
    })
  }
  const weightColumn = [10]
  for (let r = 3; r < totalRows; r += 1) {
    weightColumn.forEach((c) => {
      const ref = `${colLetter(c)}${r + 1}`
      if (ws[ref] && typeof ws[ref].v === 'number') {
        ws[ref].z = '0.000'
      }
    })
  }

  ws['!freeze'] = { xSplit: 0, ySplit: 3 }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, SHEET_NAME)
  return wb
}

export async function buildWorkbookBuffer(
  items: YoumaiFinishedGoodsStockOut[],
): Promise<ArrayBuffer> {
  const wb = buildWorkbook(items)
  const rawBuffer = XLSX.write(wb, {
    ...EXCEL_WRITE_OPTIONS,
    type: 'array',
    bookType: 'xlsx',
  }) as ArrayBuffer

  return applyExcelPrintSetup(rawBuffer, PRINT_SETUP)
}

export async function exportYoumaiFinishedGoodsStockOutToExcel(
  items: YoumaiFinishedGoodsStockOut[],
) {
  const buffer = await buildWorkbookBuffer(items)
  const filename = `优迈成品出库_${items.length}条_${dayjs(new Date()).format('YYYY-MM-DD_HH-mm-ss')}.xlsx`
  downloadExcelBuffer(buffer, filename)
}
