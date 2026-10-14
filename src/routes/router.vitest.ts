import type { RouteObject } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { PAGE_PERMISSION_ROUTES } from './pagePermissionRoutes'
import type { PermissionRouteHandle } from './routeHelpers'
import { router } from './router'

const layoutRoute = (router.routes as RouteObject[]).find(
  (route) => route.path === '/',
)
const childRoutes = layoutRoute?.children ?? []

function getPermission(route: RouteObject): string | undefined {
  return (route.handle as PermissionRouteHandle | undefined)?.permission
}

describe('router', () => {
  it('布局内路由路径不重复', () => {
    const paths = childRoutes.flatMap((route) =>
      route.path ? [route.path] : [],
    )

    expect(new Set(paths).size).toBe(paths.length)
  })

  it('PAGE_PERMISSION_ROUTES 中的每个页面都有同路径、同权限的路由', () => {
    const permissionByPath = new Map(
      childRoutes.map((route) => [`/${route.path}`, getPermission(route)]),
    )

    for (const { path, permission } of PAGE_PERMISSION_ROUTES) {
      expect(permissionByPath.get(path), path).toBe(permission)
    }
  })
})
