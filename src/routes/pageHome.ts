import type { ReactElement } from 'react'
import type { RouteObject } from 'react-router-dom'

import { DEFAULT_HOME_BY_ROLE, type AppRole } from '@/config/access'
import type { PermissionMap } from '@/types/permission'

export interface PagePermissionRoute {
  path: string
  permission: string
}

function findPermissionKey(node: unknown): string | null {
  if (!node || typeof node !== 'object') return null
  const props = (node as ReactElement).props as
    | { permissionKey?: unknown; children?: unknown }
    | undefined
  if (!props) return null
  if (typeof props.permissionKey === 'string') return props.permissionKey
  return findPermissionKey(props.children)
}

function collectPagePermissionRoutes(
  routes: RouteObject[],
  parentPath = '',
): PagePermissionRoute[] {
  const result: PagePermissionRoute[] = []
  for (const r of routes) {
    const segment = r.path ?? ''
    const here = segment
      ? (parentPath.endsWith('/') ? parentPath.slice(0, -1) : parentPath) +
        '/' +
        segment.replace(/^\//, '')
      : parentPath
    const permission = findPermissionKey(r.element)
    if (permission && !here.includes(':')) {
      result.push({
        path: here.startsWith('/') ? here : '/' + here,
        permission,
      })
    }
    if (r.children) {
      result.push(...collectPagePermissionRoutes(r.children, here))
    }
  }
  return result
}

export const PAGE_PERMISSION_ROUTES: PagePermissionRoute[] = []

let cachedRoutes: PagePermissionRoute[] | null = null

async function getPagePermissionRoutes(): Promise<PagePermissionRoute[]> {
  if (cachedRoutes) return cachedRoutes
  // 延迟动态导入以打破 router -> RouteGuards -> pageHome 的循环依赖
  const { router } = await import('./router')
  cachedRoutes = collectPagePermissionRoutes(router.routes as RouteObject[])
  // 同步暴露给可能直接读 PAGE_PERMISSION_ROUTES 的旧调用方
  PAGE_PERMISSION_ROUTES.splice(
    0,
    PAGE_PERMISSION_ROUTES.length,
    ...cachedRoutes,
  )
  return cachedRoutes
}

/**
 * 根据角色 + 实际权限决定登录后默认首页：
 * - 内置角色按 DEFAULT_HOME_BY_ROLE 走快路径，但必须校验默认首页对应的 page:* 权限；
 *   否则降级到 PAGE_PERMISSION_ROUTES，避免登录后被路由守卫弹回 /access-denied。
 * - 自定义角色取 PAGE_PERMISSION_ROUTES 中第一个已授权的页面
 * - 都没有时落到 /access-denied
 */
export async function deriveDefaultHome(
  role: AppRole | string | null,
  permissions: PermissionMap,
): Promise<string> {
  const routes = await getPagePermissionRoutes()
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
export async function userCanAccessPath(
  path: string,
  permissions: PermissionMap,
): Promise<boolean> {
  const routes = await getPagePermissionRoutes()
  const matched = routes.find((r) => r.path === path)
  if (!matched) return true
  return permissions[matched.permission] === true
}
