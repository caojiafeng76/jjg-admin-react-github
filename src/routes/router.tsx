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
const SyneyStoreReportList = lazy(
  () => import('@features/syney/ReportList'),
)
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
const WorkshopOrderList = lazy(
  () => import('@features/workshop/OrderList'),
)
const WorkshopProcessList = lazy(
  () => import('@features/workshop/ProcessList'),
)
const WorkshopDefectReasonList = lazy(
  () => import('@features/workshop/DefectReasonList'),
)
const EmployeeList = lazy(
  () => import('@features/workshop/EmployeeList'),
)
const ProductionRecordList = lazy(
  () => import('@features/workshop/ProductionRecord'),
)
const ProductionStatistics = lazy(
  () => import('@pages/ProductionStatistics'),
)

function ProtectedRoute({ element }: { element: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loading />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return element
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
        element: <Dashboard />,
      },
      {
        path: 'syney-spec-list',
        element: <SyneySpecList />,
      },
      {
        path: 'syney-store-report-list',
        element: <SyneyStoreReportList />,
      },
      {
        path: 'syney-store-report-list/:reportNo',
        element: <SyneyStoreReportDetail />,
      },
      {
        path: 'syney-po-list',
        element: <SyneyPoList />,
      },
      {
        path: 'syney-po-list/:PoId',
        element: <SyneyPoDetail />,
      },
      {
        path: 'syney-safe-part-setting',
        element: <SafePartSettingPage />, 
      },
      {
        path: 'syney-setting',
        element: <SyneySetting />,
      },
      {
        path: 'workshop-order-list',
        element: <WorkshopOrderList />,
      },
      {
        path: 'workshop-process-list',
        element: <WorkshopProcessList />,
      },
      {
        path: 'workshop-defect-reason-list',
        element: <WorkshopDefectReasonList />,
      },
      {
        path: 'employee-list',
        element: <EmployeeList />,
      },
      {
        path: 'production-record-list',
        element: <ProductionRecordList />,
      },
      {
        path: 'production-statistics',
        element: <ProductionStatistics />,
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
