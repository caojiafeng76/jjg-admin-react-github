import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

export function createAdminClients(authorization: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    throw new Error('Supabase environment not configured')
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authorization,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return { userClient, adminClient }
}

export async function assertAdmin(authorization: string) {
  const { userClient, adminClient } = createAdminClients(authorization)

  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser()

  if (authError || !user) {
    throw new Error('登录状态失效，请重新登录')
  }

  const { data: adminEmployee, error: adminCheckError } = await adminClient
    .from('employees')
    .select('id, name, auth_user_id')
    .eq('auth_user_id', user.id)
    .eq('role', 'admin')
    .eq('is_active', true)
    .maybeSingle()

  if (adminCheckError) {
    throw new Error('管理员权限校验失败')
  }

  if (!adminEmployee) {
    throw new Error('只有管理员可以执行此操作')
  }

  return { user, adminClient, adminEmployee }
}