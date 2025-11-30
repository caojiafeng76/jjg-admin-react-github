import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface Employee {
  id?: string
  name: string
  created_at?: string
  updated_at?: string
}

export async function getEmployees({
  page,
  pageSize,
  name,
}: {
  page: number
  pageSize: number
  name?: string
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('employees')
    .select('*', { count: 'exact' })

  // 姓名搜索（模糊匹配）
  if (name) {
    query = query.ilike('name', `%${name}%`)
  }

  const { data, error, count } = await query
    .range(from, to)
    .order('name', { ascending: true })

  if (error) {
    throw handleApiError(error, '获取员工列表失败')
  }

  return {
    items: (data || []) as Employee[],
    total: count || 0,
  }
}

/**
 * 检查员工姓名是否已存在
 */
async function checkEmployeeNameExists(
  employeeName: string,
  excludeId?: string,
): Promise<boolean> {
  let query = supabase
    .from('employees')
    .select('id')
    .eq('name', employeeName)
    .limit(1)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '检查员工姓名失败')
  }

  return (data?.length || 0) > 0
}

export async function createEmployee(values: Employee) {
  // 检查员工姓名是否已存在
  if (values.name) {
    const exists = await checkEmployeeNameExists(values.name)
    if (exists) {
      throw new Error(`员工姓名 "${values.name}" 已存在，无法创建`)
    }
  }

  const { error } = await supabase.from('employees').insert(values)

  if (error) {
    throw handleApiError(error, '创建员工失败')
  }
}

export async function updateEmployee({
  id,
  values,
}: {
  id: string
  values: Employee
}) {
  // 如果更新了员工姓名，需要检查新姓名是否已被其他记录使用
  if (values.name) {
    const exists = await checkEmployeeNameExists(values.name, id)
    if (exists) {
      throw new Error(`员工姓名 "${values.name}" 已存在，无法更新`)
    }
  }

  const { error } = await supabase
    .from('employees')
    .update(values)
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新员工失败')
  }
}

export async function deleteEmployees(ids: string[]) {
  const { error } = await supabase
    .from('employees')
    .delete()
    .in('id', ids)

  if (error) {
    throw handleApiError(error, '删除员工失败')
  }
}

