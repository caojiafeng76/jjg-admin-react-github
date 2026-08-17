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

    const { data: syneySpecs, error, count } = await query

    if (error) {
      throw handleApiError(error, '踏板规格列表获取失败')
    }

    return { syneySpecs, count }
  }

  // 全量查询：PostgREST 单次最多返回 1000 条（db-max-rows=1000，limit 也无法突破），
  // 按 1000/页循环拉取，避免规格数据超过 1000 条时被截断。
  const PAGE_SIZE = 1000
  const allSpecs: ISyneySpec[] = []
  let totalCount = 0
  let from = 0

  while (true) {
    const to = from + PAGE_SIZE - 1
    const { data: syneySpecs, error, count } = await supabase
      .from('syney-specs')
      .select('id, PartNo, ParamSpec, PartName, Spec, Unit, created_at', {
        count: 'exact',
      })
      .order('PartNo')
      .range(from, to)

    if (error) {
      throw handleApiError(error, '踏板规格列表获取失败')
    }

    const pageRows = (syneySpecs || []) as ISyneySpec[]
    allSpecs.push(...pageRows)
    totalCount = count ?? 0

    if (pageRows.length < PAGE_SIZE) {
      break
    }

    from += PAGE_SIZE
  }

  return { syneySpecs: allSpecs, count: totalCount }
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
