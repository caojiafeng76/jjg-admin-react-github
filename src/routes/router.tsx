import { Suspense } from 'react'
import { Navigate } from 'react-router-dom'
import { createBrowserRouter } from 'react-router-dom'

import AppLayout from '@ui/AppLayout'
import Loading from '@ui/Loading'
import RouteErrorPage from '@/pages/RouteErrorPage'
import { LABOR_PROTECTION_PUBLIC_QR_PATH } from '@/features/labor-protection/LaborProtectionRequisition/laborProtectionPublicQr'
import { TOOLING_STOCK_OUT_PUBLIC_QR_PATH } from '@/features/tooling/ToolingStockOut/toolingStockOutPublicQr'
import {
  PermissionProtectedRoute,
  ProtectedRoute,
  RoleHomeRedirect,
} from './RouteGuards'
import {
  AccessDenied,
  AccessManagement,
  VillaLiftOrderList,
  VillaLiftCuttingProcess,
  VillaLiftFinishingProcess,
  AttendanceDetail,
  AttendanceStats,
  Dashboard,
  EmployeeMobileChangePasswordPage,
  EmployeeList,
  JobBaseSetting,
  LaborProtectionData,
  LaborProtectionPublicRequisitionPage,
  LaborProtectionRequisition,
  Login,
  MachineEquipmentMaintenance,
  MachineRuntime,
  MaterialTransfer,
  MaterialTransferScan,
  MobileProductionOrderCreate,
  MobileProductionOrderDetail,
  MobileProductionOrderEdit,
  OrderStatusDashboard,
  PageNotFound,
  PrecisionCuttingTransfer,
  PrecisionFinishingCutting,
  PrecisionFinishingCuttingScan,
  ProductionDailyReport,
  ProductionScheduling,
  QualityReworkRepair,
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
  ToolingInventory,
  ToolingStockIn,
  ToolingStockOut,
  ToolingStockOutPublicPage,
  YoumaiFinishedGoodsInventory,
  YoumaiFinishedGoodsStockIn,
  YoumaiFinishedGoodsStockOut,
  YoumaiRawMaterialInventory,
  YoumaiRawMaterialStockIn,
  YoumaiRawMaterialStockOut,
  YoumaiProductData,
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
            <PermissionProtectedRoute
              permissionKey="page:dashboard"
              element={<Dashboard />}
            />
          </Suspense>
        ),
      },
      {
        path: 'syney-spec-list',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:syney-spec-list"
              element={<SyneySpecList />}
            />
          </Suspense>
        ),
      },
      {
        path: 'syney-store-report-list',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:syney-store-report-list"
              element={<SyneyStoreReportList />}
            />
          </Suspense>
        ),
      },
      {
        path: 'syney-store-report-list/:reportNo',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:syney-store-report-list"
              element={<SyneyStoreReportDetail />}
            />
          </Suspense>
        ),
      },
      {
        path: 'syney-po-list',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:syney-po-list"
              element={<SyneyPoList />}
            />
          </Suspense>
        ),
      },
      {
        path: 'syney-po-list/:PoId',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:syney-po-list"
              element={<SyneyPoDetail />}
            />
          </Suspense>
        ),
      },
      {
        path: 'syney-safe-part-setting',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:syney-safe-part-setting"
              element={<SafePartSettingPage />}
            />
          </Suspense>
        ),
      },
      {
        path: 'syney-setting',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:syney-setting"
              element={<SyneySetting />}
            />
          </Suspense>
        ),
      },
      {
        path: 'workshop-order-list',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:workshop-order-production"
              element={<WorkshopOrderProduction />}
            />
          </Suspense>
        ),
      },
      {
        path: 'workshop-order-list/production',
        element: <Navigate to="/workshop-order-list" replace />,
      },
      {
        path: 'workshop-order-list/closed',
        element: <Navigate to="/workshop-order-list?status=closed" replace />,
      },
      {
        path: 'workshop-order-list/qr/:orderId',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:workshop-order-qr-detail"
              element={<WorkshopOrderQrDetail />}
            />
          </Suspense>
        ),
      },
      {
        path: 'production-scheduling',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:production-scheduling"
              element={<OrderStatusDashboard />}
            />
          </Suspense>
        ),
      },
      {
        path: 'order-scheduling',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:order-scheduling"
              element={<ProductionScheduling />}
            />
          </Suspense>
        ),
      },
      {
        path: 'employee-list',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:employee-list"
              element={<EmployeeList />}
            />
          </Suspense>
        ),
      },
      {
        path: 'employee/change-password',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:mobile-change-password"
              element={<EmployeeMobileChangePasswordPage />}
            />
          </Suspense>
        ),
      },
      {
        path: 'standard-time-list',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:standard-time-list"
              element={<StandardTimeList />}
            />
          </Suspense>
        ),
      },
      {
        path: 'job-base-setting',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:job-base-setting"
              element={<JobBaseSetting />}
            />
          </Suspense>
        ),
      },
      {
        path: 'machine-equipment-maintenance',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:machine-equipment-maintenance"
              element={<MachineEquipmentMaintenance />}
            />
          </Suspense>
        ),
      },
      {
        path: 'material-transfer',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:material-transfer"
              element={<MaterialTransfer />}
            />
          </Suspense>
        ),
      },
      {
        path: 'material-transfer/scan',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:mobile-scan-material-transfer"
              element={<MaterialTransferScan />}
            />
          </Suspense>
        ),
      },
      {
        path: 'precision-finishing-cutting',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:precision-finishing-cutting"
              element={<PrecisionFinishingCutting />}
            />
          </Suspense>
        ),
      },
      {
        path: 'precision-finishing-cutting/scan',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:mobile-scan-precision-finishing"
              element={<PrecisionFinishingCuttingScan />}
            />
          </Suspense>
        ),
      },
      {
        path: 'scan',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:mobile-scan-hub"
              element={<ScanHub />}
            />
          </Suspense>
        ),
      },
      {
        path: 'production-order',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:production-order"
              element={<ProductionOrder />}
            />
          </Suspense>
        ),
      },
      {
        path: 'production-order/create',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:mobile-production-order"
              element={<MobileProductionOrderCreate />}
            />
          </Suspense>
        ),
      },
      {
        path: 'production-order/scan',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:mobile-scan-production-order"
              element={<ProductionOrderScan />}
            />
          </Suspense>
        ),
      },
      {
        path: 'production-order/:orderId',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:mobile-production-order"
              element={<MobileProductionOrderDetail />}
            />
          </Suspense>
        ),
      },
      {
        path: 'production-order/:orderId/edit',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:mobile-production-order"
              element={<MobileProductionOrderEdit />}
            />
          </Suspense>
        ),
      },
      {
        path: 'production-daily-report',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:production-daily-report"
              element={<ProductionDailyReport />}
            />
          </Suspense>
        ),
      },
      {
        path: 'quality-rework-repair',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:quality-rework-repair"
              element={<QualityReworkRepair />}
            />
          </Suspense>
        ),
      },
      {
        path: 'machine-runtime',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:machine-runtime"
              element={<MachineRuntime />}
            />
          </Suspense>
        ),
      },
      {
        path: 'precision-cutting-transfer',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:precision-cutting-transfer"
              element={<PrecisionCuttingTransfer />}
            />
          </Suspense>
        ),
      },
      {
        path: 'tooling-data',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:tooling-data"
              element={<ToolingData />}
            />
          </Suspense>
        ),
      },
      {
        path: 'tooling-inventory',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:tooling-inventory"
              element={<ToolingInventory />}
            />
          </Suspense>
        ),
      },
      {
        path: 'tooling-stock-in',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:tooling-stock-in"
              element={<ToolingStockIn />}
            />
          </Suspense>
        ),
      },
      {
        path: 'tooling-stock-out',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:tooling-stock-out"
              element={<ToolingStockOut />}
            />
          </Suspense>
        ),
      },
      {
        path: 'labor-protection-data',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:labor-protection-data"
              element={<LaborProtectionData />}
            />
          </Suspense>
        ),
      },
      {
        path: 'labor-protection-requisition',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:labor-protection-requisition"
              element={<LaborProtectionRequisition />}
            />
          </Suspense>
        ),
      },
      {
        path: 'youmai-product-data',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:youmai-product-data"
              element={<YoumaiProductData />}
            />
          </Suspense>
        ),
      },
      {
        path: 'youmai-finished-goods-inventory',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:youmai-finished-goods-inventory"
              element={<YoumaiFinishedGoodsInventory />}
            />
          </Suspense>
        ),
      },
      {
        path: 'youmai-finished-goods-stock-in',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:youmai-finished-goods-stock-in"
              element={<YoumaiFinishedGoodsStockIn />}
            />
          </Suspense>
        ),
      },
      {
        path: 'youmai-finished-goods-stock-out',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:youmai-finished-goods-stock-out"
              element={<YoumaiFinishedGoodsStockOut />}
            />
          </Suspense>
        ),
      },
      {
        path: 'youmai-raw-material-inventory',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:youmai-raw-material-inventory"
              element={<YoumaiRawMaterialInventory />}
            />
          </Suspense>
        ),
      },
      {
        path: 'youmai-raw-material-stock-in',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:youmai-raw-material-stock-in"
              element={<YoumaiRawMaterialStockIn />}
            />
          </Suspense>
        ),
      },
      {
        path: 'youmai-raw-material-stock-out',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:youmai-raw-material-stock-out"
              element={<YoumaiRawMaterialStockOut />}
            />
          </Suspense>
        ),
      },
      {
        path: 'attendance-detail',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:attendance-detail"
              element={<AttendanceDetail />}
            />
          </Suspense>
        ),
      },
      {
        path: 'attendance-summary',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:attendance-summary"
              element={<AttendanceStats />}
            />
          </Suspense>
        ),
      },
      {
        path: 'access-management',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:access-management"
              element={<AccessManagement />}
            />
          </Suspense>
        ),
      },
      {
        path: 'villa-lift-order-list',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:villa-lift-order-list"
              element={<VillaLiftOrderList />}
            />
          </Suspense>
        ),
      },
      {
        path: 'villa-lift-cutting-process',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:villa-lift-cutting-process"
              element={<VillaLiftCuttingProcess />}
            />
          </Suspense>
        ),
      },
      {
        path: 'villa-lift-processing',
        element: (
          <Suspense fallback={<Loading />}>
            <PermissionProtectedRoute
              permissionKey="page:villa-lift-processing"
              element={<VillaLiftFinishingProcess />}
            />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: LABOR_PROTECTION_PUBLIC_QR_PATH,
    errorElement: <RouteErrorPage />,
    element: (
      <Suspense fallback={<Loading />}>
        <LaborProtectionPublicRequisitionPage />
      </Suspense>
    ),
  },
  {
    path: TOOLING_STOCK_OUT_PUBLIC_QR_PATH,
    errorElement: <RouteErrorPage />,
    element: (
      <Suspense fallback={<Loading />}>
        <ToolingStockOutPublicPage />
      </Suspense>
    ),
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
