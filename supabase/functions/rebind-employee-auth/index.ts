import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

import { assertAdmin } from '../_shared/admin.ts'
import { corsHeaders } from '../_shared/cors.ts'

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

async function findAuthUserByEmail(
  adminClient: ReturnType<typeof assertAdmin> extends Promise<infer T>
    ? T['adminClient']
    : never,
  email: string,
) {
  let page = 1
  const perPage = 100

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    })

    if (error) {
      throw error
    }

    const matchedUser = data.users.find(
      (item) => item.email?.toLowerCase() === email,
    )

    if (matchedUser) {
      return matchedUser
    }

    if (data.users.length < perPage) {
      return null
    }

    page += 1
  }
}

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const authorization = request.headers.get('Authorization')

  if (!authorization) {
    return jsonResponse({ error: '未登录，无法重新绑定账号' }, 401)
  }

  let adminClient

  try {
    ;({ adminClient } = await assertAdmin(authorization))
  } catch (error) {
    const message = error instanceof Error ? error.message : '权限校验失败'
    const status = message.includes('登录状态') ? 401 : 403
    return jsonResponse({ error: message }, status)
  }

  let payload: { employeeId?: string; email?: string }

  try {
    payload = await request.json()
  } catch {
    return jsonResponse({ error: '请求体格式不正确' }, 400)
  }

  const employeeId = payload.employeeId?.trim()
  const email = payload.email?.trim().toLowerCase()

  if (!employeeId) {
    return jsonResponse({ error: '员工 ID 不能为空' }, 400)
  }

  if (!email) {
    return jsonResponse({ error: '登录邮箱不能为空' }, 400)
  }

  const { data: employee, error: employeeError } = await adminClient
    .from('employees')
    .select('id, name, auth_user_id, role, is_active')
    .eq('id', employeeId)
    .maybeSingle()

  if (employeeError) {
    return jsonResponse({ error: '读取员工信息失败' }, 500)
  }

  if (!employee) {
    return jsonResponse({ error: '员工不存在' }, 404)
  }

  let targetUser

  try {
    targetUser = await findAuthUserByEmail(adminClient, email)
  } catch {
    return jsonResponse({ error: '读取 Auth 用户失败' }, 500)
  }

  if (!targetUser) {
    return jsonResponse({ error: '未找到该邮箱对应的 Auth 账号' }, 404)
  }

  if (employee.auth_user_id === targetUser.id) {
    return jsonResponse({
      employeeId: employee.id,
      employeeName: employee.name,
      userId: targetUser.id,
      email,
    })
  }

  const { data: boundEmployee, error: boundEmployeeError } = await adminClient
    .from('employees')
    .select('id, name')
    .eq('auth_user_id', targetUser.id)
    .neq('id', employee.id)
    .maybeSingle()

  if (boundEmployeeError) {
    return jsonResponse({ error: '读取账号绑定状态失败' }, 500)
  }

  if (boundEmployee) {
    return jsonResponse(
      { error: `该账号已绑定员工“${boundEmployee.name}”，请先解绑后再重绑` },
      409,
    )
  }

  const { error: bindError } = await adminClient
    .from('employees')
    .update({
      auth_user_id: targetUser.id,
      role: employee.role || 'employee',
      is_active: employee.is_active ?? true,
    })
    .eq('id', employee.id)

  if (bindError) {
    return jsonResponse({ error: '重新绑定账号失败' }, 500)
  }

  return jsonResponse({
    employeeId: employee.id,
    employeeName: employee.name,
    userId: targetUser.id,
    email,
  })
})