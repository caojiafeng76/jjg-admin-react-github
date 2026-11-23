import type { Json } from './database.types'
import { handleApiError } from '@/utils/errorHandler'
import supabase from './supabase'

export async function getExistingSyneyProductionNos(poNo: string, signal: AbortSignal) {
  const pageSize = 500
  const productionNos = new Set<string>()
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from('syney-pos')
      .select('SONo')
      .eq('No', poNo)
      .order('id')
      .range(offset, offset + pageSize - 1)
      .abortSignal(signal)

    if (error)
      throw handleApiError(error, '查询已建西尼订单失败')

    for (const { SONo } of data) {
      productionNos.add((SONo ?? '').trim())
    }
    if (data.length < pageSize)
      return productionNos
  }
}

export async function importSyneyPurchaseOrder({ poNo, groups }: { poNo: string, groups: Json }) {
  const { data, error } = await supabase.rpc('import_syney_purchase_order', { p_po_no: poNo, p_groups: groups })
  if (error)
    throw handleApiError(error, '生成西尼订单失败')

  if (!data || typeof data !== 'object' || Array.isArray(data)
    || typeof data.created !== 'number' || typeof data.skipped !== 'number') {
    throw new Error('西尼订单返回结果无效，请重新获取后核对建单状态')
  }
  return { created: data.created, skipped: data.skipped }
}
