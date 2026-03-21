import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface StandardTime {
  id?: string
  operation: string
  model: string
  standard_seconds: number
  created_at?: string
  updated_at?: string
}

function normalizeStandardTimeValue(value: string): string {
  return value.trim()
}

export async function getStandardTimes({
  page,
  pageSize,
  operation,
  model,
}: {
  page: number
  pageSize: number
  operation?: string
  model?: string
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from('process_standards').select('*', { count: 'exact' })

  if (operation) {
    query = query.ilike('operation', `%${operation}%`)
  }

  if (model) {
    query = query.ilike('model', `%${model}%`)
  }

  const { data, error, count } = await query
    .range(from, to)
    .order('operation', { ascending: true })

  if (error) {
    throw handleApiError(error, '获取标准工时列表失败')
  }

  return {
    items: (data || []) as StandardTime[],
    total: count || 0,
  }
}

async function checkStandardTimeExists(
  operation: string,
  model: string,
  excludeId?: string,
): Promise<boolean> {
  let query = supabase
    .from('process_standards')
    .select('id')
    .eq('operation', operation)
    .eq('model', model)
    .limit(1)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '检查标准工时失败')
  }

  return (data?.length || 0) > 0
}

export async function createStandardTime(values: StandardTime) {
  const normalizedValues: StandardTime = {
    ...values,
    operation: normalizeStandardTimeValue(values.operation),
    model: normalizeStandardTimeValue(values.model),
  }

  if (normalizedValues.operation && normalizedValues.model) {
    const exists = await checkStandardTimeExists(
      normalizedValues.operation,
      normalizedValues.model,
    )
    if (exists) {
      throw new Error(
        `工序 "${normalizedValues.operation}" 和型号 "${normalizedValues.model}" 的组合已存在，无法创建`,
      )
    }
  }

  const { error } = await supabase
    .from('process_standards')
    .insert(normalizedValues)

  if (error) {
    throw handleApiError(error, '创建标准工时失败')
  }
}

export async function ensureStandardTimeExists({
  operation,
  model,
  standard_seconds = 0,
}: Pick<StandardTime, 'operation' | 'model'> &
  Partial<Pick<StandardTime, 'standard_seconds'>>) {
  const normalizedOperation = normalizeStandardTimeValue(operation)
  const normalizedModel = normalizeStandardTimeValue(model)

  if (!normalizedOperation || !normalizedModel) {
    throw new Error('工序和型号不能为空')
  }

  const exists = await checkStandardTimeExists(
    normalizedOperation,
    normalizedModel,
  )

  if (exists) {
    return false
  }

  const { error } = await supabase.from('process_standards').insert({
    operation: normalizedOperation,
    model: normalizedModel,
    standard_seconds,
  })

  if (error) {
    if (error.code === '23505') {
      return false
    }

    throw handleApiError(error, '创建标准工时失败')
  }

  return true
}

export async function updateStandardTime({
  id,
  values,
}: {
  id: string
  values: StandardTime
}) {
  if (values.operation && values.model) {
    const exists = await checkStandardTimeExists(
      values.operation,
      values.model,
      id,
    )
    if (exists) {
      throw new Error(
        `工序 "${values.operation}" 和型号 "${values.model}" 的组合已存在，无法更新`,
      )
    }
  }

  const { error } = await supabase
    .from('process_standards')
    .update(values)
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新标准工时失败')
  }
}

export async function deleteStandardTimes(ids: string[]) {
  const { error } = await supabase
    .from('process_standards')
    .delete()
    .in('id', ids)

  if (error) {
    if (error.code === '23503') {
      throw new Error('标准工时已被工序明细引用，不能删除')
    }

    throw handleApiError(error, '删除标准工时失败')
  }
}
