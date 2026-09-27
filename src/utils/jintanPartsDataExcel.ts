import dayjs from 'dayjs'
import * as XLSX from 'xlsx-js-style'

import type {
  JintanPartsData,
  JintanPartsDataFormValues,
} from '@/services/apiJintanPartsData'
import {
  applyRegisterSheetStyles,
  autoFitColumnWidths,
  centerAllCells,
  EXCEL_WRITE_OPTIONS,
  setRowHeight,
} from '@/utils/excelStyleUtils'

const TEMPLATE_HEADERS = ['名称', '规格', '材质', '采购厂家', '备注'] as const

const TEMPLATE_FILE_NAME = '金檀木业配件资料模板.xlsx'
const TEMPLATE_SHEET_NAME = '配件资料导入模板'

const EXPORT_SHEET_NAME = '配件资料'
const EXPORT_TITLE = '金檀木业配件资料'
const EXPORT_HEADERS = [
  '#',
  '名称',
  '规格',
  '材质',
  '采购厂家',
  '备注',
  '更新时间',
] as const
const EXPORT_COLUMN_WIDTHS = [6, 20, 18, 14, 18, 28, 20]

export interface ParseJintanPartsDataExcelResult {
  rows: JintanPartsDataFormValues[]
  errors: string[]
}

export function downloadJintanPartsDataTemplate() {
  const workbook = XLSX.utils.book_new()
  const worksheetData = [Array.from(TEMPLATE_HEADERS)]
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  autoFitColumnWidths(worksheet, worksheetData)
  setRowHeight(worksheet, 20, worksheetData.length)
  centerAllCells(worksheet, worksheetData)

  XLSX.utils.book_append_sheet(workbook, worksheet, TEMPLATE_SHEET_NAME)
  XLSX.writeFile(workbook, TEMPLATE_FILE_NAME, EXCEL_WRITE_OPTIONS)
}

export function createJintanPartsDataExportWorkbook(
  items: JintanPartsData[],
): XLSX.WorkBook {
  const columnCount = EXPORT_HEADERS.length
  const titleRow = Array.from({ length: columnCount }, () => '')
  titleRow[0] = EXPORT_TITLE

  const bodyRows = items.map((item, index) => [
    index + 1,
    item.part_name,
    item.specification,
    item.material,
    item.supplier,
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

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, EXPORT_SHEET_NAME)
  return workbook
}

export function exportJintanPartsDataToExcel(items: JintanPartsData[]) {
  const workbook = createJintanPartsDataExportWorkbook(items)
  const filename = `金檀木业配件资料_${items.length}条_${dayjs(new Date()).format('YYYY-MM-DD_HH-mm-ss')}.xlsx`
  XLSX.writeFile(workbook, filename, EXCEL_WRITE_OPTIONS)
}

export async function parseJintanPartsDataExcel(
  file: File,
): Promise<ParseJintanPartsDataExcelResult> {
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]

  const rawRows = XLSX.utils.sheet_to_json<Array<string | number | null>>(
    sheet,
    {
      header: 1,
      raw: true,
      defval: '',
      blankrows: true,
    },
  )

  validateTemplateHeaders(rawRows[0])

  const rows: JintanPartsDataFormValues[] = []
  const errors: string[] = []
  const seenKeys = new Set<string>()

  rawRows.slice(1).forEach((cells, index) => {
    const rowNumber = index + 2
    const partName = normalizeText(cells[0])
    const specification = normalizeText(cells[1])
    const material = normalizeText(cells[2])
    const supplier = normalizeText(cells[3])
    const remarks = normalizeText(cells[4])

    const isEmptyRow =
      !partName && !specification && !material && !supplier && !remarks

    if (isEmptyRow) {
      return
    }

    if (!partName) {
      errors.push(`第 ${rowNumber} 行缺少名称`)
      return
    }

    const dedupeKey = `${partName}\u0000${specification}`
    if (seenKeys.has(dedupeKey)) {
      errors.push(
        `第 ${rowNumber} 行名称“${partName}”规格“${specification}”在 Excel 中重复`,
      )
      return
    }

    seenKeys.add(dedupeKey)
    rows.push({
      part_name: partName,
      specification,
      material,
      supplier,
      remarks,
    })
  })

  if (rows.length === 0 && errors.length === 0) {
    throw new Error('Excel 中没有可导入的数据')
  }

  return { rows, errors }
}

function validateTemplateHeaders(
  headerCells: Array<string | number | null> = [],
) {
  const headerRow = headerCells.map((cell) => normalizeText(cell))
  const templateHeaders = Array.from(TEMPLATE_HEADERS)

  const matches = templateHeaders.every(
    (header, index) => headerRow[index] === header,
  )

  if (!matches) {
    throw new Error(
      `模板表头不匹配，请使用「${TEMPLATE_FILE_NAME}」，表头顺序应为：${templateHeaders.join('、')}`,
    )
  }
}

function normalizeText(value: unknown) {
  return String(value ?? '').trim()
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return ''
  }

  const date = dayjs(value)
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm') : value
}
