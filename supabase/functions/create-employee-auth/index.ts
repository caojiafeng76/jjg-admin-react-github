import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

import { assertAdmin } from '../_shared/admin.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface CreateEmployeeAuthPayload {
  employeeId?: string
  email?: string
  password?: string
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const authorization = request.headers.get('Authorization')

  if (!supabaseUrl) {
    return jsonResponse({ error: 'Supabase environment not configured' }, 500)
  }

  if (!authorization) {
    return jsonResponse({ error: '未登录，无法创建账号' }, 401)
  }

  let adminClient

  try {
    ;({ adminClient } = await assertAdmin(authorization))
  } catch (error) {
    const message = error instanceof Error ? error.message : '权限校验失败'
    const status = message.includes('登录状态') ? 401 : 403
    return jsonResponse({ error: message }, status)
  }

  let payload: CreateEmployeeAuthPayload

  try {
    payload = await request.json()
  } catch {
    return jsonResponse({ error: '请求体格式不正确' }, 400)
  }

  const employeeId = payload.employeeId?.trim()
  const email = payload.email?.trim().toLowerCase()
  const password = payload.password?.trim()

  if (!employeeId) {
    return jsonResponse({ error: '员工 ID 不能为空' }, 400)
  }

  if (!email) {
    return jsonResponse({ error: '登录邮箱不能为空' }, 400)
  }

  if (!password || password.length < 6) {
    return jsonResponse({ error: '初始密码至少需要 6 位' }, 400)
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

  if (employee.auth_user_id) {
    return jsonResponse({ error: '该员工已绑定账号，如需换绑请先解绑' }, 409)
  }

  const { data: createdUser, error: createUserError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        employee_id: employee.id,
        employee_name: employee.name,
      },
    })

  if (createUserError || !createdUser.user) {
    return jsonResponse(
      {
        error: createUserError?.message || '创建 Auth 用户失败',
      },
      400,
    )
  }

  const { error: bindError } = await adminClient
    .from('employees')
    .update({
      auth_user_id: createdUser.user.id,
      role: employee.role || 'employee',
      is_active: employee.is_active ?? true,
    })
    .eq('id', employee.id)

  if (bindError) {
    await adminClient.auth.admin.deleteUser(createdUser.user.id)

    return jsonResponse({ error: '账号创建成功，但绑定员工失败，已自动回滚' }, 500)
  }

  return jsonResponse({
    employeeId: employee.id,
    employeeName: employee.name,
    userId: createdUser.user.id,
    email,
  })
})