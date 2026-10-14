import type { RouteObject } from 'react-router-dom'

import {
  PackagingEmployeeList,
  PackagingStandardTimeList,
  PackagingWorkOrderList,
  VillaLiftCuttingProcess,
  VillaLiftFinishingProcess,
  VillaLiftOrderList,
} from '../lazyPages'
import { permissionRoute } from '../routeHelpers'

/** 别墅梯 */
export const villaLiftRoutes: RouteObject[] = [
  permissionRoute(
    'villa-lift-order-list',
    'page:villa-lift-order-list',
    VillaLiftOrderList,
  ),
  permissionRoute(
    'villa-lift-cutting-process',
    'page:villa-lift-cutting-process',
    VillaLiftCuttingProcess,
  ),
  permissionRoute(
    'villa-lift-processing',
    'page:villa-lift-processing',
    VillaLiftFinishingProcess,
  ),
]

/** 包装工序 */
export const packagingRoutes: RouteObject[] = [
  permissionRoute(
    'packaging-process-employee-list',
    'page:packaging-process-employee-list',
    PackagingEmployeeList,
  ),
  permissionRoute(
    'packaging-process-standard-time-list',
    'page:packaging-process-standard-time-list',
    PackagingStandardTimeList,
  ),
  permissionRoute(
    'packaging-process-work-order-list',
    'page:packaging-process-work-order-list',
    PackagingWorkOrderList,
  ),
]
