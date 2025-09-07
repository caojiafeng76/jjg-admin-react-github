import { ISyneyItem, ISyneySpec } from '@/types'

/**
 * 根据给定的物品列表和规格列表，生成带有参数规格的物品列表。
 * 如果物品的备注中包含长度信息（L1= 或 L=），并且规格中包含“实际宽度”或“实际长度”，
 * 则将这些占位符替换为实际的长度值。
 *
 * @param items - 物品列表，包含物品的基本信息和备注。
 * @param specs - 规格列表，包含物品的零件号和参数规格。
 * @returns 返回一个包含参数规格的物品列表，每个物品都包含计算后的总价和其他详细信息。
 */
export function getItemsWithParamSpec(
  items: ISyneyItem[],
  specs: ISyneySpec[],
) {
  // 创建一个映射，用于快速查找零件号对应的参数规格
  const specMap = new Map<string | null, string | null>()
  specs.forEach((item) => {
    specMap.set(item.PartNo, item.ParamSpec)
  })

  // 正则表达式，用于匹配备注中的长度信息（L1= 或 L=）
  const regex = /(L1=|L=)(\d+)/g

  // 遍历物品列表，生成带有参数规格的物品列表
  return items.map((item) => {
    let paramSpec = specMap.get(item.PartNo)

    // 如果参数规格中包含“实际宽度”或“实际长度”，并且备注中有匹配的长度信息
    if (
      paramSpec &&
      (paramSpec.includes('实际宽度') || paramSpec.includes('实际长度'))
    ) {
      const match = item.Remark?.match(regex)
      if (match) {
        const length = match[0].split('=')[1]

        // 根据匹配的长度信息，替换参数规格中的占位符
        switch (match[0].split('=')[0]) {
          case 'L1':
          case 'L':
            paramSpec = paramSpec.replace('实际宽度', length)
            paramSpec = paramSpec.replace('实际长度', `L=${length}`)
            break
        }
      }
    }

    // 返回带有参数规格的物品对象
    return {
      No: item.No,
      ParamSpec: paramSpec || '',
      PartName: item.PartName,
      PartName2: item.PartName2 || '',
      PartNo: item.PartNo,
      Qty: item.Qty,
      Remark: item.Remark,
      SONo: item.SONo,
      Spec: item.Spec,
      TaxUnitPrice: Math.round(item.TaxUnitPrice! * 100) / 100, // 四舍五入保留两位小数
      TaxTotalPrice: (item.Qty || 0) * (item.TaxUnitPrice || 0), // 计算总价
      Unit: item.Unit,
      PartCode: item.PartCode,
      PartModel: item.PartModel,
    }
  })
}

/**
 * 对物品列表进行去重操作，合并相同 PartNo 和 TaxUnitPrice 的物品数量（Qty），并重新计算总价。
 * 返回去重后的物品列表。
 *
 * @param items - 物品列表，包含需要去重的物品信息。
 * @returns 返回去重后的物品列表，相同 PartNo 和 TaxUnitPrice 的物品数量会累加。
 */
export function distinctItems(items: ISyneyItem[]): ISyneyItem[] {
  // 使用 Map 来存储去重后的物品，key 为 PartNo 和 TaxUnitPrice 的组合
  const map = new Map<string, ISyneyItem>()

  items.forEach((item) => {
    // 生成唯一键，用于判断是否为相同物品
    const key = `${item.PartNo}-${item.TaxUnitPrice}`

    if (map.has(key)) {
      // 如果 Map 中已存在相同键的物品，则累加数量（Qty）并重新计算总价
      const existingItem = map.get(key)!
      existingItem.Qty! += item.Qty!
      existingItem.TaxTotalPrice! = existingItem.Qty! * item.TaxUnitPrice!
    } else {
      // 如果 Map 中不存在相同键的物品，则添加新条目
      map.set(key, {
        No: item.No,
        ParamSpec: item.ParamSpec,
        PartName: item.PartName,
        PartNo: item.PartNo,
        Qty: item.Qty,
        Remark: item.Remark,
        SONo: item.SONo,
        Spec: item.Spec,
        TaxUnitPrice: item.TaxUnitPrice || 0, // 默认值为 0，避免 undefined
        TaxTotalPrice: (item.Qty || 0) * (item.TaxUnitPrice || 0), // 计算总价
        Unit: item.Unit,
      })
    }
  })

  // 将 Map 中的值转换为数组并返回
  return Array.from(map.values())
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
}

/**
 * 根据物品列表和临时序列号，为特定零件号的物品添加额外信息（如 PartName2、PartModel、PartCode），
 * 并按销售订单号（SONo）和序列号分组存储。
 *
 * @param items - 物品列表，包含需要处理的物品信息。
 * @param tmpSerialNo - 临时序列号，用于生成 PartCode。
 * @returns 返回一个对象，包含分组后的物品映射（map）和更新后的临时序列号（tmpSerialNo）。
 */
export function getItemsWithExtraInfo(
  items: ISyneyItem[],
  tmpSerialNo: number,
): { map: Map<string, ISyneyItem[]>; tmpSerialNo: number } {
  // 定义需要处理的梳齿支撑板和楼层板的零件号列表
  const partNosOfComb = ['XN2808EB', 'XN3024BR']
  const partNosOfCover = [
    'XN2808BP',
    'XN2808BQ',
    'XN3024BS',
    'XN3024BT',
    'XN2808AF',
    'XN3024BX',
    'XN3024BY',
    'XN2808AL',
    'XN3024DF',
    'XN2808JY',
    'XN3024DG',
    'XN2808JZ',
  ]

  // 创建一个 Map，用于按销售订单号（SONo）和序列号分组存储物品
  const map = new Map<string, ISyneyItem[]>()

  // 获取所有唯一的销售订单号（SONo）
  const uniqueSONos = new Set(items?.map((item) => item.SONo))

  // 遍历每个唯一的销售订单号
  uniqueSONos.forEach((soNo) => {
    // 生成当前销售订单号对应的序列号
    const seNo = tmpSerialNo + 1

    // 处理梳齿支撑板的零件
    partNosOfComb.forEach((partNo) => {
      items
        .filter((item) => item.SONo === soNo && item.PartNo?.includes(partNo))
        .forEach((item) => {
          item.PartName2 = '梳齿支撑板'
          item.PartModel = 'YD1001XN'
          item.PartCode = `ZC00${seNo}`
        })
    })

    // 处理楼层板的零件
    partNosOfCover.forEach((partNo) => {
      items
        .filter((item) => item.SONo === soNo && item.PartNo?.includes(partNo))
        .forEach((item) => {
          item.PartName2 = '楼层板'
          item.PartModel = 'YD0201XN'
          item.PartCode = `LC00${seNo}`
        })
    })

    // 将当前销售订单号的物品按分组键（SONo~seNo）存入 Map
    map.set(
      `${soNo}~${seNo}`,
      items.filter((item) => item.SONo === soNo),
    )

    // 更新临时序列号
    tmpSerialNo = seNo
  })

  // 返回分组后的 Map 和更新后的临时序列号
  return {
    map,
    tmpSerialNo,
  }
}
