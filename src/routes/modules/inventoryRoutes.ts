import type { RouteObject } from 'react-router-dom'

import {
  JintanMaterialsData,
  JintanMaterialsInventory,
  JintanMaterialsStockIn,
  JintanMaterialsStockOut,
  JintanPartsData,
  JintanPartsInventory,
  JintanPartsStockIn,
  JintanPartsStockOut,
  JintanProfilesData,
  JintanProfilesInventory,
  JintanProfilesStockIn,
  JintanProfilesStockOut,
  YoumaiFinishedGoodsInventory,
  YoumaiFinishedGoodsStockIn,
  YoumaiFinishedGoodsStockOut,
  YoumaiProductData,
  YoumaiRawMaterialInventory,
  YoumaiRawMaterialStockIn,
  YoumaiRawMaterialStockOut,
} from '../lazyPages'
import { permissionRoute } from '../routeHelpers'

/** 路径与权限 key 同名（`page:<path>`）的库存类页面 */
function samePermissionRoute(
  path: string,
  Page: Parameters<typeof permissionRoute>[2],
): RouteObject {
  return permissionRoute(path, `page:${path}`, Page)
}

/** 优迈库存 */
export const youmaiRoutes: RouteObject[] = [
  samePermissionRoute('youmai-product-data', YoumaiProductData),
  samePermissionRoute(
    'youmai-finished-goods-inventory',
    YoumaiFinishedGoodsInventory,
  ),
  samePermissionRoute(
    'youmai-finished-goods-stock-in',
    YoumaiFinishedGoodsStockIn,
  ),
  samePermissionRoute(
    'youmai-finished-goods-stock-out',
    YoumaiFinishedGoodsStockOut,
  ),
  samePermissionRoute(
    'youmai-raw-material-inventory',
    YoumaiRawMaterialInventory,
  ),
  samePermissionRoute('youmai-raw-material-stock-in', YoumaiRawMaterialStockIn),
  samePermissionRoute(
    'youmai-raw-material-stock-out',
    YoumaiRawMaterialStockOut,
  ),
]

/** 金坛：零件、型材、物料 */
export const jintanRoutes: RouteObject[] = [
  samePermissionRoute('jintan-parts-data', JintanPartsData),
  samePermissionRoute('jintan-parts-inventory', JintanPartsInventory),
  samePermissionRoute('jintan-parts-stock-in', JintanPartsStockIn),
  samePermissionRoute('jintan-parts-stock-out', JintanPartsStockOut),
  samePermissionRoute('jintan-profiles-data', JintanProfilesData),
  samePermissionRoute('jintan-profiles-inventory', JintanProfilesInventory),
  samePermissionRoute('jintan-profiles-stock-in', JintanProfilesStockIn),
  samePermissionRoute('jintan-profiles-stock-out', JintanProfilesStockOut),
  samePermissionRoute('jintan-materials-data', JintanMaterialsData),
  samePermissionRoute('jintan-materials-inventory', JintanMaterialsInventory),
  samePermissionRoute('jintan-materials-stock-in', JintanMaterialsStockIn),
  samePermissionRoute('jintan-materials-stock-out', JintanMaterialsStockOut),
]
