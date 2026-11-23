import type { CellObject, WorkSheet } from 'xlsx-js-style'
import type {
  ExcelData,
  ExcelRow,
  TransformedOrderData,
  ValidationResult,
} from './excelUtilsTypes'

import * as XLSX from 'xlsx-js-style'
import { normalizeZip64ExcelBuffer } from './excelZip64'
import { transformToOrderData } from './syneyExcelOrderTransform'

export type * from './excelUtilsTypes'
export { transformToOrderData } from './syneyExcelOrderTransform'

/**
 * 必填字段列表
 */
const REQUIRED_FIELDS = [
  '采购单号',
  '交货日期',
  '物料件号',
  '物料名称',
  '核算数量',
  '核算单位',
  '生产编号',
]

function hasCellData(cell: CellObject | undefined): boolean {
  if (!cell)
    return false

  const value = cell.v
  if (value === null || value === undefined)
    return false
  if (typeof value === 'string')
    return value.trim() !== ''

  return true
}

export function getWorksheetDataRange(
  worksheet: WorkSheet,
): string | undefined {
  let range: XLSX.Range | null = null

  for (const cellRef of Object.keys(worksheet)) {
    if (cellRef.startsWith('!'))
      continue

    const cell = worksheet[cellRef] as CellObject | undefined
    if (!hasCellData(cell))
      continue

    const cellAddress = XLSX.utils.decode_cell(cellRef)
    if (!range) {
      range = {
        s: { r: cellAddress.r, c: cellAddress.c },
        e: { r: cellAddress.r, c: cellAddress.c },
      }
      continue
    }

    range.s.r = Math.min(range.s.r, cellAddress.r)
    range.s.c = Math.min(range.s.c, cellAddress.c)
    range.e.r = Math.max(range.e.r, cellAddress.r)
    range.e.c = Math.max(range.e.c, cellAddress.c)
  }

  return range ? XLSX.utils.encode_range(range) : undefined
}

/**
 * 解析Excel文件
 * @param file Excel文件对象
 * @returns Promise<ExcelData>
 */
export async function parseExcelFile(file: File): Promise<ExcelData> {
  try {
    const data = normalizeZip64ExcelBuffer(await file.arrayBuffer())
    const workbook = XLSX.read(data, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) {
      throw new Error('Excel文件中没有工作表')
    }

    const worksheet = workbook.Sheets[sheetName]
    if (!worksheet) {
      throw new Error('Excel工作表读取失败')
    }

    const range = getWorksheetDataRange(worksheet)
    if (!range) {
      return { headers: [], rows: [] }
    }

    // 转换为JSON，按真实有值区域解析，避免 ERP 文件虚高 !ref 导致全表扫描
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      raw: true, // 保留原始数据类型
      defval: null, // 空单元格使用null
      blankrows: false,
      range,
    }) as ExcelRow[]

    // 提取表头
    const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : []

    return {
      headers,
      rows: jsonData,
    }
  }
  catch (error) {
    throw new Error(
      `Excel解析失败: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    )
  }
}

/**
 * 验证Excel数据
 * @param data Excel解析后的数据
 * @returns ValidationResult
 */
export function validateExcelData(data: ExcelData): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // 1. 检查是否有数据
  if (!data.rows || data.rows.length === 0) {
    errors.push('Excel文件为空，没有数据行')
    return { isValid: false, errors, warnings }
  }

  // 2. 检查必填字段是否存在
  const missingHeaders = REQUIRED_FIELDS.filter(
    field => !data.headers.includes(field),
  )
  if (missingHeaders.length > 0) {
    errors.push(`缺少必填列: ${missingHeaders.join(', ')}`)
  }

  // 3. 检查所有行是否属于同一个采购单号
  const uniquePONos = new Set(
    data.rows.map(row => row.采购单号).filter(v => v),
  )
  if (uniquePONos.size > 1) {
    errors.push(
      `Excel文件包含多个采购单号: ${Array.from(uniquePONos).join(', ')}。一个Excel文件只能包含一个采购单。`,
    )
  }

  // 4. 检查每一行的必填字段
  data.rows.forEach((row, index) => {
    const rowNum = index + 2 // Excel行号从1开始，第1行是表头
    REQUIRED_FIELDS.forEach((field) => {
      const value = row[field]
      if (value === null || value === undefined || value === '') {
        errors.push(`第${rowNum}行缺少必填字段: ${field}`)
      }
    })

    // 检查数量是否为有效数字
    const qty = row.核算数量
    if (qty !== null && qty !== undefined && Number.isNaN(Number(qty))) {
      errors.push(`第${rowNum}行的"核算数量"不是有效数字: ${qty}`)
    }
  })

  // 5. 警告提示
  if (data.rows.length > 100) {
    warnings.push(`数据量较大(${data.rows.length}行)，导入可能需要一些时间`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * 完整的Excel导入流程
 * @param file Excel文件
 * @returns 转换后的订单数据
 */
export async function importExcelOrder(
  file: File,
): Promise<TransformedOrderData> {
  // 1. 解析Excel
  const excelData = await parseExcelFile(file)

  // 2. 验证数据
  const validation = validateExcelData(excelData)
  if (!validation.isValid) {
    throw new Error(`数据验证失败:\n${validation.errors.join('\n')}`)
  }

  // 3. 转换数据
  const orderData = transformToOrderData(excelData)

  return orderData
}
