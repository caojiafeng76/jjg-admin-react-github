import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface WorkshopDefectReason {
  id?: string
  defect_reason: string
  created_at?: string
  updated_at?: string
}

export async function getWorkshopDefectReasons({
  page,
  pageSize,
  defect_reason,
}: {
  page: number
  pageSize: number
  defect_reason?: string
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('workshop_defect_reasons' as any)
    .select('*', { count: 'exact' })

  // 不良原因搜索（模糊匹配）
  if (defect_reason) {
    query = query.ilike('defect_reason', `%${defect_reason}%`)
  }

  const { data, error, count } = await query
    .range(from, to)
    .order('defect_reason', { ascending: true })

  if (error) {
    throw handleApiError(error, '获取不良原因列表失败')
  }

  return {
    items: ((data || []) as unknown) as WorkshopDefectReason[],
    total: count || 0,
  }
}

/**
 * 检查不良原因是否已存在
 */
async function checkDefectReasonExists(
  defectReason: string,
  excludeId?: string,
): Promise<boolean> {
  let query = supabase
    .from('workshop_defect_reasons' as any)
    .select('id')
    .eq('defect_reason', defectReason)
    .limit(1)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '检查不良原因失败')
  }

  return (data?.length || 0) > 0
}

export async function createWorkshopDefectReason(values: WorkshopDefectReason) {
  // 检查不良原因是否已存在
  if (values.defect_reason) {
    const exists = await checkDefectReasonExists(values.defect_reason)
    if (exists) {
      throw new Error(`不良原因 "${values.defect_reason}" 已存在，无法创建`)
    }
  }

  const { error } = await supabase.from('workshop_defect_reasons' as any).insert(values as any)

  if (error) {
    throw handleApiError(error, '创建不良原因失败')
  }
}

export async function updateWorkshopDefectReason({
  id,
  values,
}: {
  id: string
  values: WorkshopDefectReason
}) {
  // 如果更新了不良原因，需要检查新名称是否已被其他记录使用
  if (values.defect_reason) {
    const exists = await checkDefectReasonExists(values.defect_reason, id)
    if (exists) {
      throw new Error(`不良原因 "${values.defect_reason}" 已存在，无法更新`)
    }
  }

  const { error } = await supabase
    .from('workshop_defect_reasons' as any)
    .update(values as any)
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新不良原因失败')
  }
}

export async function deleteWorkshopDefectReasons(ids: string[]) {
  const { error } = await supabase
    .from('workshop_defect_reasons' as any)
    .delete()
    .in('id', ids)

  if (error) {
    throw handleApiError(error, '删除不良原因失败')
  }
}

