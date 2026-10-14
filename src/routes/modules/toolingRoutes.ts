import type { RouteObject } from 'react-router-dom'

import {
  FixtureDataPage,
  FixtureRecordsPage,
  LaborProtectionData,
  LaborProtectionRequisition,
  ToolingData,
  ToolingInventory,
  ToolingStockIn,
  ToolingStockOut,
} from '../lazyPages'
import { permissionRoute } from '../routeHelpers'

/** 工具：刀具、工装夹具、劳保用品 */
export const toolingRoutes: RouteObject[] = [
  permissionRoute('tooling-data', 'page:tooling-data', ToolingData),
  permissionRoute(
    'tooling-inventory',
    'page:tooling-inventory',
    ToolingInventory,
  ),
  permissionRoute('tooling-stock-in', 'page:tooling-stock-in', ToolingStockIn),
  permissionRoute(
    'tooling-stock-out',
    'page:tooling-stock-out',
    ToolingStockOut,
  ),
  permissionRoute('fixture-data', 'page:fixture-data', FixtureDataPage),
  permissionRoute(
    'fixture-records',
    'page:fixture-records',
    FixtureRecordsPage,
  ),
  permissionRoute(
    'labor-protection-data',
    'page:labor-protection-data',
    LaborProtectionData,
  ),
  permissionRoute(
    'labor-protection-requisition',
    'page:labor-protection-requisition',
    LaborProtectionRequisition,
  ),
]
