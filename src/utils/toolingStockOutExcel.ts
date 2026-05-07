import dayjs from 'dayjs'
import * as XLSX from 'xlsx-js-style'
import type { WorkSheet } from 'xlsx-js-style'

import type { ToolingStockOutImportRow } from '@/services/apiToolingStockOut'
import {
  autoFitColumnWidths,
  centerAllCells,
  EXCEL_WRITE_OPTIONS,
  setRowHeight,
} from '@/utils/excelStyleUtils'

const TEMPLATE_HEADERS = [
  '刀具编号',
  '刀具名称',
  '领用人',
  '用途',
  '出库日期',
  '出库数量',
  '领用方式',
  '备注',
] as const

const REQUIRED_HEADERS = [
  '刀具编号',
  '领用人',
  '用途',
  '出库日期',
  '出库数量',
] as const

type TemplateHeader = (typeof TEMPLATE_HEADERS)[number]

type ToolingStockOutExcelRow = Record<TemplateHeader, string | number>

export interface ParseToolingStockOutExcelResult {
  rows: ToolingStockOutImportRow[]
  errors: string[]
}

export function downloadToolingStockOutTemplate() {
  const workbook = XLSX.utils.book_new()
  const worksheetData = [Array.from(TEMPLATE_HEADERS)]
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  autoFitColumnWidths(worksheet, worksheetData)
  setRowHeight(worksheet, 20, worksheetData.length)
  centerAllCells(worksheet, worksheetData)

  XLSX.utils.book_append_sheet(workbook, worksheet, '刀具出库模板')
  XLSX.writeFile(workbook, '刀具出库导入模板.xlsx', EXCEL_WRITE_OPTIONS)
}

export async function parseToolingStockOutExcel(
  file: File,
): Promise<ParseToolingStockOutExcelResult> {
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]

  validateRequiredHeaders(sheet)

  const excelRows = XLSX.utils.sheet_to_json<ToolingStockOutExcelRow>(sheet, {
    defval: '',
    raw: true,
  })

  const rows: ToolingStockOutImportRow[] = []
  const errors: string[] = []

  excelRows.forEach((row, index) => {
    const rowNumber = index + 2
    const toolCode = normalizeText(row['刀具编号'])
    const toolName = normalizeText(row['刀具名称'])
    const recipient = normalizeText(row['领用人'])
    const purpose = normalizeText(row['用途'])
    const stockOutDate = normalizeDate(row['出库日期'])
    const stockOutQuantity = normalizeNumber(row['出库数量'])
    const collectionMethod = normalizeText(row['领用方式']) || '新领取'
    const remarks = normalizeText(row['备注'])

    const isEmptyRow =
      !toolCode &&
      !recipient &&
      !purpose &&
      !row['出库日期'] &&
      row['出库数量'] === '' &&
      !remarks

    if (isEmptyRow) {
      return
    }

    if (!toolCode) {
      errors.push(`第 ${rowNumber} 行缺少刀具编号`)
      return
    }

    if (!recipient) {
      errors.push(`第 ${rowNumber} 行缺少领用人`)
      return
    }

    if (!purpose) {
      errors.push(`第 ${rowNumber} 行缺少用途`)
      return
    }

    if (!stockOutDate) {
      errors.push(`第 ${rowNumber} 行出库日期格式无效`)
      return
    }

    if (
      stockOutQuantity === null ||
      Number.isNaN(stockOutQuantity) ||
      stockOutQuantity <= 0
    ) {
      errors.push(`第 ${rowNumber} 行出库数量格式无效，需为大于 0 的数字`)
      return
    }

    rows.push({
      tool_code: toolCode,
      tool_name: toolName,
      recipient,
      purpose,
      stock_out_date: stockOutDate,
      stock_out_quantity: stockOutQuantity,
      collection_method: collectionMethod,
      remarks,
    })
  })

  if (rows.length === 0 && errors.length === 0) {
    throw new Error('Excel 中没有可导入的刀具出库数据')
  }

  return { rows, errors }
}

function validateRequiredHeaders(sheet: WorkSheet) {
  const rows = XLSX.utils.sheet_to_json<Array<string | number | null>>(sheet, {
    header: 1,
    raw: true,
    blankrows: false,
  })

  const headerRow = new Set((rows[0] || []).map((cell) => normalizeText(cell)))
  const missingHeaders = REQUIRED_HEADERS.filter(
    (header) => !headerRow.has(header),
  )

  if (missingHeaders.length > 0) {
    throw new Error(
      `Excel 缺少必要列：${missingHeaders.join('、')}。请使用“刀具出库导入模板.xlsx”。`,
    )
  }
}

function normalizeText(value: unknown) {
  return String(value ?? '').trim()
}

function normalizeNumber(value: unknown) {
  if (typeof value === 'number') {
    return value
  }

  const normalized = normalizeText(value)
  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function normalizeDate(value: unknown) {
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value)

    if (!parsed) {
      return null
    }

    return dayjs(`${parsed.y}-${parsed.m}-${parsed.d}`).format('YYYY-MM-DD')
  }

  const normalized = normalizeText(value)
  if (!normalized) {
    return null
  }

  const parsed = dayjs(normalized)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null
}
