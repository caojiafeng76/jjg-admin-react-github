import * as XLSX from 'xlsx'
import { ISyneyPo, ISyneyItem } from '@/types'
import { inferParamSpecFromRemark } from '@utils/syney'
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
  // 规格是否是通过后备逻辑推断的（需要用户确认）
  specInferred?: boolean
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
    // Spec优先级: 1. API推断 (从Excel行数据推断) 2. 后备逻辑（搜索所有行） 3. Excel规格列 (仅作为后备，但需要验证格式)
    // Brand优先级: 1. 后板备注提取 2. Excel商标列 3. API推断
    Spec: (() => {
      const inferredSpec = extractSpecFromRows(excelData.rows)
      if (inferredSpec) {
        return inferredSpec
      }
      // 如果标准推断失败，使用后备逻辑（搜索所有行的spec和remark字段）
      const fallbackSpec = extractSpecFromAllRows(excelData.rows)
      if (fallbackSpec) {
        // 标记为推断的规格，需要用户确认
        ;(excelData as any).specInferred = true
        return fallbackSpec
      }
      // 如果推断失败，检查Excel规格列是否是有效格式（包含"型"字）
      const excelSpec = firstRow.规格 ? String(firstRow.规格) : null
      if (excelSpec && (excelSpec.includes('型') || excelSpec.match(/^\d+型-/))) {
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
    specInferred: (excelData as any).specInferred || false,
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
  const remark = String(backPlateRow.备注)
  
  // 优先匹配 "商标为" 格式（如：商标为现代电梯）
  let match = remark.match(/商标为\s*([^\s，,。]+)/)
  if (match && match[1]) {
    return match[1].trim()
  }
  
  // 匹配 "商标:" 或 "商标：" 格式
  match = remark.match(/商标[:：]\s*([^\s，,。]+)/)
  if (match && match[1]) {
    return match[1].trim()
  }
  
  // 匹配 "品牌:" 或 "品牌：" 格式
  match = remark.match(/品牌[:：]\s*([^\s，,。]+)/)
  if (match && match[1]) {
    return match[1].trim()
  }

  return null
}

/**
 * 从订单明细中提取工艺要求
 * @param rows Excel行数据
 * @returns 工艺要求字符串（用逗号分割，用于分解单；用空格分割用于订单列表）
 */
function extractTechnique(rows: ExcelRow[]): string | null {
  const techniqueList: string[] = []

  // 1. 查找前板组件
  const frontPlateRow = rows.find(
    (row) =>
      (row.物料名称 && String(row.物料名称).includes('前沿板')) ||
      (row.物料件号 && String(row.物料件号).includes('XN2808EB')) ||
      (row.物料件号 && String(row.物料件号).includes('XN3024BR')),
  )

  // 检查前板remark是否包含"角钢"
  // 需要排除否定描述，如"不带支撑角钢"、"不带角钢"、"无角钢"等
  if (frontPlateRow && frontPlateRow.备注) {
    const frontPlateRemark = String(frontPlateRow.备注)
    // 检查是否包含"角钢"，但排除否定描述
    if (frontPlateRemark.includes('角钢')) {
      // 检查"角钢"前面是否有否定词（"不带"、"不"、"无"、"没有"等）
      const index = frontPlateRemark.indexOf('角钢')
      // 检查"角钢"前面15个字符内是否有否定词（考虑"不带支撑角钢"这种情况）
      const beforeText = frontPlateRemark.substring(Math.max(0, index - 15), index)
      // 排除包含否定词的情况
      const hasNegativeWord =
        beforeText.includes('不带') ||
        beforeText.includes('不') ||
        beforeText.includes('无') ||
        beforeText.includes('没有') ||
        beforeText.includes('无需')
      
      // 如果"角钢"前面没有否定词，则提取
      if (!hasNegativeWord) {
        techniqueList.push('前：角钢')
      }
    }
  }

  // 2. 查找后板组件
  const backPlateRow = rows.find(
    (row) =>
      (row.物料名称 && String(row.物料名称).includes('后板')) ||
      (row.物料名称 && String(row.物料名称).includes('前沿后板')),
  )

  // 检查后板remark是否包含"前沿板中间"（必须是完整的连续字符串）
  if (backPlateRow && backPlateRow.备注) {
    const backPlateRemark = String(backPlateRow.备注)
    if (backPlateRemark.includes('前沿板中间')) {
      if (!techniqueList.includes('前：商标')) {
        techniqueList.push('前：商标')
      }
    }
  }

  // 3. 查找中板组件（包括上中板和下中板）
  const middlePlateRows = rows.filter(
    (row) =>
      (row.物料名称 && String(row.物料名称).includes('中板')) ||
      (row.物料件号 && String(row.物料件号).includes('XN2808BP')) ||
      (row.物料件号 && String(row.物料件号).includes('XN2808BQ')) ||
      (row.物料件号 && String(row.物料件号).includes('XN3024BS')) ||
      (row.物料件号 && String(row.物料件号).includes('XN3024BT')) ||
      (row.物料件号 && String(row.物料件号).includes('XN3024AP')) ||
      (row.物料件号 && String(row.物料件号).includes('XN3024AQ')),
  )

  // 调试日志：输出找到的中板组件
  console.log('找到的中板组件数量:', middlePlateRows.length)
  middlePlateRows.forEach((row, index) => {
    console.log(`中板${index + 1}:`, {
      物料名称: row.物料名称,
      物料件号: row.物料件号,
      备注: row.备注,
    })
  })

  // 检查中板remark是否包含"雷达孔"或"不剪角"
  middlePlateRows.forEach((middlePlateRow) => {
    if (middlePlateRow.备注) {
      const middlePlateRemark = String(middlePlateRow.备注)
      console.log('检查中板备注:', middlePlateRemark, '是否包含雷达孔:', middlePlateRemark.includes('雷达孔'))
      
      // 检查"雷达孔"（可以是"雷达孔"、"雷达光电孔"等，只要同时包含"雷达"和"孔"即可）
      // 使用正则表达式匹配"雷达"和"孔"同时出现（中间可以有其他字符）
      const leiDaKongRegex = /雷达.*?孔/
      if (leiDaKongRegex.test(middlePlateRemark)) {
        console.log('匹配到雷达孔:', middlePlateRemark)
        // 找到"雷达"的位置，检查前面是否有否定词
        const index = middlePlateRemark.indexOf('雷达')
        const beforeText = middlePlateRemark.substring(Math.max(0, index - 10), index)
        console.log('雷达前面的文本:', beforeText)
        // 排除包含否定词的情况（但"带"不是否定词）
        const hasNegativeWord =
          beforeText.includes('不带') ||
          (beforeText.includes('不') && !beforeText.endsWith('不') && !beforeText.includes('带')) ||
          beforeText.includes('无') ||
          beforeText.includes('没有') ||
          beforeText.includes('无需')
        
        console.log('是否有否定词:', hasNegativeWord)
        // 如果"雷达"前面没有否定词，则提取
        if (!hasNegativeWord) {
          if (!techniqueList.includes('中：雷达孔')) {
            techniqueList.push('中：雷达孔')
            console.log('添加中：雷达孔到工艺要求列表')
          }
        } else {
          console.log('雷达前有否定词，跳过:', beforeText)
        }
      } else {
        console.log('未匹配到雷达孔:', middlePlateRemark)
      }
      
      // 检查"不剪角"（必须是完整的三个字）
      // 使用正则表达式确保"不剪角"是完整的词（前后不是其他中文字符或数字）
      const buJianJiaoRegex = /不剪角/
      if (buJianJiaoRegex.test(middlePlateRemark)) {
        // 检查"不剪角"前面是否有否定词（排除"不剪角"本身的"不"）
        const index = middlePlateRemark.indexOf('不剪角')
        const beforeText = middlePlateRemark.substring(Math.max(0, index - 15), index)
        // 排除包含否定词的情况
        // 注意："不剪角"本身以"不"开头，所以需要检查前面是否有其他否定词
        const hasNegativeWord =
          (beforeText.trim() && beforeText.includes('不')) ||
          beforeText.includes('无') ||
          beforeText.includes('没有') ||
          beforeText.includes('无需') ||
          beforeText.includes('不要') ||
          beforeText.includes('不带')
        
        // 如果"不剪角"前面没有否定词，则提取
        if (!hasNegativeWord) {
          if (!techniqueList.includes('中：不剪角')) {
            techniqueList.push('中：不剪角')
          }
        }
      }
    }
  })

  // 返回用逗号分割的字符串（用于分解单），订单列表显示时需要用空格替换逗号
  const result = techniqueList.length > 0 ? techniqueList.join(',') : null
  // 调试日志：输出提取的工艺要求
  if (result) {
    console.log('提取的工艺要求:', techniqueList, '结果:', result)
  }
  return result
}

/**
 * 从所有行中搜索规格信息（后备逻辑）
 * 在所有条目的spec和remark字段中匹配1000型/800型/600型和室内/室外
 * @param rows Excel行数据
 * @returns 推断的规格,如果无法推断则返回 null
 */
function normalizePartNo(partNo: string) {
  return partNo.replace(/^[^A-Za-z0-9]+/, '')
}

function extractSpecFromAllRows(rows: ExcelRow[]): string | null {
  let model = ''
  let environment = '室内' // 默认室内
  let type = ''

  // 遍历所有行，搜索型号、环境和类型
  for (const row of rows) {
    const spec = String(row.规格 || '')
    const remark = String(row.备注 || '')
    const combinedText = `${spec} ${remark}`

    // 匹配型号（允许不带“型”）
    if (!model) {
      const modelMatch = combinedText.match(/(1000(?:型)?|800(?:型)?|600(?:型)?)/)
      if (modelMatch) {
        model = modelMatch[1].includes('型') ? modelMatch[1] : `${modelMatch[1]}型`
        console.log('后备逻辑：找到型号:', model, '来源:', { 规格: spec, 备注: remark })
      }
    }

    // 匹配环境（室内/室外）- 如果找到"室外"就设置为室外，否则保持默认"室内"
    if (combinedText.includes('室外')) {
      environment = '室外'
    } else if (combinedText.includes('室内')) {
      environment = '室内'
    }

    // 从件号判断类型（扶梯/人行道）
    const partNo = normalizePartNo(String(row.物料件号 || ''))
    if (!type) {
      if (partNo.includes('XN2808EB') || partNo.startsWith('XN2808')) {
        type = '扶梯'
        console.log('后备逻辑：找到类型: 扶梯, 件号:', partNo)
      } else if (partNo.includes('XN3024BR') || partNo.startsWith('XN3024')) {
        type = '人行道'
        console.log('后备逻辑：找到类型: 人行道, 件号:', partNo)
      }
    }
  }

  // 如果找不到型号，返回null
  if (!model) {
    console.log('后备逻辑：未找到型号（1000型/800型/600型）')
    return null
  }

  // 如果找不到类型，返回null（无法确定是扶梯还是人行道）
  if (!type) {
    console.log('后备逻辑：未找到类型（扶梯/人行道）')
    return null
  }

  // 组合规格: 型号-环境-类型
  const spec = `${model}-${environment}-${type}`
  console.log('后备逻辑：推断的规格:', spec)

  // 验证规格是否存在于支持的选项中
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

  const isValid = validSpecs.includes(spec)
  console.log('后备逻辑：规格是否有效:', isValid)

  return isValid ? spec : null
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

  console.log('查找前板组件:', frontPlateRow ? {
    物料名称: frontPlateRow.物料名称,
    物料件号: frontPlateRow.物料件号,
    规格: frontPlateRow.规格,
  } : '未找到')

  if (!frontPlateRow) {
    console.log('未找到前板组件，无法推断规格')
    return null
  }

  // 2. 从前板件号判断类型(扶梯/人行道)
  let type = ''
  const frontPlatePartNo = normalizePartNo(String(frontPlateRow.物料件号 || ''))

  // 包含 XN2808EB 的是扶梯,包含 XN3024BR 的是人行道
  if (frontPlatePartNo.includes('XN2808EB')) {
    type = '扶梯'
  } else if (frontPlatePartNo.includes('XN3024BR')) {
    type = '人行道'
  }

  console.log('前板件号:', frontPlatePartNo, '推断类型:', type)

  if (!type) {
    console.log('无法从前板件号推断类型')
    return null
  }

  // 3. 查找中板组件(用于提取型号和环境)
  const middlePlateRow = rows.find((row) => {
    const name = String(row.物料名称 || '')
    const partNoRaw = String(row.物料件号 || '')
    const partNo = normalizePartNo(partNoRaw)
    return (
      name.includes('中板') ||
      partNo.startsWith('XN2808BP') ||
      partNo.startsWith('XN2808BQ') ||
      partNo.startsWith('XN3024BS') ||
      partNo.startsWith('XN3024BT') ||
      partNo.startsWith('XN3024AP') ||
      partNo.startsWith('XN3024AQ')
    )
  })

  console.log('查找中板组件:', middlePlateRow ? {
    物料名称: middlePlateRow.物料名称,
    物料件号: middlePlateRow.物料件号,
    规格: middlePlateRow.规格,
  } : '未找到')

  if (!middlePlateRow || !middlePlateRow.规格) {
    console.log('未找到中板组件或中板规格为空，无法推断规格')
    return null
  }

  // 4. 从中板规格字段提取型号(1000型/800型/600型)
  let model = ''
  const middlePlateSpec = String(middlePlateRow.规格)
  console.log('中板规格字段:', middlePlateSpec)
  const specMatch = middlePlateSpec.match(/(1000(?:型)?|800(?:型)?|600(?:型)?)/)
  if (specMatch) {
    model = specMatch[1].includes('型') ? specMatch[1] : `${specMatch[1]}型`
    console.log('提取到型号:', model)
  }

  if (!model) {
    console.log('无法从中板规格字段提取型号')
    return null
  }

  // 5. 从中板规格字段推断环境(室内/室外)
  let environment = '室内' // 默认室内
  if (middlePlateSpec.includes('室外')) {
    environment = '室外'
  } else if (middlePlateSpec.includes('室内')) {
    environment = '室内'
  }

  console.log('推断环境:', environment)

  // 6. 组合规格: 型号-环境-类型
  const spec = `${model}-${environment}-${type}`

  console.log('组合后的规格:', spec)

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

  const isValid = validSpecs.includes(spec)
  console.log('规格是否有效:', isValid)

  return isValid ? spec : null
}
