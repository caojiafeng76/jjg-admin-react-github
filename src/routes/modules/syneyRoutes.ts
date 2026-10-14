import type { RouteObject } from 'react-router-dom'

import {
  SafePartSettingPage,
  SyneyPoDetail,
  SyneyPoList,
  SyneySetting,
  SyneySpecList,
  SyneyStoreReportDetail,
  SyneyStoreReportList,
} from '../lazyPages'
import { permissionRoute } from '../routeHelpers'

/** 西尼扶梯踏板 */
export const syneyRoutes: RouteObject[] = [
  permissionRoute('syney-spec-list', 'page:syney-spec-list', SyneySpecList),
  permissionRoute(
    'syney-store-report-list',
    'page:syney-store-report-list',
    SyneyStoreReportList,
  ),
  permissionRoute(
    'syney-store-report-list/:reportNo',
    'page:syney-store-report-list',
    SyneyStoreReportDetail,
  ),
  permissionRoute('syney-po-list', 'page:syney-po-list', SyneyPoList),
  permissionRoute('syney-po-list/:PoId', 'page:syney-po-list', SyneyPoDetail),
  permissionRoute(
    'syney-safe-part-setting',
    'page:syney-safe-part-setting',
    SafePartSettingPage,
  ),
  permissionRoute('syney-setting', 'page:syney-setting', SyneySetting),
]
