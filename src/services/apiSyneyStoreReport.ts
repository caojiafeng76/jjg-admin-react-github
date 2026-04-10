import type { Database } from './database.types'
import { ISyneyItem } from './types'
import supabase from './supabase'
import { handleApiError } from '@utils/errorHandler'

type SyneyStoreReportItemUpdate =
  Database['public']['Tables']['syney-store-report-items']['Update']

function normalizeSyneyStoreReportItemPayload(
  item: ISyneyItem,
): SyneyStoreReportItemUpdate {
  return {
    No: item.No,
    ParamSpec: item.ParamSpec,
    PartName: item.PartName,
    PartNo: item.PartNo,
    Qty: item.Qty,
    Remark: item.Remark,
    SONo: item.SONo,
    Spec: item.Spec,
    TaxTotalPrice: item.TaxTotalPrice ?? null,
    TaxUnitPrice: item.TaxUnitPrice ?? null,
    Unit: item.Unit,
  }
}

export async function updateSyneyStoreReport({ item }: { item: ISyneyItem }) {
  const payload = normalizeSyneyStoreReportItemPayload(item)

  const { error: updateItemError } = await supabase
    .from('syney-store-report-items')
    .update(payload)
    .eq('id', item.id!)
    .select()
    .single()

  if (updateItemError) {
    throw handleApiError(updateItemError, '更新入库单条目失败')
  }

  const { data: specFromRepo } = await supabase
    .from('syney-specs')
    .select('*')
    .eq('PartNo', item.PartNo || '')
    .single()

  if (specFromRepo) return

  const { error: insertSpecError } = await supabase.from('syney-specs').insert([
    {
      ParamSpec: item.ParamSpec,
      PartName: item.PartName,
      PartNo: item.PartNo,
      Spec: item.Spec,
    },
  ])

  if (insertSpecError) {
    throw handleApiError(insertSpecError, '创建踏板规格失败')
  }
}

export async function deleteSyneyStoreReportItems(ids: string[]) {
  const { error } = await supabase
    .from('syney-store-report-items')
    .delete()
    .in('id', ids.map(Number))

  if (error) {
    throw handleApiError(error, '删除入库单条目失败')
  }
}
