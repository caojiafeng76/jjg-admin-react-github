import { DEFAULT_HOME_BY_ROLE, type AppRole } from '@/config/access'
import type { PermissionMap } from '@/types/permission'
import { PAGE_PERMISSION_ROUTES } from './pagePermissionRoutes'

export { PAGE_PERMISSION_ROUTES }
export type { PagePermissionRoute } from './pagePermissionRoutes'

/**
 * 根据角色 + 实际权限决定登录后默认首页：
 * - 内置角色按 DEFAULT_HOME_BY_ROLE 走快路径，但必须校验默认首页对应的 page:* 权限；
 *   否则降级到 PAGE_PERMISSION_ROUTES，避免登录后被路由守卫弹回 /access-denied。
 * - 自定义角色取 PAGE_PERMISSION_ROUTES 中第一个已授权的页面
 * - 都没有时落到 /access-denied
 */
export function deriveDefaultHome(
  role: AppRole | string | null,
  permissions: PermissionMap,
): string {
  const routes = PAGE_PERMISSION_ROUTES
  if (role && role in DEFAULT_HOME_BY_ROLE) {
    const defaultHome = DEFAULT_HOME_BY_ROLE[role as AppRole]
    const matched = routes.find((r) => r.path === defaultHome)
    // 默认首页若不在 PAGE_PERMISSION_ROUTES（无权限保护）或用户已授权 → 直接走
    if (!matched || permissions[matched.permission] === true) {
      return defaultHome
    }
    // 否则 fall through 到「首个已授权页面」，避免直接撞 access-denied
  }
  for (const { path, permission } of routes) {
    if (permissions[permission] === true) return path
  }
  return '/access-denied'
}

/**
 * 校验当前 permissions 是否允许跳转到指定路径。
 * - 路径不在 PAGE_PERMISSION_ROUTES（公共/无权限保护）→ 视为允许
 * - 路径在 PAGE_PERMISSION_ROUTES 且持有对应权限 → 允许
 * - 否则不允许
 *
 * 仅做精确路径匹配；带动态段（如 /xxx/:id）一律不予自动放行。
 */
export function userCanAccessPath(
  path: string,
  permissions: PermissionMap,
): boolean {
  const routes = PAGE_PERMISSION_ROUTES
  const matched = routes.find((r) => r.path === path)
  if (!matched) return true
  return permissions[matched.permission] === true
}
