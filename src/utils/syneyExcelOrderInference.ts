import type { ExcelRow } from './excelUtilsTypes'

interface SpecInferenceResult {
  spec: string | null
  hasMixedSpecs: boolean
}

export function inferConsistentSpecFromRows(
  rows: ExcelRow[],
): SpecInferenceResult {
  const rowsBySONo = new Map<string, ExcelRow[]>()

  for (const row of rows) {
    const soNo = String(row.生产编号 || '').trim()
    if (!soNo)
      continue

    const groupRows = rowsBySONo.get(soNo) || []
    groupRows.push(row)
    rowsBySONo.set(soNo, groupRows)
  }

  if (rowsBySONo.size <= 1) {
    return {
      spec: extractSpecFromRows(rows),
      hasMixedSpecs: false,
    }
  }

  const inferredSpecs = Array.from(rowsBySONo.values())
    .map(groupRows => extractSpecFromRows(groupRows))
    .filter((spec): spec is string => !!spec)
  const distinctSpecs = new Set(inferredSpecs)

  if (distinctSpecs.size > 1) {
    return {
      spec: null,
      hasMixedSpecs: true,
    }
  }

  return {
    spec: inferredSpecs[0] || extractSpecFromRows(rows),
    hasMixedSpecs: false,
  }
}

/**
 * 从后板备注中提取商标
 * @param rows Excel行数据
 * @returns 提取到的商标或null
 */
export function extractBrandFromBackPlate(rows: ExcelRow[]): string | null {
  // 1. 找到后板组件 (物料名称包含"后板")
  const backPlateRow = rows.find(
    row => row.物料名称 && String(row.物料名称).includes('后板'),
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
export function extractTechnique(rows: ExcelRow[]): string | null {
  const techniqueList: string[] = []

  // 1. 查找前板组件
  const frontPlateRow = rows.find(
    row =>
      (row.物料名称 && String(row.物料名称).includes('前沿板'))
      || (row.物料件号 && String(row.物料件号).includes('XN2808EB'))
      || (row.物料件号 && String(row.物料件号).includes('XN3024BR')),
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
      const beforeText = frontPlateRemark.substring(
        Math.max(0, index - 15),
        index,
      )
      // 排除包含否定词的情况
      const hasNegativeWord
        = beforeText.includes('不带')
          || beforeText.includes('不')
          || beforeText.includes('无')
          || beforeText.includes('没有')
          || beforeText.includes('无需')

      // 如果"角钢"前面没有否定词，则提取
      if (!hasNegativeWord) {
        techniqueList.push('前：角钢')
      }
    }
  }

  // 2. 查找后板组件
  const backPlateRow = rows.find(
    row =>
      (row.物料名称 && String(row.物料名称).includes('后板'))
      || (row.物料名称 && String(row.物料名称).includes('前沿后板')),
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
    row =>
      (row.物料名称 && String(row.物料名称).includes('中板'))
      || (row.物料件号 && String(row.物料件号).includes('XN2808BP'))
      || (row.物料件号 && String(row.物料件号).includes('XN2808BQ'))
      || (row.物料件号 && String(row.物料件号).includes('XN3024BS'))
      || (row.物料件号 && String(row.物料件号).includes('XN3024BT'))
      || (row.物料件号 && String(row.物料件号).includes('XN3024AP'))
      || (row.物料件号 && String(row.物料件号).includes('XN3024AQ')),
  )

  // 检查中板remark是否包含"雷达孔"或"不剪角"
  middlePlateRows.forEach((middlePlateRow) => {
    if (middlePlateRow.备注) {
      const middlePlateRemark = String(middlePlateRow.备注)

      const leiDaKongRegex = /雷达.*?孔/
      if (leiDaKongRegex.test(middlePlateRemark)) {
        const index = middlePlateRemark.indexOf('雷达')
        const beforeText = middlePlateRemark.substring(
          Math.max(0, index - 10),
          index,
        )
        const hasNegativeWord
          = beforeText.includes('不带')
            || (beforeText.includes('不')
              && !beforeText.endsWith('不')
              && !beforeText.includes('带'))
            || beforeText.includes('无')
            || beforeText.includes('没有')
            || beforeText.includes('无需')

        if (!hasNegativeWord) {
          if (!techniqueList.includes('中：雷达孔')) {
            techniqueList.push('中：雷达孔')
          }
        }
      }

      const buJianJiaoRegex = /不剪角/
      if (buJianJiaoRegex.test(middlePlateRemark)) {
        const index = middlePlateRemark.indexOf('不剪角')
        const beforeText = middlePlateRemark.substring(
          Math.max(0, index - 15),
          index,
        )
        const hasNegativeWord
          = (beforeText.trim() && beforeText.includes('不'))
            || beforeText.includes('无')
            || beforeText.includes('没有')
            || beforeText.includes('无需')
            || beforeText.includes('不要')
            || beforeText.includes('不带')

        if (!hasNegativeWord) {
          if (!techniqueList.includes('中：不剪角')) {
            techniqueList.push('中：不剪角')
          }
        }
      }
    }
  })

  return techniqueList.length > 0 ? techniqueList.join(',') : null
}

/**
 * 从所有行中搜索规格信息（后备逻辑）
 * 在所有条目的spec和remark字段中匹配1000型/800型/600型和室内/室外
 * @param rows Excel行数据
 * @returns 推断的规格,如果无法推断则返回 null
 */
function normalizePartNo(partNo: string) {
  return partNo.replace(/^[^A-Z0-9]+/i, '')
}

export function extractSpecFromAllRows(rows: ExcelRow[]): string | null {
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
      const modelMatch = combinedText.match(
        /(1000型?|800型?|600型?)/,
      )
      if (modelMatch) {
        model = modelMatch[1].includes('型')
          ? modelMatch[1]
          : `${modelMatch[1]}型`
      }
    }

    if (combinedText.includes('室外')) {
      environment = '室外'
    }
    else if (combinedText.includes('室内')) {
      environment = '室内'
    }

    // 从件号判断类型（扶梯/人行道）
    const partNo = normalizePartNo(String(row.物料件号 || ''))
    if (!type) {
      if (partNo.includes('XN2808EB') || partNo.startsWith('XN2808')) {
        type = '扶梯'
      }
      else if (partNo.includes('XN3024BR') || partNo.startsWith('XN3024')) {
        type = '人行道'
      }
    }
  }

  if (!model) {
    return null
  }

  // 如果找不到类型，返回null（无法确定是扶梯还是人行道）
  if (!type) {
    return null
  }

  const spec = `${model}-${environment}-${type}`

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
    row =>
      (row.物料名称 && String(row.物料名称).includes('前沿板'))
      || (row.物料件号 && String(row.物料件号).includes('XN2808EB'))
      || (row.物料件号 && String(row.物料件号).includes('XN3024BR')),
  )

  if (!frontPlateRow) {
    return null
  }

  // 2. 从前板件号判断类型(扶梯/人行道)
  let type = ''
  const frontPlatePartNo = normalizePartNo(String(frontPlateRow.物料件号 || ''))

  // 包含 XN2808EB 的是扶梯,包含 XN3024BR 的是人行道
  if (frontPlatePartNo.includes('XN2808EB')) {
    type = '扶梯'
  }
  else if (frontPlatePartNo.includes('XN3024BR')) {
    type = '人行道'
  }

  if (!type) {
    return null
  }

  const middlePlateRow = rows.find((row) => {
    const name = String(row.物料名称 || '')
    const partNoRaw = String(row.物料件号 || '')
    const partNo = normalizePartNo(partNoRaw)
    return (
      name.includes('中板')
      || partNo.startsWith('XN2808BP')
      || partNo.startsWith('XN2808BQ')
      || partNo.startsWith('XN3024BS')
      || partNo.startsWith('XN3024BT')
      || partNo.startsWith('XN3024AP')
      || partNo.startsWith('XN3024AQ')
    )
  })

  if (!middlePlateRow || !middlePlateRow.规格) {
    return null
  }

  let model = ''
  const middlePlateSpec = String(middlePlateRow.规格)
  const specMatch = middlePlateSpec.match(/(1000型?|800型?|600型?)/)
  if (specMatch) {
    model = specMatch[1].includes('型') ? specMatch[1] : `${specMatch[1]}型`
  }

  if (!model) {
    return null
  }

  // 5. 从中板规格字段推断环境(室内/室外)
  let environment = '室内' // 默认室内
  if (middlePlateSpec.includes('室外')) {
    environment = '室外'
  }
  else if (middlePlateSpec.includes('室内')) {
    environment = '室内'
  }

  const spec = `${model}-${environment}-${type}`

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

  return isValid ? spec : null
}
