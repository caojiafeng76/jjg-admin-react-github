import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface PackagingEmployee {
  id: string
  username: string
  name: string
  position_salary: number | null
  remark: string | null
  created_at: string
  updated_at: string
}

export interface PackagingEmployeeFormValues {
  username: string
  name: string
  position_salary: number | null
  remark: string | null
}

type DynamicSupabaseTable = {
  from: (table: string) => any
}

function packagingEmployeeTable() {
  return (supabase as unknown as DynamicSupabaseTable).from(
    'packaging_employees',
  )
}

function normalizeText(value: string | null | undefined) {
  return String(value ?? '').trim()
}

function normalizeTextOrNull(value: string | null | undefined) {
  const trimmed = String(value ?? '').trim()
  return trimmed || null
}

function normalizeNumber(value: number | null | undefined) {
  const normalized = Number(value)
  return Number.isFinite(normalized) ? normalized : null
}

function normalizeFormValues(
  values: PackagingEmployeeFormValues,
): PackagingEmployeeFormValues {
  return {
    username: normalizeText(values.username),
    name: normalizeText(values.name),
    position_salary: normalizeNumber(values.position_salary),
    remark: normalizeTextOrNull(values.remark),
  }
}

export async function getPackagingEmployeeList({
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

  let query = packagingEmployeeTable().select('*', { count: 'exact' })

  if (keyword?.trim()) {
    const normalizedKeyword = keyword.trim()
    query = query.or(
      `username.ilike.%${normalizedKeyword}%,name.ilike.%${normalizedKeyword}%`,
    )
  }

  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (error) {
    throw handleApiError(error, '获取员工列表失败')
  }

  return {
    items: (data || []) as PackagingEmployee[],
    total: count || 0,
  }
}

export async function createPackagingEmployee(
  values: PackagingEmployeeFormValues,
) {
  const payload = normalizeFormValues(values)

  const { error } = await packagingEmployeeTable().insert(payload)

  if (error) {
    throw handleApiError(error, '创建员工失败')
  }
}

export async function updatePackagingEmployee({
  id,
  values,
}: {
  id: string
  values: PackagingEmployeeFormValues
}) {
  const payload = normalizeFormValues(values)

  const { error } = await packagingEmployeeTable().update(payload).eq('id', id)

  if (error) {
    throw handleApiError(error, '更新员工失败')
  }
}

export async function deletePackagingEmployee(ids: string[]) {
  const { error } = await packagingEmployeeTable().delete().in('id', ids)

  if (error) {
    throw handleApiError(error, '删除员工失败')
  }
}
