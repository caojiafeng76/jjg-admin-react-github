import type { PermissionDefinition } from '@/types/permission'

export const ATTENDANCE_PERMISSIONS: PermissionDefinition[] = [
  // 导航
  {
    key: 'nav:attendance',
    scope: 'nav',
    module: 'attendance',
    surface: 'pc',
    label: '考勤菜单分组',
  },

  // 页面
  {
    key: 'page:attendance-detail',
    scope: 'page',
    module: 'attendance',
    surface: 'pc',
    label: '考勤明细',
  },
  {
    key: 'page:attendance-summary',
    scope: 'page',
    module: 'attendance',
    surface: 'pc',
    label: '考勤统计',
  },
]
