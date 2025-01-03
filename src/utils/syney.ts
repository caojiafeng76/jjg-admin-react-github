import { ISyneyItem, ISyneySpec } from '@/types'

export function getItemsWithParamSpec(
  items: ISyneyItem[],
  specs: ISyneySpec[],
) {
  const specMap = new Map<string | null, string | null>()

  specs.forEach((item) => {
    specMap.set(item.PartNo, item.ParamSpec)
  })

  const regex = /(L1=|L=)(\d+)/g

  return items.map((item) => {
    let paramSpec = specMap.get(item.PartNo)

    if (
      paramSpec &&
      (paramSpec.includes('实际宽度') || paramSpec.includes('实际长度'))
    ) {
      const match = item.Remark?.match(regex)
      if (match) {
        const length = match[0].split('=')[1]

        switch (match[0].split('=')[0]) {
          case 'L1':
            paramSpec = paramSpec.replace('实际宽度', length)
            paramSpec = paramSpec.replace('实际长度', `L=${length}`)
            break
          case 'L':
            paramSpec = paramSpec.replace('实际宽度', length)
            paramSpec = paramSpec.replace('实际长度', `L=${length}`)
            break
        }
      }
    }

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
      TaxUnitPrice: Math.round(item.TaxUnitPrice! * 100) / 100,
      TaxTotalPrice: (item.Qty || 0) * (item.TaxUnitPrice || 0), // 计算总价
      Unit: item.Unit,
      PartCode: item.PartCode,
      PartModel: item.PartModel,
    }
  })
}

export function distinctItems(items: ISyneyItem[]) {
  const map = new Map<string, ISyneyItem>()

  items.forEach((item) => {
    const key = `${item.PartNo}-${item.TaxUnitPrice}`

    if (map.has(key)) {
      // 如果map中已有相同的key，则累加Qty
      const existingItem = map.get(key)

      existingItem!.Qty! += item!.Qty!

      existingItem!.TaxTotalPrice! = existingItem!.Qty! * item!.TaxUnitPrice!
    } else {
      // 否则，将条目添加到map中，只包含指定的字段

      map.set(key, {
        No: item.No,
        ParamSpec: item.ParamSpec,
        PartName: item.PartName,
        PartNo: item.PartNo,
        Qty: item.Qty,
        Remark: item.Remark,
        SONo: item.SONo,
        Spec: item.Spec,
        TaxUnitPrice: item.TaxUnitPrice || 0,
        TaxTotalPrice: (item.Qty || 0) * (item.TaxUnitPrice || 0), // 计算总价
        Unit: item.Unit,
      })
    }
  })

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
  // if (json) {
  //   return JSON.parse(JSON.stringify(json, ['data'], 2), (_k, v: string) => {
  //     if (v) {
  //       return (JSON.parse(v) as { data: ISyneyItem[] }).data.map((item) => ({
  //         No: item.No,
  //         ParamSpec: '',
  //         PartName: item.PartName,
  //         PartName2: item.PartName2 || '',
  //         PartNo: item.PartNo,
  //         Qty: item.Qty,
  //         Remark: item.Remark,
  //         SONo: item.SONo,
  //         Spec: item.Spec,
  //         TaxTotalPrice: 0,
  //         TaxUnitPrice: item.TaxUnitPrice,
  //         Unit: item.Unit,
  //         PartCode: item.PartCode,
  //         PartModel: item.PartModel,
  //       }))
  //     }
  //   })
  // }
  // return null

  const jsonArrayStr = extractDataArray(json)
  const jsonArray = JSON.parse(jsonArrayStr)

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
    TaxUnitPrice: item.TaxUnitPrice,
    Unit: item.Unit,
    PartCode: item.PartCode,
    PartModel: item.PartModel,
  }))
}

export function getItemsWithExtraInfo(
  items: ISyneyItem[],
  tmpSerialNo: number,
) {
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
  ]

  const map = new Map<string, ISyneyItem[]>()

  new Set(items?.map((item) => item.SONo)).forEach((soNo) => {
    const seNo = tmpSerialNo + 1
    partNosOfComb.forEach((partNo) => {
      items
        .filter((item) => item.SONo === soNo)
        .forEach((item) => {
          if (item.PartNo?.includes(partNo)) {
            item.PartName2 = '梳齿支撑板'
            item.PartModel = 'YD1001XN'
            item.PartCode = `ZC00${seNo}`
          }
        })
    })

    partNosOfCover.forEach((partNo) => {
      items
        .filter((item) => item.SONo === soNo)
        .forEach((item) => {
          if (item.PartNo?.includes(partNo)) {
            item.PartName2 = '楼层板'
            item.PartModel = 'YD0201XN'
            item.PartCode = `LC00${seNo}`
          }
        })
    })

    map.set(
      `${soNo}~${seNo}`,
      items.filter((item) => item.SONo === soNo),
    )

    tmpSerialNo = seNo
  })

  return {
    map,
    tmpSerialNo,
  }
}
