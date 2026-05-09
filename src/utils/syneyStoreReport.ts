import { ISyneyItem, ISyneySpec } from '@/types'
import { distinctItems, getItemsWithParamSpec } from '@utils/syney'

export type SyneyStoreReportPayload = {
  No: string
  TotalAmount: number
  items: ISyneyItem[]
}

export function buildSyneyStoreReportPayload(
  detailData: ISyneyItem[],
  syneySpecs: ISyneySpec[],
): SyneyStoreReportPayload {
  const No = detailData[0]?.No

  if (!No) {
    throw new Error('无法从详情中获取入库单号')
  }

  const items = getItemsWithParamSpec(detailData, syneySpecs || [])
  const itemsDistinct = distinctItems(items as ISyneyItem[])
  const TotalAmount = Math.round(
    items.reduce((acc, item) => {
      const qty = item.Qty || 0
      const unitPrice = Number(item.TaxUnitPrice?.toFixed(2) || 0)

      return acc + qty * unitPrice
    }, 0) * 100,
  ) / 100

  return {
    No,
    TotalAmount,
    items: itemsDistinct,
  }
}
