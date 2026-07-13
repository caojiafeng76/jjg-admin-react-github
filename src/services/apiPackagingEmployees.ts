import { handleApiError } from '@/utils/errorHandler'
import { buildPostgrestOrIlikeFilter } from '@/utils/postgrestFilters'
import supabase from './supabase'

export interface PackagingEmployee {
  id: string
  username: string
  name: string
  position_salary: number | null
  hourly_wage: number
  remark: string | null
  created_at: string
  updated_at: string
}

export interface PackagingEmployeeFormValues {
  username: string
  name: string
  position_salary: number | null
  hourly_wage?: number | null
  remark: string | null
}

export type PackagingEmployeeOption = Pick<
  PackagingEmployee,
  'id' | 'name' | 'username'
>

export const DEFAULT_PACKAGING_EMPLOYEE_HOURLY_WAGE = 19

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

function normalizeNumber(
  value: number | null | undefined,
  fallback: number | null = null,
) {
  const normalized = Number(value)
  return Number.isFinite(normalized) ? normalized : fallback
}

export function buildPackagingEmployeePayload(
  values: PackagingEmployeeFormValues,
): PackagingEmployeeFormValues {
  return {
    username: normalizeText(values.username),
    name: normalizeText(values.name),
    position_salary: normalizeNumber(values.position_salary),
    hourly_wage: normalizeNumber(
      values.hourly_wage,
      DEFAULT_PACKAGING_EMPLOYEE_HOURLY_WAGE,
    ),
    remark: normalizeTextOrNull(values.remark),
  }
}

export async function getPackagingEmployeeList({
  page,
  pageSize,
  keyword,
  signal,
}: {
  page: number
  pageSize: number
  keyword?: string
  signal?: AbortSignal
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = packagingEmployeeTable().select('*', { count: 'exact' })

  if (keyword?.trim()) {
    const normalizedKeyword = keyword.trim()
    query = query.or(
      buildPostgrestOrIlikeFilter(['username', 'name'], normalizedKeyword),
    )
  }

  let request = query.order('updated_at', { ascending: false }).range(from, to)

  if (signal) {
    request = request.abortSignal(signal)
  }

  const { data, error, count } = await request

  if (error) {
    throw handleApiError(error, '获取员工列表失败')
  }

  return {
    items: (data || []) as PackagingEmployee[],
    total: count || 0,
  }
}

export async function getPackagingEmployeeOptions({
  keyword,
  limit = 50,
  signal,
}: {
  keyword?: string
  limit?: number
  signal?: AbortSignal
}) {
  const requestedLimit =
    typeof limit === 'number' && Number.isFinite(limit) ? Math.trunc(limit) : 50
  const normalizedLimit = Math.min(50, Math.max(1, requestedLimit))
  const normalizedKeyword = keyword?.trim() ?? ''

  let query = packagingEmployeeTable().select('id,name,username')

  if (normalizedKeyword) {
    query = query.or(
      buildPostgrestOrIlikeFilter(['username', 'name'], normalizedKeyword),
    )
  }

  let request = query
    .order('name', { ascending: true })
    .order('id', { ascending: true })
    .limit(normalizedLimit)

  if (signal) {
    request = request.abortSignal(signal)
  }

  const { data, error } = await request

  if (error) {
    throw handleApiError(error, '获取员工选项失败')
  }

  return {
    items: (data || []) as PackagingEmployeeOption[],
  }
}

export async function createPackagingEmployee(
  values: PackagingEmployeeFormValues,
) {
  const payload = buildPackagingEmployeePayload(values)

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
  const payload = buildPackagingEmployeePayload(values)

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
