import supabase from './supabase'
import { AppError, handleApiError } from '@/utils/errorHandler'

export interface Employee {
  id?: string
  name: string
  created_at?: string
  updated_at?: string
}

export interface EmployeeDeleteBlocker {
  employeeId: string
  employeeName: string
  productionOrderCount: number
  orderDates: string[]
}

function formatBlockedNames(names: string[], fallbackLabel: string) {
  if (names.length === 0) return fallbackLabel
  if (names.length <= 3) return names.join('、')

  return `${names.slice(0, 3).join('、')} 等${names.length}人`
}

async function assertEmployeesNotReferenced(ids: string[]) {
  const blockers = await getEmployeeDeleteBlockers(ids)

  if (blockers.length === 0) {
    return
  }

  throw new AppError(
    `员工 ${formatBlockedNames(
      blockers.map((item) => item.employeeName),
      '所选员工',
    )} 已关联生产工单，无法删除`,
    'FOREIGN_KEY_CONSTRAINT',
  )
}

export async function getEmployeeDeleteBlockers(
  ids: string[],
): Promise<EmployeeDeleteBlocker[]> {
  const { data: employees, error: employeesError } = await supabase
    .from('employees')
    .select('id, name')
    .in('id', ids)

  if (employeesError) {
    throw handleApiError(employeesError, '检查员工引用失败')
  }

  const { data: referencedOrders, error: referenceError } = await supabase
    .from('production_orders')
    .select('id, employee_id, order_date')
    .in('employee_id', ids)

  if (referenceError) {
    throw handleApiError(referenceError, '检查员工引用失败')
  }

  const employeeMap = new Map(
    (employees || []).map((employee) => [employee.id, employee.name]),
  )
  const grouped = new Map<string, { count: number; dates: Set<string> }>()

  ;(referencedOrders || []).forEach((order) => {
    if (!order.employee_id) return

    const current = grouped.get(order.employee_id) || {
      count: 0,
      dates: new Set<string>(),
    }

    current.count += 1

    if (order.order_date) {
      current.dates.add(order.order_date)
    }

    grouped.set(order.employee_id, current)
  })

  return Array.from(grouped.entries()).map(([employeeId, info]) => ({
    employeeId,
    employeeName: employeeMap.get(employeeId) || '未命名员工',
    productionOrderCount: info.count,
    orderDates: Array.from(info.dates).sort((left, right) =>
      right.localeCompare(left),
    ),
  }))
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

  let query = supabase.from('employees').select('*', { count: 'exact' })

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

  const { error } = await supabase.from('employees').update(values).eq('id', id)

  if (error) {
    throw handleApiError(error, '更新员工失败')
  }
}

export async function deleteEmployees(ids: string[]) {
  await assertEmployeesNotReferenced(ids)

  const { error } = await supabase.from('employees').delete().in('id', ids)

  if (error) {
    if (error.code === '23503') {
      throw new AppError(
        '所选员工已关联生产工单，无法删除',
        'FOREIGN_KEY_CONSTRAINT',
      )
    }
    throw handleApiError(error, '删除员工失败')
  }
}

/**
 * 批量创建员工
 * @param names 员工姓名数组
 * @returns 成功创建的数量和失败的数量
 */
export async function batchCreateEmployees(names: string[]) {
  if (!names || names.length === 0) {
    throw new Error('员工姓名列表不能为空')
  }

  // 过滤掉空字符串和重复的姓名
  const uniqueNames = Array.from(new Set(names.filter((name) => name.trim())))

  if (uniqueNames.length === 0) {
    throw new Error('没有有效的员工姓名')
  }

  // 准备插入数据
  const employees = uniqueNames.map((name) => ({ name: name.trim() }))

  // 批量插入，使用 ON CONFLICT 忽略已存在的记录
  const { data, error } = await supabase
    .from('employees')
    .insert(employees)
    .select()

  if (error) {
    throw handleApiError(error, '批量创建员工失败')
  }

  return {
    success: data?.length || 0,
    total: uniqueNames.length,
  }
}

export async function getAllEmployees() {
  const { data, error } = await supabase
    .from('employees')
    .select('id, name')
    .order('name', { ascending: true })

  if (error) {
    throw handleApiError(error, '获取员工列表失败')
  }

  return (data || []) as { id: string; name: string }[]
}
