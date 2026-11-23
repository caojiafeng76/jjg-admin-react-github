import type { SyneySafePartRule } from './syneySafePartRules'
import type { SyneyPurchaseOrder, SyneyPurchaseOrderRow } from '@/services/syneyDeliveryOrderContract'
import type { ISyneyItem, ISyneySpec } from '@/types'
import { getItemsWithParamSpec } from './syney'
import { transformToOrderData } from './syneyExcelOrderTransform'
import { extractBrandFromItems, extractSpecFromItems, SYNEY_LOOSE_PARTS_SPEC } from './syneyOrderDefaults'
import { getLabelInfoBySettings } from './syneySafePartRules'

function groupRowsByProductionNo(rows: SyneyPurchaseOrderRow[]) {
  const byProductionNo = new Map<string, SyneyPurchaseOrderRow[]>()
  for (const row of rows) {
    const key = row.soNo.trim()
    const productionRows = byProductionNo.get(key)
    if (productionRows)
      productionRows.push(row)
    else
      byProductionNo.set(key, [row])
  }
  return byProductionNo
}

export function prepareSyneyPurchaseOrder(order: SyneyPurchaseOrder, specs: ISyneySpec[]) {
  const byProductionNo = groupRowsByProductionNo(order.rows)

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
      isLooseParts: false,
      items: matched.map((item, index) => ({
        ...item,
        id: rows[index].id,
        ParamSpec: item.ParamSpec || rows[index].paramSpec,
      })),
    }
  })
}

export function prepareSyneyLoosePartsOrder(order: SyneyPurchaseOrder): SyneyPurchaseOrderGroup[] {
  const byProductionNo = groupRowsByProductionNo(order.rows)

  return Array.from(byProductionNo, ([soNo, rows]) => {
    const dates = Array.from(new Set(rows.map(row => row.endDate)))
    const endDate = dates.length === 1 ? dates[0] : null
    const remark = rows.find(row => row.orderRemark)?.orderRemark || null

    return {
      soNo,
      endDate,
      dates,
      brand: null,
      spec: SYNEY_LOOSE_PARTS_SPEC,
      specInferred: false,
      technique: null,
      remark,
      isLooseParts: true,
      items: rows.map(row => ({
        id: row.id,
        No: order.poNo,
        ParamSpec: row.paramSpec,
        PartName: row.partName,
        PartName2: '',
        PartNo: row.partNo,
        Qty: row.quantity,
        Remark: row.remark,
        SONo: soNo,
        Spec: row.spec,
        TaxUnitPrice: 0,
        TaxTotalPrice: 0,
        Unit: row.unit,
        PartCode: '',
        PartModel: '',
        ParamSpecInferred: false,
      })),
    }
  })
}

export type SyneyPurchaseOrderGroup = ReturnType<typeof prepareSyneyPurchaseOrder>[number]

export function buildSyneyPurchaseOrderPayload(
  groups: SyneyPurchaseOrderGroup[],
  settings: SyneySafePartRule[] = [],
) {
  return groups.map(({ soNo, endDate, brand, spec, technique, remark, isLooseParts, items }) => ({
    soNo,
    endDate,
    brand: isLooseParts ? null : brand,
    spec: isLooseParts ? SYNEY_LOOSE_PARTS_SPEC : spec,
    technique: isLooseParts ? null : technique,
    remark,
    isLooseParts,
    items: items.map(({ PartNo, PartName, Spec, ParamSpec, Qty, Unit, Remark }) => {
      if (isLooseParts) {
        return {
          PartNo,
          PartName,
          Spec,
          ParamSpec,
          Qty,
          Unit,
          Remark,
          PartName2: null,
          PartModel: null,
          PartCodePrefix: null,
        }
      }
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
