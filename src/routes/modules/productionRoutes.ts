import type { RouteObject } from 'react-router-dom'

import {
  MobileProductionOrderCreate,
  MobileProductionOrderDetail,
  MobileProductionOrderEdit,
  ProductionDailyReport,
  ProductionOrder,
  ProductionOrderScan,
  QualityIssueRecord,
  QualityReworkRepair,
  ScanHub,
} from '../lazyPages'
import { permissionRoute } from '../routeHelpers'

/** 生产工单（含移动端扫码）、生产日报、质量 */
export const productionRoutes: RouteObject[] = [
  permissionRoute('scan', 'page:mobile-scan-hub', ScanHub),
  permissionRoute('production-order', 'page:production-order', ProductionOrder),
  permissionRoute(
    'production-order/create',
    'page:mobile-production-order',
    MobileProductionOrderCreate,
  ),
  permissionRoute(
    'production-order/scan',
    'page:mobile-scan-production-order',
    ProductionOrderScan,
  ),
  permissionRoute(
    'production-order/:orderId',
    'page:mobile-production-order',
    MobileProductionOrderDetail,
  ),
  permissionRoute(
    'production-order/:orderId/edit',
    'page:mobile-production-order',
    MobileProductionOrderEdit,
  ),
  permissionRoute(
    'production-daily-report',
    'page:production-daily-report',
    ProductionDailyReport,
  ),
  permissionRoute(
    'quality-rework-repair',
    'page:quality-rework-repair',
    QualityReworkRepair,
  ),
  permissionRoute(
    'quality-issue-record',
    'page:quality-issue-record',
    QualityIssueRecord,
  ),
]
