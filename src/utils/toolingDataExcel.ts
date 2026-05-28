import dayjs from 'dayjs'
import * as XLSX from 'xlsx-js-style'
import type { WorkSheet } from 'xlsx-js-style'

import type {
  ToolingData,
  ToolingDataFormValues,
} from '@/services/apiToolingData'
import {
  applyRegisterSheetStyles,
  autoFitColumnWidths,
  centerAllCells,
  EXCEL_WRITE_OPTIONS,
  setRowHeight,
} from '@/utils/excelStyleUtils'

const TEMPLATE_HEADERS = [
  '刀具编号',
  '刀具名称',
  '刀具规格',
  '材质',
  '单价',
  '用途',
  '备注',
] as const

const EXPORT_SHEET_NAME = '刀具资料'
const EXPORT_TITLE = '刀具资料'
const EXPORT_HEADERS = [
  '#',
  '刀具编号',
  '刀具名称',
  '刀具规格',
  '材质',
  '单价（元）',
  '用途',
  '备注',
  '更新时间',
] as const
const EXPORT_COLUMN_WIDTHS = [6, 16, 18, 20, 14, 12, 28, 32, 20]

type TemplateHeader = (typeof TEMPLATE_HEADERS)[number]

type ToolingDataExcelRow = Record<TemplateHeader, string | number>

export interface ParseToolingDataExcelResult {
  rows: ToolingDataFormValues[]
  errors: string[]
}

export function downloadToolingDataTemplate() {
  const workbook = XLSX.utils.book_new()
  const worksheetData = [Array.from(TEMPLATE_HEADERS)]
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  autoFitColumnWidths(worksheet, worksheetData)
  setRowHeight(worksheet, 20, worksheetData.length)
  centerAllCells(worksheet, worksheetData)

  XLSX.utils.book_append_sheet(workbook, worksheet, '刀具资料模板')
  XLSX.writeFile(workbook, '刀具资料导入模板.xlsx', EXCEL_WRITE_OPTIONS)
}

export function createToolingDataExportWorkbook(
  items: ToolingData[],
): XLSX.WorkBook {
  const columnCount = EXPORT_HEADERS.length
  const titleRow = Array.from({ length: columnCount }, () => '')
  titleRow[0] = EXPORT_TITLE

  const bodyRows = items.map((item, index) => [
    index + 1,
    item.tool_code,
    item.tool_name,
    item.tool_spec,
    item.material,
    Number(item.unit_price || 0),
    item.usage,
    item.remarks,
    formatDateTime(item.updated_at),
  ])

  const worksheetData = [titleRow, Array.from(EXPORT_HEADERS), ...bodyRows]
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: columnCount - 1 } },
  ]

  applyRegisterSheetStyles(worksheet, worksheetData, {
    columnWidths: EXPORT_COLUMN_WIDTHS,
    freezeYSplit: 2,
  })

  for (let rowIndex = 2; rowIndex < worksheetData.length; rowIndex += 1) {
    const unitPriceRef = `F${rowIndex + 1}`
    if (
      worksheet[unitPriceRef] &&
      typeof worksheet[unitPriceRef].v === 'number'
    ) {
      worksheet[unitPriceRef].z = '0.00'
    }
  }

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, EXPORT_SHEET_NAME)
  return workbook
}

export function exportToolingDataToExcel(items: ToolingData[]) {
  const workbook = createToolingDataExportWorkbook(items)
  const filename = `刀具资料_${items.length}条_${dayjs(new Date()).format('YYYY-MM-DD_HH-mm-ss')}.xlsx`
  XLSX.writeFile(workbook, filename, EXCEL_WRITE_OPTIONS)
}

export async function parseToolingDataExcel(
  file: File,
): Promise<ParseToolingDataExcelResult> {
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]

  validateTemplateHeaders(sheet)

  const excelRows = XLSX.utils.sheet_to_json<ToolingDataExcelRow>(sheet, {
    defval: '',
  })

  const rows: ToolingDataFormValues[] = []
  const errors: string[] = []
  const seenToolCodes = new Set<string>()

  excelRows.forEach((row, index) => {
    const rowNumber = index + 2
    const toolCode = normalizeText(row['刀具编号'])
    const toolName = normalizeText(row['刀具名称'])
    const toolSpec = normalizeText(row['刀具规格'])
    const material = normalizeText(row['材质'])
    const unitPrice = normalizeNumber(row['单价'])
    const usage = normalizeText(row['用途'])
    const remarks = normalizeText(row['备注'])

    const isEmptyRow =
      !toolCode &&
      !toolName &&
      !toolSpec &&
      !material &&
      !usage &&
      !remarks &&
      row['单价'] === ''

    if (isEmptyRow) {
      return
    }

    if (!toolCode) {
      errors.push(`第 ${rowNumber} 行缺少刀具编号`)
      return
    }

    if (seenToolCodes.has(toolCode)) {
      errors.push(`第 ${rowNumber} 行刀具编号“${toolCode}”在 Excel 中重复`)
      return
    }

    if (!toolName || !toolSpec || !material || !usage || !remarks) {
      errors.push(
        `第 ${rowNumber} 行存在必填项为空，请检查名称/规格/材质/用途/备注`,
      )
      return
    }

    if (unitPrice === null || Number.isNaN(unitPrice) || unitPrice < 0) {
      errors.push(`第 ${rowNumber} 行单价格式无效，需为大于等于 0 的数字`)
      return
    }

    seenToolCodes.add(toolCode)
    rows.push({
      tool_code: toolCode,
      tool_name: toolName,
      tool_spec: toolSpec,
      material,
      unit_price: unitPrice,
      usage,
      remarks,
    })
  })

  if (rows.length === 0 && errors.length === 0) {
    throw new Error('Excel 中没有可导入的数据')
  }

  return { rows, errors }
}

function validateTemplateHeaders(sheet: WorkSheet) {
  const rows = XLSX.utils.sheet_to_json<Array<string | number | null>>(sheet, {
    header: 1,
    raw: true,
    blankrows: false,
  })

  const headerRow = (rows[0] || []).map((cell) => normalizeText(cell))
  const templateHeaders = Array.from(TEMPLATE_HEADERS)

  const matches = templateHeaders.every(
    (header, index) => headerRow[index] === header,
  )

  if (!matches) {
    throw new Error(
      `模板表头不匹配，请使用“刀具资料导入模板.xlsx”，列顺序应为：${templateHeaders.join('、')}`,
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

  const normalized = String(value ?? '').trim()
  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return ''
  }

  const date = dayjs(value)
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm') : value
}
