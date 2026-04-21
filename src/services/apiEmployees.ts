import type { Database } from './database.types'
import supabase from './supabase'
import { AppError, handleApiError } from '@/utils/errorHandler'

type EmployeeInsert = Database['public']['Tables']['employees']['Insert']
type EmployeeUpdate = Database['public']['Tables']['employees']['Update']

export interface Employee {
  id?: string
  name: string
  auth_user_id?: string | null
  role?: string
  is_active?: boolean
  job_name?: string | null
  hourly_wage?: number
  coefficient?: number
  created_at?: string
  updated_at?: string
}

export interface EmployeeDeleteBlocker {
  employeeId: string
  employeeName: string
  productionOrderCount: number
  orderDates: string[]
}

export interface CreateEmployeeAuthAccountInput {
  employeeId: string
  email: string
  password: string
}

export interface ResetEmployeeAuthPasswordInput {
  employeeId: string
  password: string
}

export interface RebindEmployeeAuthAccountInput {
  employeeId: string
  email: string
}

export interface EmployeeAuthEmailResult {
  employeeId: string
  authUserId: string | null
  email: string | null
}

async function extractFunctionInvokeErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object') {
    return null
  }

  const maybeContext = (
    error as {
      context?: { json?: () => Promise<unknown> }
    }
  ).context

  if (!maybeContext?.json) {
    return null
  }

  try {
    const payload = await maybeContext.json()

    if (
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof payload.error === 'string' &&
      payload.error.trim()
    ) {
      return payload.error.trim()
    }
  } catch {
    return null
  }

  return null
}

async function throwFunctionInvokeError(
  error: unknown,
  fallbackMessage: string,
  code: string,
  functionName: string,
): Promise<never> {
  const message = await extractFunctionInvokeErrorMessage(error)

  if (message) {
    throw new AppError(message, code)
  }

  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message.includes('Failed to send a request to the Edge Function')
  ) {
    throw new AppError(
      `无法访问 Edge Function ${functionName}，请确认该函数已部署且当前网络可连接到 Supabase`,
      code,
    )
  }

  throw handleApiError(error, fallbackMessage)
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
  role,
  is_active,
}: {
  page: number
  pageSize: number
  name?: string
  role?: string
  is_active?: boolean
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from('employees').select('*', { count: 'exact' })

  // 姓名搜索（模糊匹配）
  if (name) {
    query = query.ilike('name', `%${name}%`)
  }

  if (role) {
    query = query.eq('role', role)
  }

  if (typeof is_active === 'boolean') {
    query = query.eq('is_active', is_active)
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

function normalizeEmployeeCreatePayload(values: Employee): EmployeeInsert {
  return {
    name: values.name.trim(),
    auth_user_id: values.auth_user_id?.trim() || null,
    role: values.role || 'employee',
    is_active: values.is_active ?? true,
  }
}

function normalizeEmployeeUpdatePayload(values: Employee): EmployeeUpdate {
  return {
    name: values.name.trim(),
    role: values.role || 'employee',
    is_active: values.is_active ?? true,
    ...(values.auth_user_id !== undefined
      ? {
          auth_user_id: values.auth_user_id?.trim() || null,
        }
      : {}),
  }
}

export async function createEmployee(values: Employee) {
  const payload = normalizeEmployeeCreatePayload(values)

  // 检查员工姓名是否已存在
  if (payload.name) {
    const exists = await checkEmployeeNameExists(payload.name)
    if (exists) {
      throw new Error(`员工姓名 "${payload.name}" 已存在，无法创建`)
    }
  }

  const { data, error } = await supabase
    .from('employees')
    .insert(payload)
    .select()
    .single()

  if (error) {
    throw handleApiError(error, '创建员工失败')
  }

  return data as Employee
}

export async function updateEmployee({
  id,
  values,
}: {
  id: string
  values: Employee
}) {
  const payload = normalizeEmployeeUpdatePayload(values)

  // 如果更新了员工姓名，需要检查新姓名是否已被其他记录使用
  if (payload.name) {
    const exists = await checkEmployeeNameExists(payload.name, id)
    if (exists) {
      throw new Error(`员工姓名 "${payload.name}" 已存在，无法更新`)
    }
  }

  const { error } = await supabase
    .from('employees')
    .update(payload)
    .eq('id', id)

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

export async function getCurrentEmployeeProfile(authUserId: string) {
  const { data, error } = await supabase
    .from('employees')
    .select(
      'id, name, auth_user_id, role, is_active, job_name, hourly_wage, coefficient, created_at, updated_at',
    )
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (error) {
    throw handleApiError(error, '获取当前员工信息失败')
  }

  return (data || null) as Employee | null
}

export async function createEmployeeAuthAccount(
  values: CreateEmployeeAuthAccountInput,
) {
  const { data, error } = await supabase.functions.invoke(
    'create-employee-auth',
    {
      body: {
        employeeId: values.employeeId,
        email: values.email.trim().toLowerCase(),
        password: values.password,
      },
    },
  )

  if (error) {
    await throwFunctionInvokeError(
      error,
      '创建员工登录账号失败',
      'CREATE_EMPLOYEE_AUTH_FAILED',
      'create-employee-auth',
    )
  }

  if (data?.error) {
    throw new AppError(String(data.error), 'CREATE_EMPLOYEE_AUTH_FAILED')
  }

  return data as {
    employeeId: string
    employeeName: string
    userId: string
    email: string
  }
}

export async function resetEmployeeAuthPassword(
  values: ResetEmployeeAuthPasswordInput,
) {
  const { data, error } = await supabase.functions.invoke(
    'reset-employee-auth-password',
    {
      body: {
        employeeId: values.employeeId,
        password: values.password,
      },
    },
  )

  if (error) {
    await throwFunctionInvokeError(
      error,
      '重置员工登录密码失败',
      'RESET_EMPLOYEE_PASSWORD_FAILED',
      'reset-employee-auth-password',
    )
  }

  if (data?.error) {
    throw new AppError(String(data.error), 'RESET_EMPLOYEE_PASSWORD_FAILED')
  }

  return data as {
    employeeId: string
    employeeName: string
  }
}

export async function unbindEmployeeAuthAccount(employeeId: string) {
  const { data, error } = await supabase.functions.invoke(
    'unbind-employee-auth',
    {
      body: { employeeId },
    },
  )

  if (error) {
    await throwFunctionInvokeError(
      error,
      '解绑员工账号失败',
      'UNBIND_EMPLOYEE_AUTH_FAILED',
      'unbind-employee-auth',
    )
  }

  if (data?.error) {
    throw new AppError(String(data.error), 'UNBIND_EMPLOYEE_AUTH_FAILED')
  }

  return data as {
    employeeId: string
    employeeName: string
  }
}

export async function rebindEmployeeAuthAccount(
  values: RebindEmployeeAuthAccountInput,
) {
  const { data, error } = await supabase.functions.invoke(
    'rebind-employee-auth',
    {
      body: {
        employeeId: values.employeeId,
        email: values.email.trim().toLowerCase(),
      },
    },
  )

  if (error) {
    await throwFunctionInvokeError(
      error,
      '重新绑定员工账号失败',
      'REBIND_EMPLOYEE_AUTH_FAILED',
      'rebind-employee-auth',
    )
  }

  if (data?.error) {
    throw new AppError(String(data.error), 'REBIND_EMPLOYEE_AUTH_FAILED')
  }

  return data as {
    employeeId: string
    employeeName: string
    userId: string
    email: string
  }
}

export async function getEmployeeAuthEmail(
  employeeId: string,
): Promise<EmployeeAuthEmailResult> {
  try {
    const { data, error } = await supabase.functions.invoke(
      'get-employee-auth-email',
      {
        body: { employeeId },
      },
    )

    if (error) {
      throw handleApiError(error, '获取员工绑定邮箱失败')
    }

    if (data?.error) {
      throw new AppError(String(data.error), 'GET_EMPLOYEE_AUTH_EMAIL_FAILED')
    }

    return data as EmployeeAuthEmailResult
  } catch (error) {
    console.warn('获取员工绑定邮箱失败，已降级为空值', error)

    return {
      employeeId,
      authUserId: null,
      email: null,
    }
  }
}
