import type { PermissionDefinition } from '@/types/permission'

export const TOOLING_PERMISSIONS: PermissionDefinition[] = [
  // 导航
  {
    key: 'nav:consumables',
    scope: 'nav',
    module: 'consumables',
    surface: 'pc',
    label: '刀具菜单分组',
  },

  // 页面
  {
    key: 'page:tooling-data',
    scope: 'page',
    module: 'consumables',
    surface: 'pc',
    label: '刀具资料',
  },
]
