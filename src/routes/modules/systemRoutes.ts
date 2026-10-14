import type { RouteObject } from 'react-router-dom'

import {
  AccessManagement,
  AttendanceDetail,
  AttendanceStats,
  Dashboard,
  EmployeeList,
  EmployeeMobileChangePasswordPage,
} from '../lazyPages'
import { permissionRoute } from '../routeHelpers'

/** 首页、员工、考勤、权限管理 */
export const systemRoutes: RouteObject[] = [
  permissionRoute('dashboard', 'page:dashboard', Dashboard),
  permissionRoute('employee-list', 'page:employee-list', EmployeeList),
  permissionRoute(
    'employee/change-password',
    'page:mobile-change-password',
    EmployeeMobileChangePasswordPage,
  ),
  permissionRoute(
    'attendance-detail',
    'page:attendance-detail',
    AttendanceDetail,
  ),
  permissionRoute(
    'attendance-summary',
    'page:attendance-summary',
    AttendanceStats,
  ),
  permissionRoute(
    'access-management',
    'page:access-management',
    AccessManagement,
  ),
]
