import type { PermissionDefinition } from '@/types/permission'

export const JINTAN_PARTS_DATA_PERMISSION_KEY = 'page:jintan-parts-data'
export const JINTAN_PARTS_INVENTORY_PERMISSION_KEY =
  'page:jintan-parts-inventory'
export const JINTAN_PARTS_STOCK_IN_PERMISSION_KEY = 'page:jintan-parts-stock-in'
export const JINTAN_PARTS_STOCK_OUT_PERMISSION_KEY =
  'page:jintan-parts-stock-out'
export const JINTAN_PROFILES_DATA_PERMISSION_KEY = 'page:jintan-profiles-data'
export const JINTAN_PROFILES_INVENTORY_PERMISSION_KEY =
  'page:jintan-profiles-inventory'
export const JINTAN_PROFILES_STOCK_IN_PERMISSION_KEY =
  'page:jintan-profiles-stock-in'
export const JINTAN_PROFILES_STOCK_OUT_PERMISSION_KEY =
  'page:jintan-profiles-stock-out'

export const JINTAN_PERMISSIONS: PermissionDefinition[] = [
  // 导航
  {
    key: 'nav:jintan',
    scope: 'nav',
    module: 'jintan',
    surface: 'pc',
    label: '金檀木业菜单分组',
  },

  // 页面
  {
    key: JINTAN_PARTS_DATA_PERMISSION_KEY,
    scope: 'page',
    module: 'jintan',
    surface: 'pc',
    label: '配件资料',
  },
  {
    key: JINTAN_PARTS_INVENTORY_PERMISSION_KEY,
    scope: 'page',
    module: 'jintan',
    surface: 'pc',
    label: '配件库存',
  },
  {
    key: JINTAN_PARTS_STOCK_IN_PERMISSION_KEY,
    scope: 'page',
    module: 'jintan',
    surface: 'pc',
    label: '配件入库',
  },
  {
    key: JINTAN_PARTS_STOCK_OUT_PERMISSION_KEY,
    scope: 'page',
    module: 'jintan',
    surface: 'pc',
    label: '配件出库',
  },
  {
    key: JINTAN_PROFILES_DATA_PERMISSION_KEY,
    scope: 'page',
    module: 'jintan',
    surface: 'pc',
    label: '型材资料',
  },
  {
    key: JINTAN_PROFILES_INVENTORY_PERMISSION_KEY,
    scope: 'page',
    module: 'jintan',
    surface: 'pc',
    label: '型材库存',
  },
  {
    key: JINTAN_PROFILES_STOCK_IN_PERMISSION_KEY,
    scope: 'page',
    module: 'jintan',
    surface: 'pc',
    label: '型材入库',
  },
  {
    key: JINTAN_PROFILES_STOCK_OUT_PERMISSION_KEY,
    scope: 'page',
    module: 'jintan',
    surface: 'pc',
    label: '型材出库',
  },
]
