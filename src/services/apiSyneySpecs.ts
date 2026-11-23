import type { ISyneySpec } from './types'
import { handleApiError } from '@utils/errorHandler'
import supabase from './supabase'

export async function getSyneySpecs({
  PartNo,
  page,
  pageSize,
  isAll,
  signal,
}: {
  PartNo: string
  page: number
  pageSize: number
  isAll: boolean
  signal?: AbortSignal
}) {
  if (!isAll) {
    let query = supabase
      .from('syney-specs')
      // 选择所有ISyneySpec必需的字段,并始终获取准确的总数
      .select('id, PartNo, ParamSpec, PartName, Spec, Unit, created_at', {
        count: 'exact',
      })
      .order('PartNo')

    if (PartNo) {
      query = query.ilike('PartNo', `%${PartNo}%`)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize

    query = query.range(from, to - 1)

    if (signal) {
      query = query.abortSignal(signal)
    }

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
  let totalCount: number
  let from = 0

  while (true) {
    const to = from + PAGE_SIZE - 1
    let pageQuery = supabase
      .from('syney-specs')
      .select('id, PartNo, ParamSpec, PartName, Spec, Unit, created_at', {
        count: 'exact',
      })
      .order('PartNo')
      .range(from, to)

    if (signal) {
      pageQuery = pageQuery.abortSignal(signal)
    }

    const { data: syneySpecs, error, count } = await pageQuery

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

export async function getSyneySpec(id: number, signal?: AbortSignal) {
  let query = supabase
    .from('syney-specs')
    .select('*')
    .eq('id', id)

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data: syneySpec, error } = await query.single()

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
  const { id, ...payload } = updates
  const hasId = typeof id === 'number' && !Number.isNaN(id)
  const partNo = updates.PartNo?.trim()

  if (!hasId && !partNo) {
    throw new Error('踏板规格更新缺少 id 或件号')
  }

  let query = supabase
    .from('syney-specs')
    .update(payload)

  query = hasId ? query.eq('id', id) : query.eq('PartNo', partNo!)

  const { data, error } = await query
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
