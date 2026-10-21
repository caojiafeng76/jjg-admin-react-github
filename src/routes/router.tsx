import AppLayout from '@ui/AppLayout'
import Loading from '@ui/Loading'

import { Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { JINTAN_PARTS_STOCK_OUT_PUBLIC_QR_PATH } from '@/features/jintan/PartsStockOut/jintanPartsStockOutPublicQr'
import { LABOR_PROTECTION_PUBLIC_QR_PATH } from '@/features/labor-protection/LaborProtectionRequisition/laborProtectionPublicQr'
import { TOOLING_FIXTURE_PUBLIC_QR_PATH } from '@/features/tooling-fixture/toolingFixturePublicQr'
import { TOOLING_STOCK_OUT_PUBLIC_QR_PATH } from '@/features/tooling/ToolingStockOut/toolingStockOutPublicQr'
import RouteErrorPage from '@/pages/RouteErrorPage'
import {
  AccessDenied,
  JintanPartsStockOutPublicPage,
  LaborProtectionPublicRequisitionPage,
  Login,
  PageNotFound,
  ToolingFixturePublicPage,
  ToolingStockOutPublicPage,
} from './lazyPages'
import { jintanRoutes, youmaiRoutes } from './modules/inventoryRoutes'
import { packagingRoutes, villaLiftRoutes } from './modules/processRoutes'
import { productionRoutes } from './modules/productionRoutes'
import { syneyRoutes } from './modules/syneyRoutes'
import { systemRoutes } from './modules/systemRoutes'
import { toolingRoutes } from './modules/toolingRoutes'
import { workshopRoutes } from './modules/workshopRoutes'
import { ProtectedRoute, RoleHomeRedirect } from './RouteGuards'
import { publicRoute } from './routeHelpers'

// 新增页面：在对应业务域的 modules/*Routes.ts 中用 permissionRoute 注册，
// 并同步 pagePermissionRoutes.ts（router.vitest.ts 会校验两者一致）
export const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <RouteErrorPage />,
    element: (
      <Suspense fallback={<Loading />}>
        <ProtectedRoute element={<AppLayout />} />
      </Suspense>
    ),
    children: [
      { index: true, element: <RoleHomeRedirect /> },
      ...systemRoutes,
      ...syneyRoutes,
      ...workshopRoutes,
      ...productionRoutes,
      ...toolingRoutes,
      ...youmaiRoutes,
      ...jintanRoutes,
      ...villaLiftRoutes,
      ...packagingRoutes,
      // 布局内 404：保留菜单与标签页（未登录时由 ProtectedRoute 跳转登录）
      {
        path: '*',
        element: (
          <Suspense fallback={<Loading />}>
            <PageNotFound />
          </Suspense>
        ),
      },
    ],
  },
  // 无需登录的公开扫码页
  publicRoute(
    LABOR_PROTECTION_PUBLIC_QR_PATH,
    LaborProtectionPublicRequisitionPage,
  ),
  publicRoute(TOOLING_STOCK_OUT_PUBLIC_QR_PATH, ToolingStockOutPublicPage),
  publicRoute(
    JINTAN_PARTS_STOCK_OUT_PUBLIC_QR_PATH,
    JintanPartsStockOutPublicPage,
  ),
  publicRoute(TOOLING_FIXTURE_PUBLIC_QR_PATH, ToolingFixturePublicPage),
  publicRoute('/login', Login),
  publicRoute('/access-denied', AccessDenied),
])
