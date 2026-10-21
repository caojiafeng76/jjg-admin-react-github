import type { ComponentType } from 'react'
import type { RouteObject } from 'react-router-dom'
import Loading from '@ui/Loading'
import PageErrorBoundary from '@ui/PageErrorBoundary'
import { Suspense } from 'react'

import { Navigate } from 'react-router-dom'
import RouteErrorPage from '@/pages/RouteErrorPage'
import { PermissionProtectedRoute } from './RouteGuards'

export interface PermissionRouteHandle {
  permission: string
}

/**
 * 登录后布局内的页面：页面级错误边界 + 懒加载 + 页面权限守卫
 * 页面出错只替换当前内容区，菜单与其他缓存标签页不受影响
 */
export function permissionRoute(
  path: string,
  permissionKey: string,
  Page: ComponentType,
): RouteObject {
  return {
    path,
    handle: { permission: permissionKey } satisfies PermissionRouteHandle,
    element: (
      <PageErrorBoundary>
        <Suspense fallback={<Loading />}>
          <PermissionProtectedRoute
            permissionKey={permissionKey}
            element={<Page />}
          />
        </Suspense>
      </PageErrorBoundary>
    ),
  }
}

/** 旧地址兼容：重定向到新地址 */
export function redirectRoute(path: string, to: string): RouteObject {
  return {
    path,
    element: <Navigate to={to} replace />,
  }
}

/** 布局外的顶层页面（登录、公开扫码页等）：懒加载 + 独立错误页 */
export function publicRoute(path: string, Page: ComponentType): RouteObject {
  return {
    path,
    errorElement: <RouteErrorPage />,
    element: (
      <Suspense fallback={<Loading />}>
        <Page />
      </Suspense>
    ),
  }
}
