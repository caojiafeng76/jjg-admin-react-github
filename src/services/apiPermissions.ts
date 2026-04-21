import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'
import type { PermissionDefinition, PermissionMap } from '@/types/permission'

export async function getMyPermissions(): Promise<PermissionMap> {
  const { data, error } = await supabase.rpc('get_my_permissions')
  if (error) throw handleApiError(error, '权限加载失败')
  const map: PermissionMap = {}
  for (const row of data ?? []) {
    map[row.key] = row.enabled
  }
  return map
}

export async function syncPermissionRegistry(
  registry: PermissionDefinition[],
): Promise<void> {
  if (registry.length === 0) return
  const rows = registry.map(
    ({ key, scope, module, surface, label, description }) => ({
      key,
      scope,
      module,
      surface,
      label,
      description: description ?? null,
    }),
  )
  const { error } = await supabase
    .from('permissions')
    .upsert(rows, { onConflict: 'key', ignoreDuplicates: true })
  if (error) throw handleApiError(error, '权限注册表同步失败')
}

// ----------------------------------------------------------------
// 权限管理后台 API
// ----------------------------------------------------------------

export interface PermissionRow {
  id: string
  key: string
  scope: string
  module: string
  surface: string
  label: string
  description: string | null
  created_at: string
}

export interface UserOverrideRow {
  id: string
  employee_id: string
  permission_id: string
  enabled: boolean
  created_at: string
}

/** 获取所有权限定义（按 module + scope 排序） */
export async function getAllPermissions(): Promise<PermissionRow[]> {
  const { data, error } = await supabase
    .from('permissions')
    .select('*')
    .order('module')
    .order('scope')
  if (error) throw handleApiError(error, '权限列表加载失败')
  return data ?? []
}

/** 获取某角色已绑定的 permission_id 数组 */
export async function getRolePermissionIds(role: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('role_permissions')
    .select('permission_id')
    .eq('role', role)
  if (error) throw handleApiError(error, '角色权限加载失败')
  return (data ?? []).map((r) => r.permission_id)
}

/** 批量替换角色权限（先删除旧绑定，再插入新绑定） */
export async function setRolePermissions(
  role: string,
  permissionIds: string[],
): Promise<void> {
  const { error: delError } = await supabase
    .from('role_permissions')
    .delete()
    .eq('role', role)
  if (delError) throw handleApiError(delError, '角色权限更新失败（清除旧记录）')

  if (permissionIds.length === 0) return

  const rows = permissionIds.map((permission_id) => ({ role, permission_id }))
  const { error: insError } = await supabase
    .from('role_permissions')
    .insert(rows)
  if (insError) throw handleApiError(insError, '角色权限更新失败（写入新记录）')
}

/** 获取某员工的权限覆盖记录 */
export async function getUserPermissionOverrides(
  employeeId: string,
): Promise<UserOverrideRow[]> {
  const { data, error } = await supabase
    .from('user_permission_overrides')
    .select('*')
    .eq('employee_id', employeeId)
  if (error) throw handleApiError(error, '用户权限覆盖加载失败')
  return data ?? []
}

/** 批量替换用户权限覆盖（先删除旧记录，再插入新记录） */
export async function setUserPermissionOverrides(
  employeeId: string,
  overrides: Array<{ permissionId: string; enabled: boolean }>,
): Promise<void> {
  const { error: delError } = await supabase
    .from('user_permission_overrides')
    .delete()
    .eq('employee_id', employeeId)
  if (delError)
    throw handleApiError(delError, '用户权限覆盖更新失败（清除旧记录）')

  if (overrides.length === 0) return

  const rows = overrides.map(({ permissionId, enabled }) => ({
    employee_id: employeeId,
    permission_id: permissionId,
    enabled,
  }))
  const { error: insError } = await supabase
    .from('user_permission_overrides')
    .insert(rows)
  if (insError)
    throw handleApiError(insError, '用户权限覆盖更新失败（写入新记录）')
}
