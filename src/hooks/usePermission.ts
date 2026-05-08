import type { FieldPermissionState } from '@/types/permission'
import { usePermissionContext } from '@/contexts'

/** 检查单个权限是否开启 */
export function usePermission(key: string): boolean {
  const { can } = usePermissionContext()
  return can(key)
}

/** 检查 feature 权限：`feature:{module}.{action}` */
export function useFeaturePermission(module: string, action: string): boolean {
  return usePermission(`feature:${module}.${action}`)
}

/** 批量检查多个权限，返回 key→boolean 的 map */
export function usePermissions(keys: string[]): Record<string, boolean> {
  const { permissions } = usePermissionContext()
  const result: Record<string, boolean> = {}
  for (const key of keys) {
    result[key] = permissions[key] === true
  }
  return result
}

/**
 * field 权限三态推导：
 * - `field:{module}.{fieldName}.view` 为 false → hidden
 * - `field:{module}.{fieldName}.edit` 为 false → readonly
 * - 否则 → editable
 */
export function useFieldPermission(
  module: string,
  fieldName: string,
): FieldPermissionState {
  const { can } = usePermissionContext()
  if (!can(`field:${module}.${fieldName}.view`)) return 'hidden'
  if (!can(`field:${module}.${fieldName}.edit`)) return 'readonly'
  return 'editable'
}
