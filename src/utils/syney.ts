import { ISyneyItem, ISyneySpec } from '@/types'

// 正则表达式常量,避免重复创建
const LENGTH_PATTERN = /(L1=|L=)(\d+)/g
const L_PATTERN = /L=(\d+)/i // 匹配 L=数字
const L1_PATTERN = /L1=(\d+)/i // 匹配 L1=数字
const MODEL_PATTERN = /(1000(?:型)?|800(?:型)?|600(?:型)?)/ // 允许没有"型"的写法
const MM_NUMBER_PATTERN = /(\d+(?:\.\d+)?)\s*mm/i

// 基于型号的默认规格宽度映射
const MODEL_BASE_WIDTH_MAP: Record<string, number> = {
  '1000型': 1525,
  '800型': 1325,
  '600型': 1125,
}

// 备注中提取宽度的正则
const WIDTH_PATTERN = /宽[=：:\s]*?(\d+(?:\.\d+)?)/i
const NUMBER_FALLBACK_PATTERN = /(\d+(?:\.\d+)?)/ // 兜底提取数字

// 零件号常量
const COMB_SUPPORT_PART_NOS = ['XN2808EB', 'XN3024BR'] as const
const FLOOR_COVER_PART_NOS = [
  'XN2808BP',
  'XN2808BQ',
  'XN3024BS',
  'XN3024BT',
  'XN3024AP1', // 扶梯上中板组件（新件号）
  'XN3024AQ1', // 扶梯下中板组件（新件号）
  'XN3024X997', // 前沿后加长板（新件号）
  'XN2808AF',
  'XN3024BX',
  'XN3024BY',
  'XN3024Y997', // 后板（人行道）- 新件号
  'XN2808AL',
  'XN3024DF',
  'XN2808JY',
  'XN3024DG',
  'XN2808JZ',
] as const

// 为快速查找转换为 Set
const COMB_SUPPORT_SET = new Set(COMB_SUPPORT_PART_NOS)
const FLOOR_COVER_SET = new Set(FLOOR_COVER_PART_NOS)

/**
 * 从备注中提取 L 和 L1 的值
 * @param remark 备注文本
 * @returns 返回包含 L 和 L1 值的对象，如果不存在则返回 null
 */
function extractLAndL1(remark: string): { L: string; L1: string } | null {
  const lMatch = remark.match(L_PATTERN)
  const l1Match = remark.match(L1_PATTERN)
  
  if (lMatch && l1Match) {
    // 同时存在 L 和 L1，返回两者
    return {
      L: lMatch[1],
      L1: l1Match[1],
    }
  } else if (lMatch) {
    // 只有 L
    return {
      L: lMatch[1],
      L1: '',
    }
  } else if (l1Match) {
    // 只有 L1
    return {
      L: '',
      L1: l1Match[1],
    }
  }
  
  return null
}

/**
 * 当无法从规格表匹配到参数规格时,尝试根据型号和备注中的宽度推测参数规格
 * 推测规则:
 * - 型号 1000/800/600 分别对应 1525/1325/1125
 * - 使用备注中出现的宽度数字作为乘数,格式: `${基准宽度}*${备注宽度}`
 */
function isEligibleForInference(item: ISyneyItem) {
  const partName = item.PartName || ''
  // 仅限中板/后板相关的物料
  return partName.includes('中板') || partName.includes('后板')
}

export function inferParamSpecFromRemark(item: ISyneyItem): {
  paramSpec: string | null
  inferred: boolean
} {
  if (!isEligibleForInference(item)) {
    return { paramSpec: null, inferred: false }
  }

  const combined = `${item.Spec || ''} ${item.Remark || ''}`
  const modelMatch = combined.match(MODEL_PATTERN)
  if (!modelMatch) {
    return { paramSpec: null, inferred: false }
  }

  const model = modelMatch[1].includes('型') ? modelMatch[1] : `${modelMatch[1]}型`
  const baseWidth = MODEL_BASE_WIDTH_MAP[model]
  if (!baseWidth) {
    return { paramSpec: null, inferred: false }
  }

  const remark = item.Remark || ''
  
  // 优先尝试提取 L 和 L1
  const lengths = extractLAndL1(remark)
  if (lengths && lengths.L && lengths.L1) {
    // 同时存在 L 和 L1，格式化为 L*L1
    return {
      paramSpec: `${lengths.L}*${lengths.L1}`,
      inferred: true,
    }
  }
  
  // 优先匹配"宽=数字"
  const widthMatch = remark.match(WIDTH_PATTERN)

  // 其次匹配显式的 "xxxmm"
  const mmMatch = !widthMatch ? remark.match(MM_NUMBER_PATTERN) : null

  // 再尝试 L1 / L（单个值）
  let lengthMatchValue: string | undefined
  if (!widthMatch && !mmMatch) {
    if (lengths) {
      lengthMatchValue = lengths.L || lengths.L1
    } else {
      LENGTH_PATTERN.lastIndex = 0
      const lengthMatch = LENGTH_PATTERN.exec(remark)
      lengthMatchValue = lengthMatch?.[2]
    }
  }

  // 最后兜底数字匹配（避免过早匹配订单号中的小数字）
  const fallbackMatch =
    !widthMatch && !mmMatch && !lengthMatchValue
      ? remark.match(NUMBER_FALLBACK_PATTERN)
      : null

  const remarkWidth =
    widthMatch?.[1] || mmMatch?.[1] || lengthMatchValue || fallbackMatch?.[1]

  if (!remarkWidth) {
    return { paramSpec: null, inferred: false }
  }

  return {
    paramSpec: `${baseWidth}*${remarkWidth}`,
    inferred: true,
  }
}

/**
 * 根据给定的物品列表和规格列表,生成带有参数规格的物品列表。
 * 如果物品的备注中包含长度信息(L1= 或 L=),并且规格中包含"实际宽度"或"实际长度",
 * 则将这些占位符替换为实际的长度值。
 *
 * @param items - 物品列表,包含物品的基本信息和备注。
 * @param specs - 规格列表,包含物品的零件号和参数规格。
 * @returns 返回一个包含参数规格的物品列表,每个物品都包含计算后的总价和其他详细信息。
 */
export function getItemsWithParamSpec(
  items: ISyneyItem[],
  specs: ISyneySpec[],
) {
  // 创建规格映射,用于 O(1) 查找零件号对应的参数规格
  const specMap = new Map<string | null, string | null>(
    specs.map((spec) => [spec.PartNo, spec.ParamSpec]),
  )

  // 遍历物品列表,生成带有参数规格的物品列表
  return items.map((item) => {
    const baseParamSpec = specMap.get(item.PartNo)
    let paramSpec = baseParamSpec || ''
    let paramSpecInferred = false

    // 处理参数规格中的长度占位符
    if (
      baseParamSpec &&
      item.Remark &&
      (baseParamSpec.includes('实际宽度') || baseParamSpec.includes('实际长度'))
    ) {
      // 提取备注中的长度信息（支持 L 和 L1）
      const lengths = extractLAndL1(item.Remark)

      if (lengths && lengths.L && lengths.L1) {
        // 业务约定：当同时存在 L 和 L1 时，参数规格统一解析为「L*L1」
        // 例如：L=1575,L1=684 => 1575*684
        paramSpec = `${lengths.L}*${lengths.L1}`
      } else {
        // 保持原有占位符替换逻辑（仅单个长度值场景）
        const singleLength =
          lengths?.L || lengths?.L1 || (() => {
            LENGTH_PATTERN.lastIndex = 0
            const match = LENGTH_PATTERN.exec(item.Remark)
            return match?.[2]
          })()

        if (singleLength) {
          paramSpec = baseParamSpec
            .replace('实际宽度', singleLength)
            .replace('实际长度', `L=${singleLength}`)
        }
      }
    }

    // 如果无法从规格库解析到参数规格,尝试根据备注推测
    if (!paramSpec) {
      const { paramSpec: inferredParamSpec, inferred } =
        inferParamSpecFromRemark(item)

      if (inferredParamSpec) {
        paramSpec = inferredParamSpec
        paramSpecInferred = inferred
      }
    }

    // 计算单价和总价
    const taxUnitPrice = item.TaxUnitPrice || 0
    const qty = item.Qty || 0
    const roundedUnitPrice = Math.round(taxUnitPrice * 100) / 100

    // 返回带有参数规格的物品对象
    return {
      No: item.No,
      ParamSpec: paramSpec,
      PartName: item.PartName,
      PartName2: item.PartName2 || '',
      PartNo: item.PartNo,
      Qty: qty,
      Remark: item.Remark,
      SONo: item.SONo,
      Spec: item.Spec,
      TaxUnitPrice: roundedUnitPrice,
      TaxTotalPrice: qty * taxUnitPrice, // 使用原始单价计算总价以保持精度
      Unit: item.Unit,
      PartCode: item.PartCode,
      PartModel: item.PartModel,
      ParamSpecInferred: paramSpecInferred,
    }
  })
}

/**
 * 对物品列表进行去重操作,合并相同 PartNo 和 TaxUnitPrice 的物品数量(Qty),并重新计算总价。
 * 返回去重后的物品列表。
 *
 * @param items - 物品列表,包含需要去重的物品信息。
 * @returns 返回去重后的物品列表,相同 PartNo 和 TaxUnitPrice 的物品数量会累加。
 */
export function distinctItems(items: ISyneyItem[]): ISyneyItem[] {
  // 使用 Map 来存储去重后的物品,key 为 PartNo 和 TaxUnitPrice 的组合
  const itemMap = new Map<string, ISyneyItem>()

  items.forEach((item) => {
    // 生成唯一键,用于判断是否为相同物品
    const key = `${item.PartNo}-${item.TaxUnitPrice}`
    const existingItem = itemMap.get(key)

    if (existingItem) {
      // 合并相同物品的数量并重新计算总价
      const newQty = (existingItem.Qty || 0) + (item.Qty || 0)
      const unitPrice = item.TaxUnitPrice || 0

      existingItem.Qty = newQty
      existingItem.TaxTotalPrice = newQty * unitPrice
    } else {
      // 添加新物品条目
      const qty = item.Qty || 0
      const unitPrice = item.TaxUnitPrice || 0

      itemMap.set(key, {
        ...item,
        Qty: qty,
        TaxUnitPrice: unitPrice,
        TaxTotalPrice: qty * unitPrice,
      })
    }
  })

  // 将 Map 中的值转换为数组并返回
  return Array.from(itemMap.values())
}

function extractDataArray(jsonString: string) {
  // 找到"data"键的起始位置
  const dataKeyStart = jsonString.indexOf('data')
  if (dataKeyStart === -1) return ''

  // 找到冒号:
  const colonIndex = jsonString.indexOf(':', dataKeyStart)
  if (colonIndex === -1) return ''

  // 跳过空白字符
  let startIndex = colonIndex + 1
  while (startIndex < jsonString.length && /\s/.test(jsonString[startIndex])) {
    startIndex++
  }

  // 检查是否以[开始
  if (jsonString[startIndex] !== '[') return ''

  // 开始计数
  let count = 1
  for (let i = startIndex + 1; i < jsonString.length; i++) {
    if (jsonString[i] === '[') {
      count++
    } else if (jsonString[i] === ']') {
      count--
      if (count === 0) {
        return jsonString.substring(startIndex, i + 1)
      }
    }
  }
  return ''
}

export function jsonToArray(json: string): ISyneyItem[] {
  const jsonArrayStr = extractDataArray(json)

  if (!jsonArrayStr) {
    console.error('无法从JSON字符串中提取数据数组')
    return []
  }

  try {
    const jsonArray = JSON.parse(jsonArrayStr) as ISyneyItem[]

    return jsonArray.map((item: ISyneyItem) => ({
      No: item.No,
      ParamSpec: '',
      PartName: item.PartName,
      PartName2: item.PartName2 || '',
      PartNo: item.PartNo,
      Qty: item.Qty,
      Remark: item.Remark,
      SONo: item.SONo,
      Spec: item.Spec,
      TaxTotalPrice: 0,
      TaxUnitPrice: item.TaxUnitPrice || 0,
      Unit: item.Unit,
      PartCode: item.PartCode || '',
      PartModel: item.PartModel || '',
    }))
  } catch (error) {
    console.error('JSON解析失败:', error)
    return []
  }
}

/**
 * 根据物品列表和起始序列号，为特定零件号的物品添加额外信息（如 PartName2、PartModel、PartCode），
 * 并按销售订单号（SONo）和序列号分组存储。
 *
 * @param items - 物品列表，包含需要处理的物品信息。
 * @param startSerialNo - 起始序列号（预分配），用于生成 PartCode。应该从数据库原子操作获取。
 * @returns 返回一个对象，包含分组后的物品映射（map）和使用后的最终序列号（tmpSerialNo）。
 */
export function getItemsWithExtraInfo(
  items: ISyneyItem[],
  startSerialNo: number,
): { map: Map<string, ISyneyItem[]>; tmpSerialNo: number } {
  // 创建一个 Map，用于按销售订单号（SONo）和序列号分组存储物品
  const map = new Map<string, ISyneyItem[]>()

  // 性能优化: 预先按 SONo 分组,避免多次过滤
  const itemsBySONo = new Map<string | null, ISyneyItem[]>()
  items.forEach((item) => {
    const soNo = item.SONo
    if (!itemsBySONo.has(soNo)) {
      itemsBySONo.set(soNo, [])
    }
    itemsBySONo.get(soNo)!.push(item)
  })

  // 使用起始序列号，为每个 SONo 分配递增的序列号
  let currentSerialNo = startSerialNo

  // 遍历每个唯一的销售订单号
  itemsBySONo.forEach((soItems, soNo) => {
    // 为当前销售订单号分配序列号
    const seNo = currentSerialNo + 1
    currentSerialNo = seNo

    // 性能优化: 只遍历一次物品列表
    soItems.forEach((item) => {
      const partNo = item.PartNo
      if (!partNo) return

      // 优化: 使用 Set 进行 O(1) 查找而不是 array.some() 的 O(n)
      let isCombSupport = false
      let isFloorCover = false

      for (const pn of COMB_SUPPORT_SET) {
        if (partNo.includes(pn)) {
          isCombSupport = true
          break
        }
      }

      if (!isCombSupport) {
        for (const pn of FLOOR_COVER_SET) {
          if (partNo.includes(pn)) {
            isFloorCover = true
            break
          }
        }
      }

      if (isCombSupport) {
        item.PartName2 = '梳齿支撑板'
        item.PartModel = 'YD1001XN'
        item.PartCode = `ZC00${seNo}`
      } else if (isFloorCover) {
        item.PartName2 = '楼层板'
        item.PartModel = 'YD0201XN'
        item.PartCode = `LC00${seNo}`
      }
    })

    // 将当前销售订单号的物品按分组键（SONo~seNo）存入 Map
    map.set(`${soNo}~${seNo}`, soItems)
  })

  // 返回分组后的 Map 和使用后的最终序列号
  return {
    map,
    tmpSerialNo: currentSerialNo,
  }
}
