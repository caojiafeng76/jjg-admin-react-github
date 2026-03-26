import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

import {
  hashAdminManagementPassword,
  verifyAdminManagementPassword,
} from '../_shared/admin-management-password.ts'
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
    return jsonResponse({ error: '未登录，无法验证管理密码' }, 401)
  }

  let adminClient
  let adminEmployee

  try {
    ;({ adminClient, adminEmployee } = await assertAdmin(authorization))
  } catch (error) {
    const message = error instanceof Error ? error.message : '权限校验失败'
    const status = message.includes('登录状态') ? 401 : 403
    return jsonResponse({ error: message }, status)
  }

  let payload: { password?: string }

  try {
    payload = await request.json()
  } catch {
    return jsonResponse({ error: '请求体格式不正确' }, 400)
  }

  const password = payload.password?.trim()

  if (!password) {
    return jsonResponse({ error: '请输入管理密码' }, 400)
  }

  const { data: passwordRecord, error: passwordError } = await adminClient
    .from('admin_management_passwords')
    .select('employee_id, password_hash')
    .eq('employee_id', adminEmployee.id)
    .maybeSingle()

  if (passwordError) {
    return jsonResponse({ error: '读取管理密码失败' }, 500)
  }

  const matched = await verifyAdminManagementPassword(
    password,
    passwordRecord?.password_hash ?? null,
  )

  if (!matched) {
    return jsonResponse({ error: '管理密码错误' }, 401)
  }

  if (!passwordRecord) {
    const passwordHash = await hashAdminManagementPassword(password)
    const { error: insertError } = await adminClient
      .from('admin_management_passwords')
      .insert({
        employee_id: adminEmployee.id,
        password_hash: passwordHash,
      })

    if (insertError) {
      return jsonResponse({ error: '初始化管理密码失败' }, 500)
    }
  }

  return jsonResponse({ verified: true })
})