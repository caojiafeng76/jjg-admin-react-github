import * as XLSX from 'xlsx-js-style'
import type { CellObject, WorkSheet } from 'xlsx-js-style'
import { ISyneyPo, ISyneyItem } from '@/types'
import { inferParamSpecFromRemark } from '@utils/syney'
import dayjs from 'dayjs'

import { normalizeZip64ExcelBuffer } from './excelZip64'
import type {
  ExcelData,
  ExcelRow,
  TransformedOrderData,
  ValidationResult,
} from './excelUtilsTypes'
import {
  extractBrandFromBackPlate,
  extractSpecFromAllRows,
  extractTechnique,
  inferConsistentSpecFromRows,
} from './syneyExcelOrderInference'

export type * from './excelUtilsTypes'

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
  if (!cell) return false

  const value = cell.v
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim() !== ''

  return true
}

export function getWorksheetDataRange(
  worksheet: WorkSheet,
): string | undefined {
  let range: XLSX.Range | null = null

  for (const cellRef of Object.keys(worksheet)) {
    if (cellRef.startsWith('!')) continue

    const cell = worksheet[cellRef] as CellObject | undefined
    if (!hasCellData(cell)) continue

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
  } catch (error) {
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
    (field) => !data.headers.includes(field),
  )
  if (missingHeaders.length > 0) {
    errors.push(`缺少必填列: ${missingHeaders.join(', ')}`)
  }

  // 3. 检查所有行是否属于同一个采购单号
  const uniquePONos = new Set(
    data.rows.map((row) => row.采购单号).filter((v) => v),
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
    if (qty !== null && qty !== undefined && isNaN(Number(qty))) {
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
 * 将Excel日期序列号转换为日期字符串
 * @param excelDate Excel日期序列号
 * @returns 格式化的日期字符串 YYYY-MM-DD
 */
function convertExcelDate(excelDate: number | string): string {
  if (typeof excelDate === 'string') {
    // 如果已经是字符串格式，尝试解析
    const parsed = dayjs(excelDate)
    return parsed.isValid() ? parsed.format('YYYY-MM-DD') : excelDate
  }

  // Excel日期从1900年1月1日开始计算 (实际上是1899年12月30日)
  // 使用UTC时间计算以避免时区偏差
  const excelEpoch = new Date(Date.UTC(1899, 11, 30))
  const date = new Date(excelEpoch.getTime() + Number(excelDate) * 86400000)

  // 格式化为YYYY-MM-DD
  return date.toISOString().split('T')[0]
}

/**
 * 转换为订单数据格式
 * @param excelData Excel数据
 * @returns 订单主表和明细数据
 */
export function transformToOrderData(
  excelData: ExcelData,
): TransformedOrderData {
  if (!excelData.rows || excelData.rows.length === 0) {
    throw new Error('没有数据可转换')
  }

  const firstRow = excelData.rows[0]
  let specInferred = false

  // 构建订单主表数据
  const po: Partial<ISyneyPo> = {
    No: String(firstRow.采购单号 || ''),
    EndDate: firstRow.交货日期 ? convertExcelDate(firstRow.交货日期) : null,
    Remark: String(firstRow.订单备注 || ''),
    SONo: Array.from(
      new Set(
        excelData.rows
          .map((row) => row.生产编号)
          .filter((v): v is string => !!v),
      ),
    ).join('\n'),
    // Spec优先级: 1. API推断 (从Excel行数据推断) 2. 后备逻辑（搜索所有行） 3. Excel规格列 (仅作为后备，但需要验证格式)
    // Brand优先级: 1. 后板备注提取 2. Excel商标列 3. API推断
    Spec: (() => {
      const inferredSpecResult = inferConsistentSpecFromRows(excelData.rows)
      if (inferredSpecResult.spec) {
        return inferredSpecResult.spec
      }
      if (inferredSpecResult.hasMixedSpecs) {
        return null
      }
      // 如果标准推断失败，使用后备逻辑（搜索所有行的spec和remark字段）
      const fallbackSpec = extractSpecFromAllRows(excelData.rows)
      if (fallbackSpec) {
        // 标记为推断的规格，需要用户确认
        specInferred = true
        return fallbackSpec
      }
      // 如果推断失败，检查Excel规格列是否是有效格式（包含"型"字）
      const excelSpec = firstRow.规格 ? String(firstRow.规格) : null
      if (
        excelSpec &&
        (excelSpec.includes('型') || excelSpec.match(/^\d+型-/))
      ) {
        return excelSpec
      }
      // 如果Excel规格列格式不对（如"左件"），返回null，让用户手动选择
      return null
    })(),
    Brand: extractBrandFromBackPlate(excelData.rows) || firstRow.商标 || null,
    // 提取工艺要求（用逗号分割，用于分解单；订单列表显示时用空格替换）
    Technique: extractTechnique(excelData.rows),
  }

  // 构建订单明细数据
  const items: Partial<ISyneyItem>[] = excelData.rows.map((row) => ({
    No: String(row.采购单号 || ''),
    PartNo: String(row.物料件号 || '').trim(),
    PartName: String(row.物料名称 || ''),
    Spec: String(row.规格 || ''),
    ParamSpec: String(row.参数规格 || ''),
    Qty: Number(row.核算数量) || 0,
    Unit: String(row.核算单位 || ''),
    SONo: String(row.生产编号 || ''),
    Remark: String(row.备注 || ''),
    TaxUnitPrice: null,
    TaxTotalPrice: null,
  }))

  // 如果参数规格无法解析,尝试根据备注推测,并标记为推测结果
  const itemsWithInferredParamSpec = items.map((item) => {
    const { paramSpec, inferred } = inferParamSpecFromRemark(item as ISyneyItem)
    if (!item.ParamSpec && paramSpec) {
      return { ...item, ParamSpec: paramSpec, ParamSpecInferred: inferred }
    }
    return item
  })

  return {
    po,
    items: itemsWithInferredParamSpec,
    specInferred,
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
