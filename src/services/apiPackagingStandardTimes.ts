import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface PackagingStandardTime {
  id: string
  model: string
  length: number
  part_no: string | null
  standard_seconds: number
  remark: string | null
  created_at: string
  updated_at: string
}

export interface PackagingStandardTimeFormValues {
  model: string
  length: number
  part_no: string | null
  standard_seconds: number
  remark: string | null
}

type DynamicSupabaseTable = {
  from: (table: string) => any
}

function packagingStandardTimeTable() {
  return (supabase as unknown as DynamicSupabaseTable).from(
    'packaging_standard_times',
  )
}

function normalizeText(value: string | null | undefined) {
  return String(value ?? '').trim() || null
}

function normalizeNumber(value: number | null | undefined) {
  const normalized = Number(value)
  return Number.isFinite(normalized) ? normalized : 0
}

function normalizeFormValues(
  values: PackagingStandardTimeFormValues,
): PackagingStandardTimeFormValues {
  return {
    model: String(values.model ?? '').trim(),
    length: normalizeNumber(values.length),
    part_no: normalizeText(values.part_no),
    standard_seconds: normalizeNumber(values.standard_seconds),
    remark: normalizeText(values.remark),
  }
}

export async function getPackagingStandardTimeList({
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

  let query = packagingStandardTimeTable().select('*', { count: 'exact' })

  if (keyword?.trim()) {
    const normalizedKeyword = keyword.trim()
    query = query.or(
      `model.ilike.%${normalizedKeyword}%,part_no.ilike.%${normalizedKeyword}%`,
    )
  }

  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (error) {
    throw handleApiError(error, '获取标准工时列表失败')
  }

  return {
    items: (data || []) as PackagingStandardTime[],
    total: count || 0,
  }
}

export async function createPackagingStandardTime(
  values: PackagingStandardTimeFormValues,
) {
  const payload = normalizeFormValues(values)

  const { error } = await packagingStandardTimeTable().insert(payload)

  if (error) {
    throw handleApiError(error, '创建标准工时失败')
  }
}

export async function updatePackagingStandardTime({
  id,
  values,
}: {
  id: string
  values: PackagingStandardTimeFormValues
}) {
  const payload = normalizeFormValues(values)

  const { error } = await packagingStandardTimeTable().update(payload).eq('id', id)

  if (error) {
    throw handleApiError(error, '更新标准工时失败')
  }
}

export async function deletePackagingStandardTime(ids: string[]) {
  const { error } = await packagingStandardTimeTable().delete().in('id', ids)

  if (error) {
    throw handleApiError(error, '删除标准工时失败')
  }
}
