import { PoDetailFormType } from '@/types'
import supabase from './supabase'

export async function getSyneyPoDetail(PoId: string) {
  const { data, error } = await supabase
    .from('syney-po-items')
    .select('*')
    .eq('PoId', +PoId)

  if (error) {
    console.error(error)
    throw new Error('获取订单详情失败')
  }

  return data
}

export async function updatePoItems({
  ids,
  values,
}: {
  ids: number[]
  values: PoDetailFormType
}) {
  const { error } = await supabase
    .from('syney-po-items')
    .update(values)
    .in('id', ids)

  if (error) {
    console.error(error)
    throw new Error('订单详情更新失败')
  }
}
