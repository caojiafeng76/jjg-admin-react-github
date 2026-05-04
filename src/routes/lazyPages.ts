import { lazy } from 'react'

export const Dashboard = lazy(() => import('@pages/Dashboard'))
export const Login = lazy(() => import('@pages/Login'))
export const PageNotFound = lazy(() => import('@pages/PageNotFound'))
export const AccessDenied = lazy(() => import('@pages/AccessDenied'))
export const ComingSoonPage = lazy(() => import('@pages/ComingSoonPage'))
export const EmployeeMobileChangePasswordPage = lazy(
  () => import('@ui/EmployeeMobileChangePasswordPage'),
)

export const SyneySpecList = lazy(() => import('@features/syney/SpecList'))
export const SyneyStoreReportList = lazy(
  () => import('@features/syney/ReportList'),
)
export const SyneyStoreReportDetail = lazy(
  () => import('@features/syney/ReportDetail'),
)
export const SyneyPoList = lazy(() => import('@features/syney/PoList'))
export const SyneySetting = lazy(() => import('@pages/SyneySetting'))
export const SafePartSettingPage = lazy(
  () => import('@features/syney/SafePartSetting/SafePartSettingPage'),
)
export const SyneyPoDetail = lazy(() => import('@features/syney/PoDetail'))

export const WorkshopOrderList = lazy(
  () => import('@features/workshop/OrderList'),
)
export const WorkshopOrderProduction = lazy(
  () => import('@pages/WorkshopOrderProduction'),
)
export const WorkshopOrderClosed = lazy(
  () => import('@pages/WorkshopOrderClosed'),
)
export const WorkshopOrderQrDetail = lazy(
  () => import('@pages/WorkshopOrderQrDetail'),
)
export const EmployeeList = lazy(
  () => import('@features/workshop/EmployeeList'),
)
export const StandardTimeList = lazy(
  () => import('@features/workshop/StandardTimeList'),
)
export const OrderStatusDashboard = lazy(
  () => import('@features/workshop/OrderStatusDashboard'),
)
export const ProductionScheduling = lazy(
  () => import('@features/workshop/ProductionScheduling'),
)
export const JobBaseSetting = lazy(
  () => import('@features/workshop/JobBaseSetting'),
)
export const ToolingData = lazy(() => import('@features/tooling/ToolingData'))
export const LaborProtectionData = lazy(
  () => import('@features/labor-protection/LaborProtectionData'),
)
export const LaborProtectionRequisition = lazy(
  () => import('@features/labor-protection/LaborProtectionRequisition'),
)
export const LaborProtectionPublicRequisitionPage = lazy(
  () =>
    import('@features/labor-protection/LaborProtectionRequisition/LaborProtectionPublicRequisitionPage'),
)
export const YoumaiProductData = lazy(
  () => import('@features/youmai/ProductData'),
)
export const YoumaiFinishedGoodsInventory = lazy(
  () => import('@features/youmai/FinishedGoodsInventory'),
)
export const YoumaiFinishedGoodsStockIn = lazy(
  () => import('@features/youmai/FinishedGoodsStockIn'),
)
export const YoumaiFinishedGoodsStockOut = lazy(
  () => import('@features/youmai/FinishedGoodsStockOut'),
)
export const YoumaiRawMaterialInventory = lazy(
  () => import('@features/youmai/RawMaterialInventory'),
)
export const YoumaiRawMaterialStockIn = lazy(
  () => import('@features/youmai/RawMaterialStockIn'),
)
export const YoumaiRawMaterialStockOut = lazy(
  () => import('@features/youmai/RawMaterialStockOut'),
)
export const MachineEquipmentMaintenance = lazy(
  () => import('@features/workshop/MachineEquipmentMaintenance'),
)
export const MaterialTransfer = lazy(
  () => import('@features/material-transfer'),
)
export const PrecisionFinishingCutting = lazy(
  () => import('@features/precision-finishing-cutting'),
)
export const PrecisionCuttingTransfer = lazy(
  () => import('@features/precision-cutting-transfer'),
)
export const ScanHub = lazy(
  () => import('@features/production-order/MobileScanHubPage'),
)
export const ProductionOrder = lazy(() => import('@features/production-order'))
export const ProductionOrderScan = lazy(
  () => import('@features/production-order/MobileProductionOrderScanPage'),
)
export const MobileProductionOrderCreate = lazy(
  () => import('@features/production-order/MobileProductionOrderCreatePage'),
)
export const MobileProductionOrderDetail = lazy(
  () => import('@features/production-order/MobileProductionOrderDetailPage'),
)
export const MobileProductionOrderEdit = lazy(
  () => import('@features/production-order/MobileProductionOrderEditPage'),
)
export const MaterialTransferScan = lazy(
  () => import('@features/material-transfer/MobileMaterialTransferScanPage'),
)
export const PrecisionFinishingCuttingScan = lazy(
  () =>
    import('@features/precision-finishing-cutting/MobilePrecisionFinishingCuttingScanPage'),
)
export const ProductionDailyReport = lazy(
  () => import('@features/production-report'),
)
export const QualityReworkRepair = lazy(
  () => import('@features/quality/ReworkRepair'),
)
export const MachineRuntime = lazy(() => import('@features/machine-runtime'))
export const AttendanceDetail = lazy(
  () => import('@features/attendance/AttendanceDetail'),
)
export const AttendanceStats = lazy(
  () => import('@features/attendance/AttendanceStats'),
)
export const AccessManagement = lazy(
  () => import('@features/access-management'),
)

export const VillaLiftOrderList = lazy(
  () => import('@features/villa-lift/OrderList'),
)

export const VillaLiftCuttingProcess = lazy(
  () => import('@features/villa-lift/CuttingProcess'),
)

export const VillaLiftFinishingProcess = lazy(
  () => import('@features/villa-lift/FinishingProcess'),
)
