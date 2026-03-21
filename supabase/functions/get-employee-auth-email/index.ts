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

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const authorization = request.headers.get('Authorization')

  if (!authorization) {
    return jsonResponse({ error: '未登录，无法获取绑定邮箱' }, 401)
  }

  let adminClient

  try {
    ;({ adminClient } = await assertAdmin(authorization))
  } catch (error) {
    const message = error instanceof Error ? error.message : '权限校验失败'
    const status = message.includes('登录状态') ? 401 : 403
    return jsonResponse({ error: message }, status)
  }

  let payload: { employeeId?: string }

  try {
    payload = await request.json()
  } catch {
    return jsonResponse({ error: '请求体格式不正确' }, 400)
  }

  const employeeId = payload.employeeId?.trim()

  if (!employeeId) {
    return jsonResponse({ error: '员工 ID 不能为空' }, 400)
  }

  const { data: employee, error: employeeError } = await adminClient
    .from('employees')
    .select('id, auth_user_id')
    .eq('id', employeeId)
    .maybeSingle()

  if (employeeError) {
    return jsonResponse({ error: '读取员工信息失败' }, 500)
  }

  if (!employee) {
    return jsonResponse({ error: '员工不存在' }, 404)
  }

  if (!employee.auth_user_id) {
    return jsonResponse({
      employeeId: employee.id,
      authUserId: null,
      email: null,
    })
  }

  const { data: userData, error: userError } =
    await adminClient.auth.admin.getUserById(employee.auth_user_id)

  if (userError) {
    return jsonResponse({ error: '读取 Auth 用户失败' }, 500)
  }

  return jsonResponse({
    employeeId: employee.id,
    authUserId: employee.auth_user_id,
    email: userData.user?.email ?? null,
  })
})