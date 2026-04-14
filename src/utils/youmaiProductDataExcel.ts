import * as XLSX from 'xlsx-js-style'
import type { WorkSheet } from 'xlsx-js-style'

import type { YoumaiProductDataFormValues } from '@/services/apiYoumaiProductData'
import {
  autoFitColumnWidths,
  centerAllCells,
  EXCEL_WRITE_OPTIONS,
  setRowHeight,
} from '@/utils/excelStyleUtils'

const TEMPLATE_HEADERS = [
  '物料编码',
  '物料名称',
  '型号',
  '规格',
  '比重',
  '备注',
] as const

type TemplateHeader = (typeof TEMPLATE_HEADERS)[number]

type YoumaiProductDataExcelRow = Record<TemplateHeader, string | number>

export interface ParseYoumaiProductDataExcelResult {
  rows: YoumaiProductDataFormValues[]
  errors: string[]
}

export function downloadYoumaiProductDataTemplate() {
  const workbook = XLSX.utils.book_new()
  const worksheetData = [Array.from(TEMPLATE_HEADERS)]
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  autoFitColumnWidths(worksheet, worksheetData)
  setRowHeight(worksheet, 20, worksheetData.length)
  centerAllCells(worksheet, worksheetData)

  XLSX.utils.book_append_sheet(workbook, worksheet, '优迈货品资料模板')
  XLSX.writeFile(workbook, '优迈货品资料导入模板.xlsx', EXCEL_WRITE_OPTIONS)
}

export async function parseYoumaiProductDataExcel(
  file: File,
): Promise<ParseYoumaiProductDataExcelResult> {
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]

  validateTemplateHeaders(sheet)

  const excelRows = XLSX.utils.sheet_to_json<YoumaiProductDataExcelRow>(sheet, {
    defval: '',
  })

  const rows: YoumaiProductDataFormValues[] = []
  const errors: string[] = []
  const seenMaterialCodes = new Set<string>()

  excelRows.forEach((row, index) => {
    const rowNumber = index + 2
    const materialCode = normalizeText(row['物料编码'])
    const materialName = normalizeText(row['物料名称'])
    const model = normalizeText(row['型号'])
    const specification = normalizeText(row['规格'])
    const specificGravity = normalizeNumber(row['比重'])
    const remarks = normalizeText(row['备注'])

    const isEmptyRow =
      !materialCode &&
      !materialName &&
      !model &&
      !specification &&
      row['比重'] === '' &&
      !remarks

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

    if (!materialName || !model || !specification) {
      errors.push(`第 ${rowNumber} 行存在必填项为空，请检查物料名称/型号/规格`)
      return
    }

    if (
      specificGravity === null ||
      Number.isNaN(specificGravity) ||
      specificGravity < 0
    ) {
      errors.push(`第 ${rowNumber} 行比重格式无效，需为大于等于 0 的数字`)
      return
    }

    seenMaterialCodes.add(materialCode)
    rows.push({
      material_code: materialCode,
      material_name: materialName,
      model,
      specification,
      specific_gravity: specificGravity,
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
      `模板表头不匹配，请使用“优迈货品资料导入模板.xlsx”，列顺序应为：${templateHeaders.join('、')}`,
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
