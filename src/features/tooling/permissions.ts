import type { PermissionDefinition } from '@/types/permission'

export const TOOLING_MANAGE_PERMISSION_KEY = 'feature:tooling.manage'

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
  {
    key: 'page:tooling-inventory',
    scope: 'page',
    module: 'consumables',
    surface: 'pc',
    label: '刀具库存',
  },
  {
    key: 'page:tooling-stock-in',
    scope: 'page',
    module: 'consumables',
    surface: 'pc',
    label: '刀具入库',
  },
  {
    key: 'page:tooling-stock-out',
    scope: 'page',
    module: 'consumables',
    surface: 'pc',
    label: '刀具出库',
  },

  // 操作
  {
    key: TOOLING_MANAGE_PERMISSION_KEY,
    scope: 'feature',
    module: 'consumables',
    surface: 'pc',
    label: '刀具模块-全部操作',
    description: '允许查看员绕过只读限制，执行刀具资料、库存、入库和出库操作',
  },
]
