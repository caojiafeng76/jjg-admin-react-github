import type { Database } from './database.types'
import { ISyneyItem, ISyneyPo } from './types'
import supabase from './supabase'
import { handleApiError } from '@utils/errorHandler'

type SyneyPoItemUpdate =
  Database['public']['Tables']['syney-po-items']['Update']
type UpdateSyneyPoItemsArgs =
  Database['public']['Functions']['update_syney_po_items']['Args']

export type SyneyPoDetail = ISyneyPo & {
  items: ISyneyItem[]
}

function normalizeSyneyPoItemUpdatePayload(
  values: Partial<ISyneyItem>,
): SyneyPoItemUpdate {
  const payload: SyneyPoItemUpdate = {}

  const assignIfPresent = <K extends keyof SyneyPoItemUpdate>(
    key: K,
    value: SyneyPoItemUpdate[K] | undefined,
  ) => {
    if (value !== undefined) {
      payload[key] = value
    }
  }

  assignIfPresent('No', values.No)
  assignIfPresent('ParamSpec', values.ParamSpec)
  assignIfPresent('PartCode', values.PartCode)
  assignIfPresent('PartModel', values.PartModel)
  assignIfPresent('PartName', values.PartName)
  assignIfPresent('PartName2', values.PartName2)
  assignIfPresent('PartNo', values.PartNo)
  assignIfPresent('PoId', values.PoId)
  assignIfPresent('Qty', values.Qty)
  assignIfPresent('Remark', values.Remark)
  assignIfPresent('SONo', values.SONo)
  assignIfPresent('Spec', values.Spec)
  assignIfPresent('Unit', values.Unit)

  return payload
}

export async function getSyneyPoDetail(PoId: string, signal?: AbortSignal) {
  let query = supabase
    .from('syney-pos')
    .select('*, items:syney-po-items(*)')
    .eq('id', +PoId)

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error } = await query.single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('采购单不存在或已被删除')
    }

    throw handleApiError(error, '获取订单详情失败')
  }

  return data as unknown as SyneyPoDetail
}

export async function updatePoItems({
  ids,
  values,
}: {
  ids: number[]
  values: Partial<ISyneyItem>
}) {
  const payload = normalizeSyneyPoItemUpdatePayload(values)

  const args: UpdateSyneyPoItemsArgs = {
    p_ids: ids.map(Number),
    p_values: payload,
  }

  const { error } = await supabase.rpc('update_syney_po_items', args)

  if (error) {
    throw handleApiError(error, '订单详情更新失败')
  }
}

export async function getItemById(id: number) {
  const { data, error } = await supabase
    .from('syney-po-items')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('订单明细不存在或已被删除')
    }

    throw handleApiError(error, '获取订单详情失败')
  }

  return data
}
