import type { SyneySafePartRule } from './syneySafePartRules'
import type { SyneyPurchaseOrder, SyneyPurchaseOrderRow } from '@/services/syneyDeliveryOrderContract'
import type { ISyneyItem, ISyneySpec } from '@/types'
import { getItemsWithParamSpec } from './syney'
import { transformToOrderData } from './syneyExcelOrderTransform'
import {
  extractBrandFromItems,
  extractSpecFromItems,
  isSyneyLoosePartsSpec,
  SYNEY_LOOSE_PARTS_SPEC,
} from './syneyOrderDefaults'
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

export interface ManualOrExcelPoOrderInput {
  endDate: string
  spec?: string | null
  brand?: string | null
  technique?: string | null
  remark?: string | null
}

/**
 * 将手工粘贴 JSON 或 Excel 解析出的明细按生产编号分组并匹配规格，
 * 输出可直接交给 `buildSyneyPurchaseOrderPayload` / `import_syney_purchase_order` RPC 的分组结构。
 */
export function prepareManualOrExcelPoGroups({
  order,
  items,
  specs,
}: {
  order: ManualOrExcelPoOrderInput
  items: ISyneyItem[]
  specs: ISyneySpec[]
}): {
  groups: SyneyPurchaseOrderGroup[]
  hasInferredParamSpec: boolean
} {
  if (!order.endDate) {
    throw new Error('请选择有效的交货日期')
  }
  if (items.length === 0) {
    throw new Error('订单明细不能为空')
  }

  const matchedItems = getItemsWithParamSpec(items, specs) as ISyneyItem[]
  const hasInferredParamSpec = matchedItems.some(item => Boolean(item.ParamSpecInferred))

  const byProductionNo = new Map<string, ISyneyItem[]>()
  for (let index = 0; index < matchedItems.length; index++) {
    const item = matchedItems[index]
    const partNo = item.PartNo?.trim() ?? ''
    const partName = item.PartName?.trim() ?? ''
    const unit = item.Unit?.trim() ?? ''
    const qty = Number(item.Qty ?? 0)

    if (!partNo || !partName || !unit || !Number.isInteger(qty) || qty < 0) {
      throw new Error(`第 ${index + 1} 行明细缺少件号、名称、单位或数量不为非负整数`)
    }

    const normalizedItem: ISyneyItem = {
      ...item,
      PartNo: partNo,
      PartName: partName,
      Unit: unit,
      Qty: qty,
      SONo: (item.SONo ?? '').trim(),
    }
    const soNo = normalizedItem.SONo ?? ''
    const groupItems = byProductionNo.get(soNo)
    if (groupItems) {
      groupItems.push(normalizedItem)
    }
    else {
      byProductionNo.set(soNo, [normalizedItem])
    }
  }

  const explicitSpec = order.spec?.trim() || null
  const explicitBrand = order.brand?.trim() || null
  const technique = order.technique?.trim() || null
  const remark = order.remark?.trim() || null

  const groups: SyneyPurchaseOrderGroup[] = Array.from(byProductionNo, ([soNo, groupItems]) => {
    const resolvedSpec = explicitSpec || extractSpecFromItems(groupItems)
    const isLooseParts = isSyneyLoosePartsSpec(resolvedSpec)

    if (!isLooseParts && !soNo) {
      throw new Error('订单明细缺少生产编号（散件订单请将规格选为「散件」）')
    }

    return {
      soNo,
      endDate: order.endDate,
      dates: [order.endDate],
      brand: isLooseParts ? null : (explicitBrand || extractBrandFromItems(groupItems)),
      spec: isLooseParts ? SYNEY_LOOSE_PARTS_SPEC : resolvedSpec,
      specInferred: false,
      technique: isLooseParts ? null : technique,
      remark,
      isLooseParts,
      items: groupItems.map((item, index) => ({
        id: item.id ?? index + 1,
        No: item.No,
        ParamSpec: item.ParamSpec ?? '',
        PartName: item.PartName,
        PartName2: item.PartName2 ?? '',
        PartNo: item.PartNo,
        Qty: Number(item.Qty ?? 0),
        Remark: item.Remark,
        SONo: item.SONo,
        Spec: item.Spec,
        TaxUnitPrice: item.TaxUnitPrice ?? 0,
        TaxTotalPrice: item.TaxTotalPrice ?? 0,
        Unit: item.Unit,
        PartCode: item.PartCode ?? '',
        PartModel: item.PartModel ?? '',
        ParamSpecInferred: Boolean(item.ParamSpecInferred),
      })),
    }
  })

  return { groups, hasInferredParamSpec }
}

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
