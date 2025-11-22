import { ISyneyItem } from './types'
import supabase from './supabase'
import { handleApiError } from '@utils/errorHandler'

export async function getSyneyPoDetail(PoId: string) {
  const { data, error } = await supabase
    .from('syney-po-items')
    .select('*')
    .eq('PoId', +PoId)

  if (error) {
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
  const { error } = await supabase
    .from('syney-po-items')
    .update(values)
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
    throw handleApiError(error, '获取订单详情失败')
  }

  return data
}
