import type { SyneySafePartRule } from './syneySafePartRules'
import type { SyneyPurchaseOrder, SyneyPurchaseOrderRow } from '@/services/syneyDeliveryOrderContract'
import type { ISyneyItem, ISyneySpec } from '@/types'
import { getItemsWithParamSpec } from './syney'
import { transformToOrderData } from './syneyExcelOrderTransform'
import { extractBrandFromItems, extractSpecFromItems } from './syneyOrderDefaults'
import { getLabelInfoBySettings } from './syneySafePartRules'

export function prepareSyneyPurchaseOrder(order: SyneyPurchaseOrder, specs: ISyneySpec[]) {
  const byProductionNo = new Map<string, SyneyPurchaseOrderRow[]>()
  for (const row of order.rows) {
    const productionRows = byProductionNo.get(row.soNo)
    if (productionRows)
      productionRows.push(row)
    else
      byProductionNo.set(row.soNo, [row])
  }

  return Array.from(byProductionNo, ([soNo, rows]) => {
    const dates = Array.from(new Set(rows.map(row => row.endDate)))
    const endDate = dates.length === 1 ? dates[0] : null

    const { po, items, specInferred } = transformToOrderData({
      headers: [],
      rows: rows.map(row => ({
        采购单号: order.poNo,
        交货日期: row.endDate,
        生产编号: row.soNo,
        物料件号: row.partNo,
        物料名称: row.partName,
        规格: row.spec,
        参数规格: row.paramSpec,
        核算数量: row.quantity,
        核算单位: row.unit,
        备注: row.remark,
        订单备注: row.orderRemark,
      })),
    })
    const matched = getItemsWithParamSpec(items as ISyneyItem[], specs)

    return {
      soNo,
      endDate,
      dates,
      brand: po.Brand || extractBrandFromItems(items as ISyneyItem[]),
      spec: po.Spec || extractSpecFromItems(items as ISyneyItem[]),
      specInferred,
      technique: po.Technique ?? null,
      remark: po.Remark ?? null,
      items: matched.map((item, index) => ({
        ...item,
        id: rows[index].id,
        ParamSpec: item.ParamSpec || rows[index].paramSpec,
      })),
    }
  })
}

export type SyneyPurchaseOrderGroup = ReturnType<typeof prepareSyneyPurchaseOrder>[number]

export function buildSyneyPurchaseOrderPayload(groups: SyneyPurchaseOrderGroup[], settings: SyneySafePartRule[]) {
  return groups.map(({ soNo, endDate, brand, spec, technique, remark, items }) => ({
    soNo,
    endDate,
    brand,
    spec,
    technique,
    remark,
    items: items.map(({ PartNo, PartName, Spec, ParamSpec, Qty, Unit, Remark }) => {
      const label = getLabelInfoBySettings(PartNo, '', settings)
      return {
        PartNo,
        PartName,
        Spec,
        ParamSpec,
        Qty,
        Unit,
        Remark,
        PartName2: label?.partName2 ?? null,
        PartModel: label?.partModel ?? null,
        PartCodePrefix: label?.partCode ?? null,
      }
    }),
  }))
}
