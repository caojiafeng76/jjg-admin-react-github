import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import AppLayout from '@ui/AppLayout'
import Loading from '@ui/Loading'
import { useAuth } from '@/contexts/AuthContext'

// 懒加载页面组件（按 feature 组织）
const Dashboard = lazy(() => import('@pages/Dashboard'))
const Login = lazy(() => import('@pages/Login'))
const PageNotFound = lazy(() => import('@pages/PageNotFound'))

// Syney 相关
const SyneySpecList = lazy(() => import('@features/syney/SpecList'))
const SyneyStoreReportList = lazy(() => import('@features/syney/ReportList'))
const SyneyStoreReportDetail = lazy(
  () => import('@features/syney/ReportDetail'),
)
const SyneyPoList = lazy(() => import('@features/syney/PoList'))
const SyneySetting = lazy(() => import('@pages/SyneySetting'))
const SafePartSettingPage = lazy(
  () => import('@features/syney/SafePartSetting/SafePartSettingPage'),
)
const SyneyPoDetail = lazy(() => import('@features/syney/PoDetail'))

// 车间相关
const WorkshopOrderList = lazy(() => import('@features/workshop/OrderList'))
const EmployeeList = lazy(() => import('@features/workshop/EmployeeList'))

function ProtectedRoute({ element }: { element: ReactNode }) {
  const { user, loading } = useAuth()

  // 使用 useMemo 避免不必要的重渲染
  const shouldShowLoading = loading
  const shouldRedirect = !loading && !user

  if (shouldShowLoading) {
    return <Loading />
  }

  if (shouldRedirect) {
    return <Navigate to="/login" replace />
  }

  return <>{element}</>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<Loading />}>
        <ProtectedRoute element={<AppLayout />} />
      </Suspense>
    ),
    children: [
      {
        index: true,
        element: <Navigate replace to="/dashboard" />,
      },
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<Loading />}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: 'syney-spec-list',
        element: (
          <Suspense fallback={<Loading />}>
            <SyneySpecList />
          </Suspense>
        ),
      },
      {
        path: 'syney-store-report-list',
        element: (
          <Suspense fallback={<Loading />}>
            <SyneyStoreReportList />
          </Suspense>
        ),
      },
      {
        path: 'syney-store-report-list/:reportNo',
        element: (
          <Suspense fallback={<Loading />}>
            <SyneyStoreReportDetail />
          </Suspense>
        ),
      },
      {
        path: 'syney-po-list',
        element: (
          <Suspense fallback={<Loading />}>
            <SyneyPoList />
          </Suspense>
        ),
      },
      {
        path: 'syney-po-list/:PoId',
        element: (
          <Suspense fallback={<Loading />}>
            <SyneyPoDetail />
          </Suspense>
        ),
      },
      {
        path: 'syney-safe-part-setting',
        element: (
          <Suspense fallback={<Loading />}>
            <SafePartSettingPage />
          </Suspense>
        ),
      },
      {
        path: 'syney-setting',
        element: (
          <Suspense fallback={<Loading />}>
            <SyneySetting />
          </Suspense>
        ),
      },
      {
        path: 'workshop-order-list',
        element: (
          <Suspense fallback={<Loading />}>
            <WorkshopOrderList />
          </Suspense>
        ),
      },
      {
        path: 'employee-list',
        element: (
          <Suspense fallback={<Loading />}>
            <EmployeeList />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<Loading />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<Loading />}>
        <PageNotFound />
      </Suspense>
    ),
  },
])
