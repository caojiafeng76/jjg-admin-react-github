import { Suspense } from 'react'
import { Navigate } from 'react-router-dom'
import { createBrowserRouter } from 'react-router-dom'

import AppLayout from '@ui/AppLayout'
import Loading from '@ui/Loading'
import RouteErrorPage from '@/pages/RouteErrorPage'
import {
  EMPLOYEE_SIDE_ROLES,
  PRECISION_CUTTING_ADMIN_ROLE,
} from '@/config/access'
import {
  ProtectedRoute,
  RoleHomeRedirect,
  RoleProtectedRoute,
} from './RouteGuards'
import {
  AccessDenied,
  AttendanceDetail,
  AttendanceStats,
  ComingSoonPage,
  Dashboard,
  EmployeeMobileChangePasswordPage,
  EmployeeList,
  JobBaseSetting,
  Login,
  MachineEquipmentMaintenance,
  MachineRuntime,
  MaterialTransfer,
  MaterialTransferScan,
  MobileProductionOrderCreate,
  MobileProductionOrderDetail,
  MobileProductionOrderEdit,
  PageNotFound,
  PrecisionCuttingTransfer,
  PrecisionFinishingCutting,
  PrecisionFinishingCuttingScan,
  ProductionDailyReport,
  ProductionOrder,
  ProductionOrderScan,
  ScanHub,
  SafePartSettingPage,
  StandardTimeList,
  SyneyPoDetail,
  SyneyPoList,
  SyneySetting,
  SyneySpecList,
  SyneyStoreReportDetail,
  SyneyStoreReportList,
  ToolingData,
  WorkshopOrderClosed,
  WorkshopOrderProduction,
  WorkshopOrderQrDetail,
} from './lazyPages'

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
        element: <Navigate to="/workshop-order-list/production" replace />,
      },
      {
        path: 'workshop-order-list/production',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={['admin', PRECISION_CUTTING_ADMIN_ROLE]}
              element={<WorkshopOrderProduction />}
            />
          </Suspense>
        ),
      },
      {
        path: 'workshop-order-list/closed',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={['admin', PRECISION_CUTTING_ADMIN_ROLE]}
              element={<WorkshopOrderClosed />}
            />
          </Suspense>
        ),
      },
      {
        path: 'workshop-order-list/qr/:orderId',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={[
                'admin',
                PRECISION_CUTTING_ADMIN_ROLE,
                ...EMPLOYEE_SIDE_ROLES,
              ]}
              element={<WorkshopOrderQrDetail />}
            />
          </Suspense>
        ),
      },
      {
        path: 'production-scheduling',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={['admin']}
              element={<ComingSoonPage />}
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
        path: 'employee/change-password',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={EMPLOYEE_SIDE_ROLES}
              element={<EmployeeMobileChangePasswordPage />}
            />
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
        path: 'material-transfer/scan',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={EMPLOYEE_SIDE_ROLES}
              element={<MaterialTransferScan />}
            />
          </Suspense>
        ),
      },
      {
        path: 'precision-finishing-cutting',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={['admin', ...EMPLOYEE_SIDE_ROLES]}
              element={<PrecisionFinishingCutting />}
            />
          </Suspense>
        ),
      },
      {
        path: 'precision-finishing-cutting/scan',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={EMPLOYEE_SIDE_ROLES}
              element={<PrecisionFinishingCuttingScan />}
            />
          </Suspense>
        ),
      },
      {
        path: 'scan',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={EMPLOYEE_SIDE_ROLES}
              element={<ScanHub />}
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
        path: 'production-order/create',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={EMPLOYEE_SIDE_ROLES}
              element={<MobileProductionOrderCreate />}
            />
          </Suspense>
        ),
      },
      {
        path: 'production-order/scan',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={EMPLOYEE_SIDE_ROLES}
              element={<ProductionOrderScan />}
            />
          </Suspense>
        ),
      },
      {
        path: 'production-order/:orderId',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={EMPLOYEE_SIDE_ROLES}
              element={<MobileProductionOrderDetail />}
            />
          </Suspense>
        ),
      },
      {
        path: 'production-order/:orderId/edit',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={EMPLOYEE_SIDE_ROLES}
              element={<MobileProductionOrderEdit />}
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
      {
        path: 'machine-runtime',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={['admin']}
              element={<MachineRuntime />}
            />
          </Suspense>
        ),
      },
      {
        path: 'precision-cutting-transfer',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={['admin', PRECISION_CUTTING_ADMIN_ROLE]}
              element={<PrecisionCuttingTransfer />}
            />
          </Suspense>
        ),
      },
      {
        path: 'tooling-data',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute allow={['admin']} element={<ToolingData />} />
          </Suspense>
        ),
      },
      {
        path: 'tooling-inventory',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={['admin']}
              element={<ComingSoonPage />}
            />
          </Suspense>
        ),
      },
      {
        path: 'tooling-stock-in',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={['admin']}
              element={<ComingSoonPage />}
            />
          </Suspense>
        ),
      },
      {
        path: 'tooling-stock-out',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={['admin']}
              element={<ComingSoonPage />}
            />
          </Suspense>
        ),
      },
      {
        path: 'youmai-product-data',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={['admin']}
              element={<ComingSoonPage />}
            />
          </Suspense>
        ),
      },
      {
        path: 'youmai-finished-goods-inventory',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={['admin']}
              element={<ComingSoonPage />}
            />
          </Suspense>
        ),
      },
      {
        path: 'youmai-finished-goods-stock-in',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={['admin']}
              element={<ComingSoonPage />}
            />
          </Suspense>
        ),
      },
      {
        path: 'youmai-finished-goods-stock-out',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={['admin']}
              element={<ComingSoonPage />}
            />
          </Suspense>
        ),
      },
      {
        path: 'attendance-detail',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={['admin']}
              element={<AttendanceDetail />}
            />
          </Suspense>
        ),
      },
      {
        path: 'attendance-summary',
        element: (
          <Suspense fallback={<Loading />}>
            <RoleProtectedRoute
              allow={['admin']}
              element={<AttendanceStats />}
            />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '/login',
    errorElement: <RouteErrorPage />,
    element: (
      <Suspense fallback={<Loading />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: '/access-denied',
    errorElement: <RouteErrorPage />,
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
