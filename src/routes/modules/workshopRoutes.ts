import type { RouteObject } from 'react-router-dom'

import {
  ExtrusionProduction,
  ExtrusionProductionDailyReport,
  JobBaseSetting,
  MachineEquipmentMaintenance,
  MachineRuntime,
  MaterialTransfer,
  MaterialTransferScan,
  OrderStatusDashboard,
  PrecisionCuttingTransfer,
  PrecisionFinishingCutting,
  PrecisionFinishingCuttingScan,
  ProductionScheduling,
  StandardTimeList,
  WorkshopOrderProduction,
  WorkshopOrderQrDetail,
} from '../lazyPages'
import { permissionRoute, redirectRoute } from '../routeHelpers'

/** 车间生产：订单、排产、工时、设备、物料流转、精切、挤压 */
export const workshopRoutes: RouteObject[] = [
  permissionRoute(
    'workshop-order-list',
    'page:workshop-order-production',
    WorkshopOrderProduction,
  ),
  redirectRoute('workshop-order-list/production', '/workshop-order-list'),
  redirectRoute(
    'workshop-order-list/closed',
    '/workshop-order-list?status=closed',
  ),
  permissionRoute(
    'workshop-order-list/qr/:orderId',
    'page:workshop-order-qr-detail',
    WorkshopOrderQrDetail,
  ),
  permissionRoute(
    'production-scheduling',
    'page:production-scheduling',
    OrderStatusDashboard,
  ),
  permissionRoute(
    'order-scheduling',
    'page:order-scheduling',
    ProductionScheduling,
  ),
  permissionRoute(
    'standard-time-list',
    'page:standard-time-list',
    StandardTimeList,
  ),
  permissionRoute('job-base-setting', 'page:job-base-setting', JobBaseSetting),
  permissionRoute(
    'machine-equipment-maintenance',
    'page:machine-equipment-maintenance',
    MachineEquipmentMaintenance,
  ),
  permissionRoute('machine-runtime', 'page:machine-runtime', MachineRuntime),
  permissionRoute(
    'material-transfer',
    'page:material-transfer',
    MaterialTransfer,
  ),
  permissionRoute(
    'material-transfer/scan',
    'page:mobile-scan-material-transfer',
    MaterialTransferScan,
  ),
  permissionRoute(
    'precision-finishing-cutting',
    'page:precision-finishing-cutting',
    PrecisionFinishingCutting,
  ),
  permissionRoute(
    'precision-finishing-cutting/scan',
    'page:mobile-scan-precision-finishing',
    PrecisionFinishingCuttingScan,
  ),
  permissionRoute(
    'precision-cutting-transfer',
    'page:precision-cutting-transfer',
    PrecisionCuttingTransfer,
  ),
  permissionRoute(
    'extrusion-production-order',
    'page:extrusion-production',
    ExtrusionProduction,
  ),
  permissionRoute(
    'extrusion-production-daily-report',
    'page:extrusion-production-daily-report',
    ExtrusionProductionDailyReport,
  ),
]
