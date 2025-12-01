import supabase from './supabase'
import { AppError, handleApiError } from '@/utils/errorHandler'

export interface WorkshopProcess {
  id?: string
  process_name: string
  created_at?: string
  updated_at?: string
}

export async function getWorkshopProcesses({
  page,
  pageSize,
  process_name,
}: {
  page: number
  pageSize: number
  process_name?: string
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('workshop_processes')
    .select('*', { count: 'exact' })

  // 工序名称搜索（模糊匹配）
  if (process_name) {
    query = query.ilike('process_name', `%${process_name}%`)
  }

  const { data, error, count } = await query
    .range(from, to)
    .order('process_name', { ascending: true })

  if (error) {
    throw handleApiError(error, '获取工序列表失败')
  }

  return {
    items: (data || []) as WorkshopProcess[],
    total: count || 0,
  }
}

/**
 * 检查工序名称是否已存在
 */
async function checkProcessNameExists(
  processName: string,
  excludeId?: string,
): Promise<boolean> {
  let query = supabase
    .from('workshop_processes')
    .select('id')
    .eq('process_name', processName)
    .limit(1)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '检查工序名称失败')
  }

  return (data?.length || 0) > 0
}

export async function createWorkshopProcess(values: WorkshopProcess) {
  // 检查工序名称是否已存在
  if (values.process_name) {
    const exists = await checkProcessNameExists(values.process_name)
    if (exists) {
      throw new Error(`工序名称 "${values.process_name}" 已存在，无法创建`)
    }
  }

  const { error } = await supabase.from('workshop_processes').insert(values)

  if (error) {
    throw handleApiError(error, '创建工序失败')
  }
}

export async function updateWorkshopProcess({
  id,
  values,
}: {
  id: string
  values: WorkshopProcess
}) {
  // 如果更新了工序名称，需要检查新名称是否已被其他记录使用
  if (values.process_name) {
    const exists = await checkProcessNameExists(values.process_name, id)
    if (exists) {
      throw new Error(`工序名称 "${values.process_name}" 已存在，无法更新`)
    }
  }

  const { error } = await supabase
    .from('workshop_processes')
    .update(values)
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新工序失败')
  }
}

export async function deleteWorkshopProcesses(ids: string[]) {
  const { error } = await supabase
    .from('workshop_processes')
    .delete()
    .in('id', ids)

  if (error) {
    if (error.code === '23503') {
      throw new AppError(
        '该工序已关联生产数据，无法删除',
        'FOREIGN_KEY_CONSTRAINT',
      )
    }
    throw handleApiError(error, '删除工序失败')
  }
}

