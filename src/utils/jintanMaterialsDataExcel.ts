import dayjs from 'dayjs'
import * as XLSX from 'xlsx-js-style'

import type {
  JintanMaterialsData,
  JintanMaterialsDataFormValues,
} from '@/services/apiJintanMaterialsData'
import {
  applyRegisterSheetStyles,
  autoFitColumnWidths,
  centerAllCells,
  EXCEL_WRITE_OPTIONS,
  setRowHeight,
} from '@/utils/excelStyleUtils'

const TEMPLATE_HEADERS = ['型号', '名称', '规格', '材质', '备注'] as const

const TEMPLATE_FILE_NAME = '金檀木业素材资料模板.xlsx'
const TEMPLATE_SHEET_NAME = '素材资料导入模板'

const EXPORT_SHEET_NAME = '素材资料'
const EXPORT_TITLE = '金檀木业素材资料'
const EXPORT_HEADERS = [
  '#',
  '型号',
  '名称',
  '规格',
  '材质',
  '备注',
  '更新时间',
] as const
const EXPORT_COLUMN_WIDTHS = [6, 16, 20, 18, 14, 28, 20]

export interface ParseJintanMaterialsDataExcelResult {
  rows: JintanMaterialsDataFormValues[]
  errors: string[]
}

export function downloadJintanMaterialsDataTemplate() {
  const workbook = XLSX.utils.book_new()
  const worksheetData = [Array.from(TEMPLATE_HEADERS)]
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  autoFitColumnWidths(worksheet, worksheetData)
  setRowHeight(worksheet, 20, worksheetData.length)
  centerAllCells(worksheet, worksheetData)

  XLSX.utils.book_append_sheet(workbook, worksheet, TEMPLATE_SHEET_NAME)
  XLSX.writeFile(workbook, TEMPLATE_FILE_NAME, EXCEL_WRITE_OPTIONS)
}

export function createJintanMaterialsDataExportWorkbook(
  items: JintanMaterialsData[],
): XLSX.WorkBook {
  const columnCount = EXPORT_HEADERS.length
  const titleRow = Array.from({ length: columnCount }, () => '')
  titleRow[0] = EXPORT_TITLE

  const bodyRows = items.map((item, index) => [
    index + 1,
    item.material_model,
    item.material_name,
    item.specification,
    item.material,
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

export function exportJintanMaterialsDataToExcel(items: JintanMaterialsData[]) {
  const workbook = createJintanMaterialsDataExportWorkbook(items)
  const filename = `金檀木业素材资料_${items.length}条_${dayjs(new Date()).format('YYYY-MM-DD_HH-mm-ss')}.xlsx`
  XLSX.writeFile(workbook, filename, EXCEL_WRITE_OPTIONS)
}

export async function parseJintanMaterialsDataExcel(
  file: File,
): Promise<ParseJintanMaterialsDataExcelResult> {
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

  const rows: JintanMaterialsDataFormValues[] = []
  const errors: string[] = []
  const seenKeys = new Set<string>()

  rawRows.slice(1).forEach((cells, index) => {
    const rowNumber = index + 2
    const profileModel = normalizeText(cells[0])
    const profileName = normalizeText(cells[1])
    const specification = normalizeText(cells[2])
    const material = normalizeText(cells[3])
    const remarks = normalizeText(cells[4])

    const isEmptyRow =
      !profileModel && !profileName && !specification && !material && !remarks

    if (isEmptyRow) {
      return
    }

    if (!profileName) {
      errors.push(`第 ${rowNumber} 行缺少名称`)
      return
    }

    const dedupeKey = `${profileModel}\u0000${profileName}\u0000${specification}`
    if (seenKeys.has(dedupeKey)) {
      errors.push(
        `第 ${rowNumber} 行型号“${profileModel}”名称“${profileName}”规格“${specification}”在 Excel 中重复`,
      )
      return
    }

    seenKeys.add(dedupeKey)
    rows.push({
      material_model: profileModel,
      material_name: profileName,
      specification,
      material,
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
