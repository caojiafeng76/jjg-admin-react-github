import type { PermissionDefinition } from '@/types/permission'

export const SYNEY_MATERIALS_NAV_PERMISSION_KEY = 'nav:syney-materials'
export const SYNEY_MATERIALS_DATA_PERMISSION_KEY = 'page:syney-materials-data'
export const SYNEY_MATERIALS_STOCK_IN_PERMISSION_KEY
  = 'page:syney-materials-stock-in'
export const SYNEY_MATERIALS_STOCK_OUT_PERMISSION_KEY
  = 'page:syney-materials-stock-out'
export const SYNEY_MATERIALS_INVENTORY_PERMISSION_KEY
  = 'page:syney-materials-inventory'
export const SYNEY_MATERIALS_MONTHLY_REPORT_PERMISSION_KEY
  = 'page:syney-materials-monthly-report'

export const SYNEY_MATERIALS_PERMISSIONS: PermissionDefinition[] = [
  {
    key: SYNEY_MATERIALS_NAV_PERMISSION_KEY,
    scope: 'nav',
    module: 'syney-materials',
    surface: 'pc',
    label: '西尼材料库存菜单分组',
  },
  {
    key: SYNEY_MATERIALS_DATA_PERMISSION_KEY,
    scope: 'page',
    module: 'syney-materials',
    surface: 'pc',
    label: '西尼材料资料',
  },
  {
    key: SYNEY_MATERIALS_STOCK_IN_PERMISSION_KEY,
    scope: 'page',
    module: 'syney-materials',
    surface: 'pc',
    label: '西尼材料入库',
  },
  {
    key: SYNEY_MATERIALS_STOCK_OUT_PERMISSION_KEY,
    scope: 'page',
    module: 'syney-materials',
    surface: 'pc',
    label: '西尼材料出库',
  },
  {
    key: SYNEY_MATERIALS_INVENTORY_PERMISSION_KEY,
    scope: 'page',
    module: 'syney-materials',
    surface: 'pc',
    label: '西尼材料库存',
  },
  {
    key: SYNEY_MATERIALS_MONTHLY_REPORT_PERMISSION_KEY,
    scope: 'page',
    module: 'syney-materials',
    surface: 'pc',
    label: '西尼材料月度报表',
  },
]

export const SYNEY_MATERIALS_STOCK_PERMISSION_KEYS = {
  in: SYNEY_MATERIALS_STOCK_IN_PERMISSION_KEY,
  out: SYNEY_MATERIALS_STOCK_OUT_PERMISSION_KEY,
} as const
