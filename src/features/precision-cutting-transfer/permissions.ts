import type { PermissionDefinition } from '@/types/permission'

export const PRECISION_CUTTING_PERMISSIONS: PermissionDefinition[] = [
  // 导航
  {
    key: 'nav:precision-cutting',
    scope: 'nav',
    module: 'precision-cutting',
    surface: 'pc',
    label: '精切菜单分组',
  },

  // 页面
  {
    key: 'page:precision-cutting-transfer',
    scope: 'page',
    module: 'precision-cutting',
    surface: 'pc',
    label: '精切转移单',
  },
]
