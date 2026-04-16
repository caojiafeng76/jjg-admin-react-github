import * as XLSX from 'xlsx-js-style'
import type { WorkSheet } from 'xlsx-js-style'

import type { LaborProtectionDataFormValues } from '@/services/apiLaborProtectionData'
import {
  autoFitColumnWidths,
  centerAllCells,
  EXCEL_WRITE_OPTIONS,
  setRowHeight,
} from '@/utils/excelStyleUtils'

const TEMPLATE_HEADERS = ['种类'] as const

type TemplateHeader = (typeof TEMPLATE_HEADERS)[number]

type LaborProtectionDataExcelRow = Record<TemplateHeader, string | number>

export interface ParseLaborProtectionDataExcelResult {
  rows: LaborProtectionDataFormValues[]
  errors: string[]
}

export function downloadLaborProtectionDataTemplate() {
  const workbook = XLSX.utils.book_new()
  const worksheetData = [Array.from(TEMPLATE_HEADERS)]
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  autoFitColumnWidths(worksheet, worksheetData)
  setRowHeight(worksheet, 20, worksheetData.length)
  centerAllCells(worksheet, worksheetData)

  XLSX.utils.book_append_sheet(workbook, worksheet, '劳保资料模板')
  XLSX.writeFile(workbook, '劳保资料导入模板.xlsx', EXCEL_WRITE_OPTIONS)
}

export async function parseLaborProtectionDataExcel(
  file: File,
): Promise<ParseLaborProtectionDataExcelResult> {
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]

  validateTemplateHeaders(sheet)

  const excelRows = XLSX.utils.sheet_to_json<LaborProtectionDataExcelRow>(
    sheet,
    {
      defval: '',
    },
  )

  const rows: LaborProtectionDataFormValues[] = []
  const errors: string[] = []
  const seenCategories = new Set<string>()

  excelRows.forEach((row, index) => {
    const rowNumber = index + 2
    const category = normalizeText(row['种类'])

    if (!category) {
      return
    }

    if (seenCategories.has(category)) {
      errors.push(`第 ${rowNumber} 行劳保种类“${category}”在 Excel 中重复`)
      return
    }

    seenCategories.add(category)
    rows.push({ category })
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
      `模板表头不匹配，请使用“劳保资料导入模板.xlsx”，列顺序应为：${templateHeaders.join('、')}`,
    )
  }
}

function normalizeText(value: unknown) {
  return String(value ?? '').trim()
}
