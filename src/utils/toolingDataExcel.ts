import dayjs from 'dayjs'
import * as XLSX from 'xlsx-js-style'
import type { WorkSheet } from 'xlsx-js-style'

import type {
  ToolingData,
  ToolingDataFormValues,
  ToolingDataMonthlySummary,
} from '@/services/apiToolingData'
import {
  applyRegisterSheetStyles,
  autoFitColumnWidths,
  centerAllCells,
  EXCEL_WRITE_OPTIONS,
  setColumnWidths,
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
const MONTHLY_SUMMARY_SHEET_NAME = '刀具资料'
const MONTHLY_SUMMARY_HEADERS = [
  '#',
  '刀具编号',
  '刀具名称',
  '刀具规格',
  '材质',
  '单价（元）',
  '用途',
  '数量',
  '金额',
  '数量',
  '金额',
  '数量',
  '金额',
  '数量',
  '金额',
  '备注',
  '更新时间',
] as const
const MONTHLY_SUMMARY_COLUMN_WIDTHS = [
  4, 11, 10, 17, 11, 12, 12, 7, 7, 7, 7, 7, 7, 7, 7, 16, 16,
]
const MONTHLY_SUMMARY_GROUP_HEADERS = [
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '上次盘点',
  '',
  '入库',
  '',
  '出库',
  '',
  '结余',
  '',
  '',
  '',
] as const
const MONTHLY_SUMMARY_QUANTITY_COLUMNS = [7, 9, 11, 13] as const
const MONTHLY_SUMMARY_AMOUNT_COLUMNS = [8, 10, 12, 14] as const

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

export function createToolingDataMonthlySummaryWorkbook(
  items: ToolingDataMonthlySummary[],
  month: string,
): XLSX.WorkBook {
  const columnCount = MONTHLY_SUMMARY_HEADERS.length
  const titleRow = Array.from({ length: columnCount }, () => '')
  titleRow[0] = getMonthlySummaryTitle(month)

  const bodyRows = items.map((item, index) => [
    index + 1,
    item.tool_code,
    item.tool_name,
    item.tool_spec,
    item.material,
    Number(item.unit_price || 0),
    item.usage,
    item.opening_quantity,
    null,
    item.stock_in_quantity,
    null,
    item.stock_out_quantity,
    null,
    item.closing_quantity,
    null,
    item.remarks,
    formatDateTime(item.updated_at),
  ])

  const totalRow: Array<string | number | null> = Array.from(
    { length: columnCount },
    () => null,
  )
  totalRow[6] = '合计'

  const worksheetData = [
    titleRow,
    Array.from(MONTHLY_SUMMARY_GROUP_HEADERS),
    Array.from(MONTHLY_SUMMARY_HEADERS),
    ...bodyRows,
    totalRow,
  ]
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: columnCount - 1 } },
    { s: { r: 1, c: 7 }, e: { r: 1, c: 8 } },
    { s: { r: 1, c: 9 }, e: { r: 1, c: 10 } },
    { s: { r: 1, c: 11 }, e: { r: 1, c: 12 } },
    { s: { r: 1, c: 13 }, e: { r: 1, c: 14 } },
  ]

  applyMonthlySummaryStyles(worksheet, worksheetData)
  applyMonthlySummaryFormulas(worksheet, items)

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, MONTHLY_SUMMARY_SHEET_NAME)
  return workbook
}

export function exportToolingDataMonthlySummaryToExcel(
  items: ToolingDataMonthlySummary[],
  month: string,
) {
  const workbook = createToolingDataMonthlySummaryWorkbook(items, month)
  const filename = `刀具月度汇总_${formatMonthlySummaryFilenameMonth(month)}_${dayjs(new Date()).format('YYYY-MM-DD_HH-mm-ss')}.xlsx`
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

function applyMonthlySummaryStyles(
  worksheet: WorkSheet,
  data: Array<Array<string | number | null | undefined>>,
) {
  const rowCount = data.length
  const columnCount = MONTHLY_SUMMARY_HEADERS.length
  const totalRowIndex = rowCount - 1
  const borderColor = '000000'

  setColumnWidths(worksheet, MONTHLY_SUMMARY_COLUMN_WIDTHS)

  worksheet['!rows'] = [
    { hpt: 34, hpx: 34 },
    { hpt: 34, hpx: 34 },
    { hpt: 28, hpx: 28 },
    ...Array.from({ length: rowCount - 3 }, () => ({ hpt: 26, hpx: 26 })),
  ]

  for (let row = 0; row < rowCount; row += 1) {
    for (let column = 0; column < columnCount; column += 1) {
      const cellRef = `${columnIndexToLetter(column)}${row + 1}`

      if (!worksheet[cellRef]) {
        worksheet[cellRef] = { v: '' }
      }

      worksheet[cellRef].s = {
        ...(worksheet[cellRef].s || {}),
        font: {
          ...(worksheet[cellRef].s?.font || {}),
          name: '宋体',
          sz: row === 0 ? 16 : 10.5,
          bold: row <= 2 || row === totalRowIndex,
        },
        alignment: {
          ...(worksheet[cellRef].s?.alignment || {}),
          horizontal: 'center',
          vertical: 'center',
          wrapText: true,
        },
        fill: {
          fgColor: {
            rgb: row === 2 ? 'D8E4F1' : 'FFFFFF',
          },
        },
        border: {
          top: { style: 'thin', color: { rgb: borderColor } },
          bottom: { style: 'thin', color: { rgb: borderColor } },
          left: { style: 'thin', color: { rgb: borderColor } },
          right: { style: 'thin', color: { rgb: borderColor } },
        },
      }
    }
  }

  worksheet['!freeze'] = { xSplit: 0, ySplit: 3 }
}

function applyMonthlySummaryFormulas(
  worksheet: WorkSheet,
  items: ToolingDataMonthlySummary[],
) {
  const firstBodyRowNumber = 4
  const lastBodyRowNumber = firstBodyRowNumber + items.length - 1
  const totalRowNumber = firstBodyRowNumber + items.length

  items.forEach((item, index) => {
    const rowNumber = firstBodyRowNumber + index

    setQuantityCell(worksheet, `H${rowNumber}`, item.opening_quantity)
    setAmountFormulaCell(worksheet, `I${rowNumber}`, `H${rowNumber}`, item)
    setQuantityCell(worksheet, `J${rowNumber}`, item.stock_in_quantity)
    setAmountFormulaCell(worksheet, `K${rowNumber}`, `J${rowNumber}`, item)
    setQuantityCell(worksheet, `L${rowNumber}`, item.stock_out_quantity)
    setAmountFormulaCell(worksheet, `M${rowNumber}`, `L${rowNumber}`, item)
    setQuantityCell(
      worksheet,
      `N${rowNumber}`,
      item.closing_quantity,
      `H${rowNumber}+J${rowNumber}-L${rowNumber}`,
    )
    setAmountFormulaCell(worksheet, `O${rowNumber}`, `N${rowNumber}`, item)

    const unitPriceRef = `F${rowNumber}`
    if (
      worksheet[unitPriceRef] &&
      typeof worksheet[unitPriceRef].v === 'number'
    ) {
      worksheet[unitPriceRef].z = '0.00'
    }
  })

  MONTHLY_SUMMARY_QUANTITY_COLUMNS.forEach((column) => {
    setTotalFormulaCell(
      worksheet,
      column,
      totalRowNumber,
      firstBodyRowNumber,
      lastBodyRowNumber,
      items,
      '0.###',
    )
  })

  MONTHLY_SUMMARY_AMOUNT_COLUMNS.forEach((column) => {
    setTotalFormulaCell(
      worksheet,
      column,
      totalRowNumber,
      firstBodyRowNumber,
      lastBodyRowNumber,
      items,
      '0.00',
    )
  })
}

function setQuantityCell(
  worksheet: WorkSheet,
  cellRef: string,
  value: number,
  formula?: string,
) {
  worksheet[cellRef] = {
    ...(worksheet[cellRef] || {}),
    t: 'n',
    v: roundNumber(value, 3),
    ...(formula ? { f: formula } : {}),
    z: '0.###;-0.###;;@',
  }
}

function setAmountFormulaCell(
  worksheet: WorkSheet,
  cellRef: string,
  quantityCellRef: string,
  item: ToolingDataMonthlySummary,
) {
  const quantity = Number(worksheet[quantityCellRef]?.v || 0)
  worksheet[cellRef] = {
    ...(worksheet[cellRef] || {}),
    t: 'n',
    v: roundNumber(quantity * Number(item.unit_price || 0), 2),
    f: `${quantityCellRef}*$F${cellRef.replace(/^[A-Z]+/, '')}`,
    z: '0.00;-0.00;;@',
  }
}

function setTotalFormulaCell(
  worksheet: WorkSheet,
  column: number,
  totalRowNumber: number,
  firstBodyRowNumber: number,
  lastBodyRowNumber: number,
  items: ToolingDataMonthlySummary[],
  numberFormat: string,
) {
  const columnLetter = columnIndexToLetter(column)
  const cellRef = `${columnLetter}${totalRowNumber}`
  const totalValue = items.reduce((sum, item) => {
    if (column === 7) return sum + item.opening_quantity
    if (column === 8) return sum + item.opening_quantity * item.unit_price
    if (column === 9) return sum + item.stock_in_quantity
    if (column === 10) return sum + item.stock_in_quantity * item.unit_price
    if (column === 11) return sum + item.stock_out_quantity
    if (column === 12) return sum + item.stock_out_quantity * item.unit_price
    if (column === 13) return sum + item.closing_quantity
    if (column === 14) return sum + item.closing_quantity * item.unit_price
    return sum
  }, 0)

  worksheet[cellRef] = {
    ...(worksheet[cellRef] || {}),
    t: 'n',
    v: roundNumber(totalValue, numberFormat === '0.00' ? 2 : 3),
    ...(items.length > 0
      ? {
          f: `SUM(${columnLetter}${firstBodyRowNumber}:${columnLetter}${lastBodyRowNumber})`,
        }
      : {}),
    z: numberFormat,
  }
}

function columnIndexToLetter(index: number) {
  let letter = ''
  let currentIndex = index

  while (currentIndex >= 0) {
    letter = String.fromCharCode((currentIndex % 26) + 65) + letter
    currentIndex = Math.floor(currentIndex / 26) - 1
  }

  return letter
}

function roundNumber(value: number, digits: number) {
  return Number(value.toFixed(digits))
}

function getMonthlySummaryTitle(month: string) {
  const date = dayjs(`${month}-01`)
  return `${date.month() + 1}月份刀具汇总明细表`
}

function formatMonthlySummaryFilenameMonth(month: string) {
  const date = dayjs(`${month}-01`)
  return date.isValid() ? date.format('YYYY年M月份') : month
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
