import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface JintanPartsData {
  id: string
  part_name: string
  specification: string
  material: string
  supplier: string
  remarks: string
  created_at: string
  updated_at: string
}

export interface JintanPartsDataFormValues {
  part_name: string
  specification: string
  material: string
  supplier: string
  remarks: string
}

function normalizePayload(
  values: JintanPartsDataFormValues,
): JintanPartsDataFormValues {
  return {
    part_name: values.part_name.trim(),
    specification: values.specification.trim(),
    material: values.material.trim(),
    supplier: values.supplier.trim(),
    remarks: values.remarks.trim(),
  }
}

async function checkJintanPartsDataExists(
  partName: string,
  specification: string,
  excludeId?: string,
) {
  let query = supabase
    .from('jintan_parts_data')
    .select('id')
    .eq('part_name', partName)
    .eq('specification', specification)
    .limit(1)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '检查配件是否存在失败')
  }

  return (data?.length || 0) > 0
}

export async function getJintanPartsDataList({
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

  let query = supabase.from('jintan_parts_data').select('*', { count: 'exact' })

  if (keyword) {
    const normalizedKeyword = keyword.trim()
    query = query.or(
      `part_name.ilike.%${normalizedKeyword}%,specification.ilike.%${normalizedKeyword}%,material.ilike.%${normalizedKeyword}%,supplier.ilike.%${normalizedKeyword}%`,
    )
  }

  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .order('part_name', { ascending: true })
    .range(from, to)

  if (error) {
    throw handleApiError(error, '获取配件资料列表失败')
  }

  return {
    items: (data || []) as JintanPartsData[],
    total: count || 0,
  }
}

export async function createJintanPartsData(values: JintanPartsDataFormValues) {
  const payload = normalizePayload(values)

  const exists = await checkJintanPartsDataExists(
    payload.part_name,
    payload.specification,
  )
  if (exists) {
    throw new Error(
      `名称“${payload.part_name}”规格“${payload.specification}”已存在，无法创建`,
    )
  }

  const { error } = await supabase.from('jintan_parts_data').insert(payload)

  if (error) {
    throw handleApiError(error, '创建配件资料失败')
  }
}

export async function updateJintanPartsData({
  id,
  values,
}: {
  id: string
  values: JintanPartsDataFormValues
}) {
  const payload = normalizePayload(values)

  const exists = await checkJintanPartsDataExists(
    payload.part_name,
    payload.specification,
    id,
  )
  if (exists) {
    throw new Error(
      `名称“${payload.part_name}”规格“${payload.specification}”已存在，无法更新`,
    )
  }

  const { error } = await supabase
    .from('jintan_parts_data')
    .update(payload)
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新配件资料失败')
  }
}

export async function deleteJintanPartsData(ids: string[]) {
  const { error } = await supabase.from('jintan_parts_data').delete().in('id', ids)

  if (error) {
    throw handleApiError(error, '删除配件资料失败')
  }
}
