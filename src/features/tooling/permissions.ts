import type { PermissionDefinition } from '@/types/permission'

export const TOOLING_MANAGE_PERMISSION_KEY = 'feature:tooling.manage'
export const TOOLING_DATA_PAGE_PERMISSION_KEY = 'page:tooling-data'
export const TOOLING_INVENTORY_PAGE_PERMISSION_KEY = 'page:tooling-inventory'
export const TOOLING_STOCK_IN_PAGE_PERMISSION_KEY = 'page:tooling-stock-in'
export const TOOLING_STOCK_OUT_PAGE_PERMISSION_KEY = 'page:tooling-stock-out'

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
    key: TOOLING_DATA_PAGE_PERMISSION_KEY,
    scope: 'page',
    module: 'consumables',
    surface: 'pc',
    label: '刀具资料',
  },
  {
    key: TOOLING_INVENTORY_PAGE_PERMISSION_KEY,
    scope: 'page',
    module: 'consumables',
    surface: 'pc',
    label: '刀具库存',
  },
  {
    key: TOOLING_STOCK_IN_PAGE_PERMISSION_KEY,
    scope: 'page',
    module: 'consumables',
    surface: 'pc',
    label: '刀具入库',
  },
  {
    key: TOOLING_STOCK_OUT_PAGE_PERMISSION_KEY,
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

  {
    key: 'nav:tooling-fixture',
    scope: 'nav',
    module: 'tooling-fixture',
    surface: 'pc',
    label: '工装管理菜单分组',
  },
  {
    key: 'page:fixture-data',
    scope: 'page',
    module: 'tooling-fixture',
    surface: 'pc',
    label: '工装资料',
  },
  {
    key: 'page:fixture-records',
    scope: 'page',
    module: 'tooling-fixture',
    surface: 'pc',
    label: '工装出入记录',
  },
]
