import * as XLSX from 'xlsx'
import { ISyneyPo, ISyneyItem } from '@/types'
import dayjs from 'dayjs'

/**
 * Excel解析结果类型
 */
export interface ExcelData {
  headers: string[]
  rows: ExcelRow[]
}

/**
 * Excel行数据类型
 */
export interface ExcelRow {
  [key: string]: string | number | null | undefined
  采购单号?: string
  采购单状态?: string
  供应商名称?: string
  商标?: string
  交货日期?: number | string
  交货地点?: string
  物料件号?: string
  物料名称?: string
  规格?: string
  参数规格?: string
  核算数量?: number
  核算单位?: string
  计量数量?: number
  计量单位?: string
  生产编号?: string
  备注?: string
  订单备注?: string
}

/**
 * 数据验证结果
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * 转换后的订单数据
 */
export interface TransformedOrderData {
  po: Partial<ISyneyPo>
  items: Partial<ISyneyItem>[]
}

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

/**
 * 解析Excel文件
 * @param file Excel文件对象
 * @returns Promise<ExcelData>
 */
export async function parseExcelFile(file: File): Promise<ExcelData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) {
          reject(new Error('文件读取失败'))
          return
        }

        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]

        // 转换为JSON，保留原始值
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: true, // 保留原始数据类型
          defval: null, // 空单元格使用null
        }) as ExcelRow[]

        // 提取表头
        const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : []

        resolve({
          headers,
          rows: jsonData,
        })
      } catch (error) {
        reject(new Error(`Excel解析失败: ${error}`))
      }
    }

    reader.onerror = () => {
      reject(new Error('文件读取错误'))
    }

    reader.readAsBinaryString(file)
  })
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
    // Spec优先级: 1. API推断 (从Excel行数据推断) 2. Excel规格列 (仅作为后备)
    // Brand优先级: 1. 后板备注提取 2. Excel商标列 3. API推断
    Spec: extractSpecFromRows(excelData.rows) || firstRow.规格 || null,
    Brand: extractBrandFromBackPlate(excelData.rows) || firstRow.商标 || null,
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

  return { po, items }
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

/**
 * 从后板备注中提取商标
 * @param rows Excel行数据
 * @returns 提取到的商标或null
 */
function extractBrandFromBackPlate(rows: ExcelRow[]): string | null {
  // 1. 找到后板组件 (物料名称包含"后板")
  const backPlateRow = rows.find(
    (row) => row.物料名称 && String(row.物料名称).includes('后板'),
  )

  if (!backPlateRow || !backPlateRow.备注) {
    return null
  }

  // 2. 从备注中提取品牌
  // 匹配模式: "品牌:" 或 "品牌：" 后面的非空白字符
  const remark = String(backPlateRow.备注)
  const match = remark.match(/品牌[:：]\s*(\S+)/)

  if (match && match[1]) {
    return match[1]
  }

  return null
}

/**
 * 从Excel行数据中推断规格信息
 * 按前板件号区分扶梯还是人行道: 包含XN2808EB的是扶梯,包含XN3024BR的是人行道
 * 解析中板规格字段确定 1000型/800型/600型 和 室内/室外
 * @param rows Excel行数据
 * @returns 推断的规格,如果无法推断则返回 null
 */
function extractSpecFromRows(rows: ExcelRow[]): string | null {
  // 1. 查找前沿板组件(用于判断扶梯/人行道)
  const frontPlateRow = rows.find(
    (row) =>
      (row.物料名称 && String(row.物料名称).includes('前沿板')) ||
      (row.物料件号 && String(row.物料件号).includes('XN2808EB')) ||
      (row.物料件号 && String(row.物料件号).includes('XN3024BR')),
  )

  if (!frontPlateRow) {
    return null
  }

  // 2. 从前板件号判断类型(扶梯/人行道)
  let type = ''
  const frontPlatePartNo = String(frontPlateRow.物料件号 || '')

  // 包含 XN2808EB 的是扶梯,包含 XN3024BR 的是人行道
  if (frontPlatePartNo.includes('XN2808EB')) {
    type = '扶梯'
  } else if (frontPlatePartNo.includes('XN3024BR')) {
    type = '人行道'
  }

  if (!type) {
    return null
  }

  // 3. 查找中板组件(用于提取型号和环境)
  const middlePlateRow = rows.find(
    (row) =>
      (row.物料名称 && String(row.物料名称).includes('中板')) ||
      (row.物料件号 && String(row.物料件号).startsWith('XN2808BP')) ||
      (row.物料件号 && String(row.物料件号).startsWith('XN2808BQ')) ||
      (row.物料件号 && String(row.物料件号).startsWith('XN3024BS')) ||
      (row.物料件号 && String(row.物料件号).startsWith('XN3024BT')),
  )

  if (!middlePlateRow || !middlePlateRow.规格) {
    return null
  }

  // 4. 从中板规格字段提取型号(1000型/800型/600型)
  let model = ''
  const middlePlateSpec = String(middlePlateRow.规格)
  const specMatch = middlePlateSpec.match(/(1000型|800型|600型)/)
  if (specMatch) {
    model = specMatch[1]
  }

  if (!model) {
    return null
  }

  // 5. 从中板规格字段推断环境(室内/室外)
  let environment = '室内' // 默认室内
  if (middlePlateSpec.includes('室外')) {
    environment = '室外'
  } else if (middlePlateSpec.includes('室内')) {
    environment = '室内'
  }

  // 6. 组合规格: 型号-环境-类型
  const spec = `${model}-${environment}-${type}`

  // 7. 验证规格是否存在于支持的选项中
  const validSpecs = [
    '1000型-室内-扶梯',
    '1000型-室外-扶梯',
    '1000型-室内-人行道',
    '1000型-室外-人行道',
    '800型-室内-扶梯',
    '800型-室外-扶梯',
    '800型-室内-人行道',
    '800型-室外-人行道',
    '600型-室内-扶梯',
    '600型-室外-扶梯',
    '1000型-室内-老围框',
    '800型-室内-老围框',
    '600型-室内-老围框',
  ]

  return validSpecs.includes(spec) ? spec : null
}
