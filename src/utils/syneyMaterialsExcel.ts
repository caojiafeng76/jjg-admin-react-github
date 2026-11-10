import type {
  SyneyMaterialsData,
  SyneyMaterialsDataFormValues,
} from '@/services/apiSyneyMaterialsData'
import type {
  SyneyMaterialsInventory,
  SyneyMaterialsInventoryImportRow,
} from '@/services/apiSyneyMaterialsInventory'
import type { SyneyMaterialsMonthlyReportRow } from '@/services/apiSyneyMaterialsReport'
import dayjs from 'dayjs'

import * as XLSX from 'xlsx-js-style'
import {
  formatSyneyMaterialsReportMonth,
  sumSyneyMaterialsReportRows,
  SYNEY_MATERIALS_REPORT_QUANTITY_KEYS,
} from '@/features/syney-materials/MonthlyReport/reportUtils'
import {
  applyRegisterSheetStyles,
  autoFitColumnWidths,
  centerAllCells,
  EXCEL_WRITE_OPTIONS,
  setRowHeight,
} from '@/utils/excelStyleUtils'

type Cell = string | number | null
type RawRow = Cell[]

export const SYNEY_MATERIALS_DATA_TEMPLATE_HEADERS = ['品名', '规格', '单位', '备注'] as const
export const SYNEY_MATERIALS_INVENTORY_TEMPLATE_HEADERS = ['品名', '规格', '库存数量', '备注'] as const
export const SYNEY_MATERIALS_REPORT_HEADERS = [
  '#',
  '品名',
  '规格',
  '单位',
  '上月结余',
  '本月入库',
  '本月出库',
  '本月调整',
  '月末结存',
] as const

const DATA_TEMPLATE_FILE_NAME = '西尼材料资料模板.xlsx'
const INVENTORY_TEMPLATE_FILE_NAME = '西尼材料库存模板.xlsx'

export interface ParseExcelResult<T> {
  rows: T[]
  errors: string[]
}

function normalizeText(value: unknown) {
  return String(value ?? '').trim()
}

function formatDateTime(value: string | null | undefined) {
  if (!value)
    return ''
  const date = dayjs(value)
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm') : value
}

function timestamp() {
  return dayjs().format('YYYY-MM-DD_HH-mm-ss')
}

function downloadTemplate(
  headers: readonly string[],
  sheetName: string,
  fileName: string,
) {
  const workbook = XLSX.utils.book_new()
  const worksheetData = [Array.from(headers)]
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  autoFitColumnWidths(worksheet, worksheetData)
  setRowHeight(worksheet, 20, worksheetData.length)
  centerAllCells(worksheet, worksheetData)

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, fileName, EXCEL_WRITE_OPTIONS)
}

/** 标题行 + 表头 + 数据（+ 可选合计行）的登记表样式工作表 */
function createRegisterSheet(
  title: string,
  headers: readonly string[],
  bodyRows: Cell[][],
  columnWidths: number[],
  totalRow?: Cell[],
  totalLabelColumnCount = 1,
): XLSX.WorkSheet {
  const columnCount = headers.length
  const titleRow: Cell[] = Array.from({ length: columnCount }, () => '')
  titleRow[0] = title

  const worksheetData: Cell[][] = [titleRow, Array.from(headers), ...bodyRows]
  if (totalRow)
    worksheetData.push(totalRow)

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
  const merges = [{ s: { r: 0, c: 0 }, e: { r: 0, c: columnCount - 1 } }]
  const totalRowIndex = worksheetData.length - 1
  if (totalRow) {
    merges.push({
      s: { r: totalRowIndex, c: 0 },
      e: { r: totalRowIndex, c: totalLabelColumnCount - 1 },
    })
  }
  worksheet['!merges'] = merges

  applyRegisterSheetStyles(worksheet, worksheetData, {
    columnWidths,
    freezeYSplit: 2,
  })

  if (totalRow) {
    for (let col = 0; col < columnCount; col += 1) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: totalRowIndex, c: col })]
      if (cell)
        cell.s = { ...cell.s, font: { ...cell.s?.font, bold: true } }
    }
  }

  return worksheet
}

function writeWorkbook(sheet: XLSX.WorkSheet, sheetName: string, fileName: string) {
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName)
  XLSX.writeFile(workbook, fileName, EXCEL_WRITE_OPTIONS)
}

async function readRawRows(file: File): Promise<RawRow[]> {
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils.sheet_to_json<RawRow>(sheet, {
    header: 1,
    raw: true,
    defval: '',
    blankrows: true,
  })
}

function validateHeaders(
  headerCells: RawRow = [],
  headers: readonly string[],
  templateFileName: string,
) {
  const headerRow = headerCells.map(cell => normalizeText(cell))
  if (!headers.every((header, index) => headerRow[index] === header)) {
    throw new Error(
      `模板表头不匹配，请使用「${templateFileName}」，表头顺序应为：${headers.join('、')}`,
    )
  }
}

// ---------------------------------------------------------------
// 材料资料
// ---------------------------------------------------------------

export function downloadSyneyMaterialsDataTemplate() {
  downloadTemplate(
    SYNEY_MATERIALS_DATA_TEMPLATE_HEADERS,
    '材料资料导入模板',
    DATA_TEMPLATE_FILE_NAME,
  )
}

export function createSyneyMaterialsDataExportSheet(items: SyneyMaterialsData[]) {
  return createRegisterSheet(
    '西尼材料资料',
    ['#', '品名', '规格', '单位', '备注', '更新时间'],
    items.map((item, index) => [
      index + 1,
      item.material_name,
      item.specification,
      item.unit,
      item.remarks,
      formatDateTime(item.updated_at),
    ]),
    [6, 24, 20, 8, 28, 20],
  )
}

export function exportSyneyMaterialsDataToExcel(items: SyneyMaterialsData[]) {
  writeWorkbook(
    createSyneyMaterialsDataExportSheet(items),
    '材料资料',
    `西尼材料资料_${items.length}条_${timestamp()}.xlsx`,
  )
}

export async function parseSyneyMaterialsDataExcel(
  file: File,
): Promise<ParseExcelResult<SyneyMaterialsDataFormValues>> {
  const rawRows = await readRawRows(file)
  validateHeaders(rawRows[0], SYNEY_MATERIALS_DATA_TEMPLATE_HEADERS, DATA_TEMPLATE_FILE_NAME)

  const rows: SyneyMaterialsDataFormValues[] = []
  const errors: string[] = []
  const seenKeys = new Set<string>()

  rawRows.slice(1).forEach((cells, index) => {
    const rowNumber = index + 2
    const materialName = normalizeText(cells[0])
    const specification = normalizeText(cells[1])
    const unit = normalizeText(cells[2])
    const remarks = normalizeText(cells[3])

    if (!materialName && !specification && !unit && !remarks)
      return

    if (!materialName) {
      errors.push(`第 ${rowNumber} 行缺少品名`)
      return
    }
    if (!unit) {
      errors.push(`第 ${rowNumber} 行缺少单位`)
      return
    }

    const key = `${materialName}\u0000${specification}`
    if (seenKeys.has(key)) {
      errors.push(`第 ${rowNumber} 行品名“${materialName}”规格“${specification}”在 Excel 中重复`)
      return
    }
    seenKeys.add(key)
    rows.push({ material_name: materialName, specification, unit, remarks })
  })

  if (rows.length === 0 && errors.length === 0)
    throw new Error('Excel 中没有可导入的数据')

  return { rows, errors }
}

// ---------------------------------------------------------------
// 材料库存
// ---------------------------------------------------------------

export function downloadSyneyMaterialsInventoryTemplate() {
  downloadTemplate(
    SYNEY_MATERIALS_INVENTORY_TEMPLATE_HEADERS,
    '材料库存导入模板',
    INVENTORY_TEMPLATE_FILE_NAME,
  )
}

export function createSyneyMaterialsInventoryExportSheet(
  items: SyneyMaterialsInventory[],
) {
  return createRegisterSheet(
    '西尼材料库存',
    ['#', '品名', '规格', '单位', '库存数量', '备注', '更新时间'],
    items.map((item, index) => [
      index + 1,
      item.material_name,
      item.specification,
      item.unit,
      item.quantity,
      item.remarks,
      formatDateTime(item.updated_at),
    ]),
    [6, 24, 20, 8, 12, 28, 20],
  )
}

export function exportSyneyMaterialsInventoryToExcel(
  items: SyneyMaterialsInventory[],
) {
  writeWorkbook(
    createSyneyMaterialsInventoryExportSheet(items),
    '材料库存',
    `西尼材料库存_${items.length}条_${timestamp()}.xlsx`,
  )
}

function parseQuantity(value: unknown): number | null {
  const text = normalizeText(value)
  if (!text)
    return null
  const quantity = Number(text)
  return Number.isSafeInteger(quantity) && quantity >= 0 ? quantity : null
}

export async function parseSyneyMaterialsInventoryExcel(
  file: File,
): Promise<ParseExcelResult<SyneyMaterialsInventoryImportRow>> {
  const rawRows = await readRawRows(file)
  validateHeaders(
    rawRows[0],
    SYNEY_MATERIALS_INVENTORY_TEMPLATE_HEADERS,
    INVENTORY_TEMPLATE_FILE_NAME,
  )

  const rows: SyneyMaterialsInventoryImportRow[] = []
  const errors: string[] = []
  const seenKeys = new Set<string>()

  rawRows.slice(1).forEach((cells, index) => {
    const rowNumber = index + 2
    const materialName = normalizeText(cells[0])
    const specification = normalizeText(cells[1])
    const quantityText = normalizeText(cells[2])
    const remarks = normalizeText(cells[3])

    if (!materialName && !specification && !quantityText && !remarks)
      return

    if (!materialName) {
      errors.push(`第 ${rowNumber} 行缺少品名`)
      return
    }

    const quantity = parseQuantity(cells[2])
    if (quantity === null) {
      errors.push(`第 ${rowNumber} 行库存数量必须为非负整数`)
      return
    }

    const key = `${materialName}\u0000${specification}`
    if (seenKeys.has(key)) {
      errors.push(`第 ${rowNumber} 行品名“${materialName}”规格“${specification}”在 Excel 中重复`)
      return
    }
    seenKeys.add(key)
    rows.push({ material_name: materialName, specification, quantity, remarks })
  })

  if (rows.length === 0 && errors.length === 0)
    throw new Error('Excel 中没有可导入的数据')

  return { rows, errors }
}

// ---------------------------------------------------------------
// 月度报表
// ---------------------------------------------------------------

/** 合计行合并到「单位」列，后面是数量列 */
const REPORT_TOTAL_LABEL_COLUMN_COUNT = SYNEY_MATERIALS_REPORT_HEADERS.indexOf('单位') + 1

export function createSyneyMaterialsReportSheet(
  rows: SyneyMaterialsMonthlyReportRow[],
  month: string,
) {
  return createRegisterSheet(
    `西尼材料月度库存报表（${formatSyneyMaterialsReportMonth(month)}）`,
    SYNEY_MATERIALS_REPORT_HEADERS,
    rows.map((row, index) => [
      index + 1,
      row.material_name,
      row.specification,
      row.unit,
      ...SYNEY_MATERIALS_REPORT_QUANTITY_KEYS.map(key => row[key]),
    ]),
    [6, 24, 20, 8, 12, 12, 12, 12, 12],
    [
      '合计',
      ...Array.from({ length: REPORT_TOTAL_LABEL_COLUMN_COUNT - 1 }, () => ''),
      ...sumSyneyMaterialsReportRows(rows),
    ],
    REPORT_TOTAL_LABEL_COLUMN_COUNT,
  )
}

export function exportSyneyMaterialsReportToExcel(
  rows: SyneyMaterialsMonthlyReportRow[],
  month: string,
) {
  writeWorkbook(
    createSyneyMaterialsReportSheet(rows, month),
    '材料月度报表',
    `西尼材料月度库存报表_${month}_${timestamp()}.xlsx`,
  )
}
