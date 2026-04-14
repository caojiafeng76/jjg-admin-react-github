import * as XLSX from 'xlsx-js-style'
import type { WorkSheet } from 'xlsx-js-style'

import type { YoumaiFinishedGoodsInventoryImportRow } from '@/services/apiYoumaiFinishedGoodsInventory'
import {
  autoFitColumnWidths,
  centerAllCells,
  EXCEL_WRITE_OPTIONS,
  setRowHeight,
} from '@/utils/excelStyleUtils'

const TEMPLATE_HEADERS = ['物料编码', '现有库存', '备注'] as const

type TemplateHeader = (typeof TEMPLATE_HEADERS)[number]

type YoumaiFinishedGoodsInventoryExcelRow = Record<
  TemplateHeader,
  string | number
>

export interface ParseYoumaiFinishedGoodsInventoryExcelResult {
  rows: YoumaiFinishedGoodsInventoryImportRow[]
  errors: string[]
}

export function downloadYoumaiFinishedGoodsInventoryTemplate() {
  const workbook = XLSX.utils.book_new()
  const worksheetData = [Array.from(TEMPLATE_HEADERS)]
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  autoFitColumnWidths(worksheet, worksheetData)
  setRowHeight(worksheet, 20, worksheetData.length)
  centerAllCells(worksheet, worksheetData)

  XLSX.utils.book_append_sheet(workbook, worksheet, '优迈成品库存模板')
  XLSX.writeFile(workbook, '优迈成品库存导入模板.xlsx', EXCEL_WRITE_OPTIONS)
}

export async function parseYoumaiFinishedGoodsInventoryExcel(
  file: File,
): Promise<ParseYoumaiFinishedGoodsInventoryExcelResult> {
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]

  validateTemplateHeaders(sheet)

  const excelRows =
    XLSX.utils.sheet_to_json<YoumaiFinishedGoodsInventoryExcelRow>(sheet, {
      defval: '',
    })

  const rows: YoumaiFinishedGoodsInventoryImportRow[] = []
  const errors: string[] = []
  const seenMaterialCodes = new Set<string>()

  excelRows.forEach((row, index) => {
    const rowNumber = index + 2
    const materialCode = normalizeText(row['物料编码'])
    const currentStock = normalizeNumber(row['现有库存'])
    const remarks = normalizeText(row['备注'])

    const isEmptyRow = !materialCode && row['现有库存'] === '' && !remarks

    if (isEmptyRow) {
      return
    }

    if (!materialCode) {
      errors.push(`第 ${rowNumber} 行缺少物料编码`)
      return
    }

    if (seenMaterialCodes.has(materialCode)) {
      errors.push(`第 ${rowNumber} 行物料编码“${materialCode}”在 Excel 中重复`)
      return
    }

    if (
      currentStock === null ||
      Number.isNaN(currentStock) ||
      currentStock < 0
    ) {
      errors.push(`第 ${rowNumber} 行现有库存格式无效，需为大于等于 0 的数字`)
      return
    }

    seenMaterialCodes.add(materialCode)
    rows.push({
      material_code: materialCode,
      current_stock: currentStock,
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
      `模板表头不匹配，请使用“优迈成品库存导入模板.xlsx”，列顺序应为：${templateHeaders.join('、')}`,
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
