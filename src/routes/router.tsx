import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import AppLayout from '@ui/AppLayout'
import Loading from '@ui/Loading'
import { useAuth } from '@/contexts/AuthContext'
import {
  EMPLOYEE_SIDE_ROLES,
  getDefaultHomeByRole,
  type AppRole,
} from '@/config/access'

// 懒加载页面组件（按 feature 组织）
const Dashboard = lazy(() => import('@pages/Dashboard'))
const Login = lazy(() => import('@pages/Login'))
const PageNotFound = lazy(() => import('@pages/PageNotFound'))
const AccessDenied = lazy(() => import('@pages/AccessDenied'))

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
const StandardTimeList = lazy(
  () => import('@features/workshop/StandardTimeList'),
)
const JobBaseSetting = lazy(() => import('@features/workshop/JobBaseSetting'))
const MachineEquipmentMaintenance = lazy(
  () => import('@features/workshop/MachineEquipmentMaintenance'),
)
const MaterialTransfer = lazy(() => import('@features/material-transfer'))
const ProductionOrder = lazy(() => import('@features/production-order'))
const ProductionDailyReport = lazy(() => import('@features/production-report'))

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

function RoleProtectedRoute({
  element,
  allow,
}: {
  element: ReactNode
  allow: AppRole[]
}) {
  const { user, loading, role, employeeProfile } = useAuth()

  if (loading) {
    return <Loading />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!employeeProfile || employeeProfile.is_active === false || !role) {
    return <Navigate to="/access-denied" replace />
  }

  if (!allow.includes(role)) {
    return <Navigate to={getDefaultHomeByRole(role)} replace />
  }

  return <>{element}</>
}

function RoleHomeRedirect() {
  const { user, loading, role, employeeProfile } = useAuth()

  if (loading) {
    return <Loading />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!employeeProfile || employeeProfile.is_active === false || !role) {
    return <Navigate to="/access-denied" replace />
  }

  return <Navigate replace to={getDefaultHomeByRole(role)} />
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
        element: <RoleHomeRedirect />,
      },
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute allow={['admin']} element={<Dashboard />} />
          </Suspense>
        ),
      },
      {
        path: 'syney-spec-list',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute allow={['admin']} element={<SyneySpecList />} />
          </Suspense>
        ),
      },
      {
        path: 'syney-store-report-list',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={['admin']}
              element={<SyneyStoreReportList />}
            />
          </Suspense>
        ),
      },
      {
        path: 'syney-store-report-list/:reportNo',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={['admin']}
              element={<SyneyStoreReportDetail />}
            />
          </Suspense>
        ),
      },
      {
        path: 'syney-po-list',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute allow={['admin']} element={<SyneyPoList />} />
          </Suspense>
        ),
      },
      {
        path: 'syney-po-list/:PoId',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute allow={['admin']} element={<SyneyPoDetail />} />
          </Suspense>
        ),
      },
      {
        path: 'syney-safe-part-setting',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={['admin']}
              element={<SafePartSettingPage />}
            />
          </Suspense>
        ),
      },
      {
        path: 'syney-setting',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute allow={['admin']} element={<SyneySetting />} />
          </Suspense>
        ),
      },
      {
        path: 'workshop-order-list',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={['admin']}
              element={<WorkshopOrderList />}
            />
          </Suspense>
        ),
      },
      {
        path: 'employee-list',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute allow={['admin']} element={<EmployeeList />} />
          </Suspense>
        ),
      },
      {
        path: 'standard-time-list',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={['admin', 'team_leader']}
              element={<StandardTimeList />}
            />
          </Suspense>
        ),
      },
      {
        path: 'job-base-setting',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={['admin']}
              element={<JobBaseSetting />}
            />
          </Suspense>
        ),
      },
      {
        path: 'machine-equipment-maintenance',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={['admin']}
              element={<MachineEquipmentMaintenance />}
            />
          </Suspense>
        ),
      },
      {
        path: 'material-transfer',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={['admin', ...EMPLOYEE_SIDE_ROLES]}
              element={<MaterialTransfer />}
            />
          </Suspense>
        ),
      },
      {
        path: 'production-order',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={['admin', ...EMPLOYEE_SIDE_ROLES]}
              element={<ProductionOrder />}
            />
          </Suspense>
        ),
      },
      {
        path: 'production-daily-report',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={['admin', ...EMPLOYEE_SIDE_ROLES]}
              element={<ProductionDailyReport />}
            />
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
    path: '/access-denied',
    element: (
      <Suspense fallback={<Loading />}>
        <AccessDenied />
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
