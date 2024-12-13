import { ISyneyItem } from '@/types'
import supabase from './supabase'

export async function updateSyneyStoreReport({ item }: { item: ISyneyItem }) {
  const { error: updateItemError } = await supabase
    .from('syney-store-report-items')
    .update({
      ...item,
    })
    .eq('id', item.id!)
    .select()
    .single()

  if (updateItemError) {
    console.error(updateItemError)
    throw new Error('更新入库单条目失败')
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
    console.error(insertSpecError)
    throw new Error('创建踏板规格失败')
  }
}

export async function deleteSyneyStoreReportItems(ids: string[]) {
  const { error } = await supabase
    .from('syney-store-report-items')
    .delete()
    .in('id', ids.map(Number))

  if (error) {
    console.error(error)
    throw new Error('删除入库单条目失败')
  }
}
