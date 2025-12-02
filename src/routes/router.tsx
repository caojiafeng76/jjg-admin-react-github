import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import AppLayout from '@ui/AppLayout'
import Loading from '@ui/Loading'
import { useAuth } from '@/contexts/AuthContext'

// 懒加载页面组件
const Dashboard = lazy(() => import('@pages/Dashboard'))
const Login = lazy(() => import('@pages/Login'))
const PageNotFound = lazy(() => import('@pages/PageNotFound'))
const SyneySpecList = lazy(() => import('@pages/SyneySpecList'))
const SyneyStoreReportList = lazy(() => import('@pages/SyneyStoreReportList'))
const SyneyStoreReportDetail = lazy(
  () => import('@pages/SyneyStoreReportDetail'),
)
const SyneyPoList = lazy(() => import('@pages/SyneyPoList'))
const SyneySetting = lazy(() => import('@pages/SyneySetting'))
const SyneyPoDetail = lazy(() => import('@pages/SyneyPoDetail'))
const WorkshopOrderList = lazy(() => import('@pages/WorkshopOrderList'))
const WorkshopProcessList = lazy(() => import('@pages/WorkshopProcessList'))
const WorkshopDefectReasonList = lazy(
  () => import('@pages/WorkshopDefectReasonList'),
)
const EmployeeList = lazy(() => import('@pages/EmployeeList'))
const ProductionRecordList = lazy(() => import('@pages/ProductionRecordList'))

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
