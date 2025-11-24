import { ISyneySpec } from './types'
import supabase from './supabase'
import { handleApiError } from '@utils/errorHandler'

export async function getSyneySpecs({
  PartNo,
  page,
  pageSize,
  isAll,
}: {
  PartNo: string
  page: number
  pageSize: number
  isAll: boolean
}) {
  let query = supabase
    .from('syney-specs')
    // 选择所有ISyneySpec必需的字段,并始终获取准确的总数
    .select('id, PartNo, ParamSpec, PartName, Spec, Unit, created_at', {
      count: 'exact',
    })
    .order('PartNo')

  if (!isAll) {
    if (PartNo) {
      query = query.ilike('PartNo', `%${PartNo}%`)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize

    query = query.range(from, to - 1)
  } else {
    // 即使是全量查询,也添加合理的上限保护
    query = query.limit(1000)
  }

  const { data: syneySpecs, error, count } = await query

  if (error) {
    throw handleApiError(error, '踏板规格列表获取失败')
  }

  return { syneySpecs, count }
}

export async function getSyneySpec(id: number) {
  const { data: syneySpec, error } = await supabase
    .from('syney-specs')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw handleApiError(error, '踏板规格获取失败')
  }

  return syneySpec
}

export async function createSyneySpec(newSyneySpec: ISyneySpec) {
  // console.log(newSyneySpec);

  const { data, error } = await supabase
    .from('syney-specs')
    .insert([newSyneySpec])
    .select()
    .single()

  if (error) {
    throw handleApiError(error, '踏板规格创建失败')
  }

  return data
}

export async function updateSyneySpec(updates: Partial<ISyneySpec>) {
  const { data, error } = await supabase
    .from('syney-specs')
    .update(updates)
    .eq('PartNo', updates.PartNo!)
    .select()
    .single()

  if (error) {
    throw handleApiError(error, '踏板规格更新失败')
  }
  return data
}

export async function deleteSyneySpecs(ids: number[]) {
  const { error } = await supabase.from('syney-specs').delete().in('id', ids)

  if (error) {
    throw handleApiError(error, '踏板规格删除失败')
  }
}
