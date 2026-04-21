import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface RoleRow {
  key: string
  label: string
  description: string | null
  is_builtin: boolean
  created_at: string
}

/** 获取所有角色（内置 + 自定义） */
export async function getRoles(): Promise<RoleRow[]> {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('is_builtin', { ascending: false })
    .order('created_at', { ascending: true })
  if (error) throw handleApiError(error, '角色列表加载失败')
  return data ?? []
}

export interface CreateRoleInput {
  key: string
  label: string
  description?: string | null
  permissionIds?: string[]
}

/** 创建自定义角色，可选同时绑定权限 */
export async function createRole(input: CreateRoleInput): Promise<RoleRow> {
  const { key, label, description, permissionIds } = input
  const { data, error } = await supabase
    .from('roles')
    .insert({
      key,
      label,
      description: description ?? null,
      is_builtin: false,
    })
    .select()
    .single()
  if (error) throw handleApiError(error, '角色创建失败')

  if (permissionIds && permissionIds.length > 0) {
    const rows = permissionIds.map((permission_id) => ({
      role: key,
      permission_id,
    }))
    const { error: rpError } = await supabase
      .from('role_permissions')
      .insert(rows)
    if (rpError) throw handleApiError(rpError, '角色权限初始化失败')
  }

  return data as RoleRow
}

/** 删除自定义角色（内置角色由 RLS 拦截） */
export async function deleteRole(key: string): Promise<void> {
  const { error } = await supabase.from('roles').delete().eq('key', key)
  if (error) throw handleApiError(error, '角色删除失败')
}
