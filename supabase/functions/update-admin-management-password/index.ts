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
    return jsonResponse({ error: '未登录，无法修改管理密码' }, 401)
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

  let payload: { currentPassword?: string; nextPassword?: string }

  try {
    payload = await request.json()
  } catch {
    return jsonResponse({ error: '请求体格式不正确' }, 400)
  }

  const currentPassword = payload.currentPassword?.trim()
  const nextPassword = payload.nextPassword?.trim()

  if (!currentPassword) {
    return jsonResponse({ error: '请输入当前管理密码' }, 400)
  }

  if (!nextPassword || nextPassword.length < 6) {
    return jsonResponse({ error: '新管理密码至少需要 6 位' }, 400)
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
    currentPassword,
    passwordRecord?.password_hash ?? null,
  )

  if (!matched) {
    return jsonResponse({ error: '当前管理密码不正确' }, 401)
  }

  const passwordHash = await hashAdminManagementPassword(nextPassword)
  const { error: upsertError } = await adminClient
    .from('admin_management_passwords')
    .upsert(
      {
        employee_id: adminEmployee.id,
        password_hash: passwordHash,
      },
      { onConflict: 'employee_id' },
    )

  if (upsertError) {
    return jsonResponse({ error: '更新管理密码失败' }, 500)
  }

  return jsonResponse({
    employeeId: adminEmployee.id,
    employeeName: adminEmployee.name,
  })
})