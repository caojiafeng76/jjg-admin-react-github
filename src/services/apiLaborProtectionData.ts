import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface LaborProtectionData {
  id: string
  category: string
  created_at: string
  updated_at: string
}

export interface LaborProtectionDataFormValues {
  category: string
}

export interface LaborProtectionDataOption {
  id: string
  category: string
}

type LaborProtectionDataTable = {
  from: (table: string) => any
}

function laborProtectionDataTable() {
  return (supabase as unknown as LaborProtectionDataTable).from(
    'labor_protection_data',
  )
}

function normalizePayload(
  values: LaborProtectionDataFormValues,
): LaborProtectionDataFormValues {
  return {
    category: values.category.trim(),
  }
}

async function checkLaborProtectionDataExists(
  category: string,
  excludeId?: string,
) {
  let query = laborProtectionDataTable()
    .select('id')
    .eq('category', category)
    .limit(1)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '检查劳保种类是否存在失败')
  }

  return (data?.length || 0) > 0
}

export async function getLaborProtectionDataList({
  page,
  pageSize,
  keyword,
}: {
  page: number
  pageSize: number
  keyword?: string
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = laborProtectionDataTable().select('*', { count: 'exact' })

  if (keyword) {
    query = query.ilike('category', `%${keyword.trim()}%`)
  }

  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .order('category', { ascending: true })
    .range(from, to)

  if (error) {
    throw handleApiError(error, '获取劳保资料列表失败')
  }

  return {
    items: (data || []) as LaborProtectionData[],
    total: count || 0,
  }
}

export async function getLaborProtectionDataOptions() {
  const { data, error } = await laborProtectionDataTable()
    .select('id, category')
    .order('category', { ascending: true })

  if (error) {
    throw handleApiError(error, '获取劳保资料选项失败')
  }

  return (data || []) as LaborProtectionDataOption[]
}

export async function createLaborProtectionData(
  values: LaborProtectionDataFormValues,
) {
  const payload = normalizePayload(values)

  const exists = await checkLaborProtectionDataExists(payload.category)
  if (exists) {
    throw new Error(`劳保种类“${payload.category}”已存在，无法创建`)
  }

  const { error } = await laborProtectionDataTable().insert(payload)

  if (error) {
    throw handleApiError(error, '创建劳保资料失败')
  }
}

export async function updateLaborProtectionData({
  id,
  values,
}: {
  id: string
  values: LaborProtectionDataFormValues
}) {
  const payload = normalizePayload(values)

  const exists = await checkLaborProtectionDataExists(payload.category, id)
  if (exists) {
    throw new Error(`劳保种类“${payload.category}”已存在，无法更新`)
  }

  const { error } = await laborProtectionDataTable()
    .update(payload)
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新劳保资料失败')
  }
}

export async function deleteLaborProtectionData(ids: string[]) {
  const { error } = await laborProtectionDataTable().delete().in('id', ids)

  if (error) {
    throw handleApiError(error, '删除劳保资料失败')
  }
}
