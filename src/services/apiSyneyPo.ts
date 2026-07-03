import type { Database } from './database.types'
import { ISyneyItem } from './types'
import supabase from './supabase'
import { handleApiError } from '@utils/errorHandler'

type SyneyPoItemUpdate = Database['public']['Tables']['syney-po-items']['Update']

function normalizeSyneyPoItemUpdatePayload(values: ISyneyItem): SyneyPoItemUpdate {
  return {
    No: values.No,
    ParamSpec: values.ParamSpec,
    PartCode: values.PartCode ?? null,
    PartModel: values.PartModel ?? null,
    PartName: values.PartName,
    PartName2: values.PartName2 ?? null,
    PartNo: values.PartNo,
    PoId: values.PoId ?? null,
    Qty: values.Qty,
    Remark: values.Remark,
    SONo: values.SONo,
    Spec: values.Spec,
    Unit: values.Unit,
  }
}

export async function getSyneyPoDetail(PoId: string) {
  const { data, error } = await supabase
    .from('syney-pos')
    .select('*, items:syney-po-items(*)')
    .eq('id', +PoId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('采购单不存在或已被删除')
    }

    throw handleApiError(error, '获取订单详情失败')
  }

  return data
}

export async function updatePoItems({
  ids,
  values,
}: {
  ids: number[]
  values: ISyneyItem
}) {
  const payload = normalizeSyneyPoItemUpdatePayload(values)

  const { error } = await supabase
    .from('syney-po-items')
    .update(payload)
    .in('id', ids)

  if (error) {
    throw handleApiError(error, '订单详情更新失败')
  }

  const { data: specFromRepo } = await supabase
    .from('syney-specs')
    .select('*')
    .eq('PartNo', values.PartNo || '')
    .single()

  if (specFromRepo) return

  const { error: insertSpecError } = await supabase.from('syney-specs').insert([
    {
      ParamSpec: values.ParamSpec,
      PartName: values.PartName,
      PartNo: values.PartNo,
      Spec: values.Spec,
    },
  ])

  if (insertSpecError) {
    throw handleApiError(insertSpecError, '创建踏板规格失败')
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
