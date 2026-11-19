import type { PermissionDefinition } from '@/types/permission'

export const WORKSHOP_MISC_MATERIALS_NAV_PERMISSION_KEY
  = 'nav:workshop-misc-materials'
export const WORKSHOP_MISC_MATERIALS_DATA_PERMISSION_KEY
  = 'page:workshop-misc-materials-data'
export const WORKSHOP_MISC_MATERIALS_STOCK_IN_PERMISSION_KEY
  = 'page:workshop-misc-materials-stock-in'
export const WORKSHOP_MISC_MATERIALS_STOCK_OUT_PERMISSION_KEY
  = 'page:workshop-misc-materials-stock-out'
export const WORKSHOP_MISC_MATERIALS_INVENTORY_PERMISSION_KEY
  = 'page:workshop-misc-materials-inventory'
export const WORKSHOP_MISC_MATERIALS_MONTHLY_REPORT_PERMISSION_KEY
  = 'page:workshop-misc-materials-monthly-report'

export const WORKSHOP_MISC_MATERIALS_PERMISSIONS: PermissionDefinition[] = [
  {
    key: WORKSHOP_MISC_MATERIALS_NAV_PERMISSION_KEY,
    scope: 'nav',
    module: 'workshop-misc-materials',
    surface: 'pc',
    label: '车间杂项材料库存菜单分组',
  },
  {
    key: WORKSHOP_MISC_MATERIALS_DATA_PERMISSION_KEY,
    scope: 'page',
    module: 'workshop-misc-materials',
    surface: 'pc',
    label: '车间杂项材料资料',
  },
  {
    key: WORKSHOP_MISC_MATERIALS_STOCK_IN_PERMISSION_KEY,
    scope: 'page',
    module: 'workshop-misc-materials',
    surface: 'pc',
    label: '车间杂项材料入库',
  },
  {
    key: WORKSHOP_MISC_MATERIALS_STOCK_OUT_PERMISSION_KEY,
    scope: 'page',
    module: 'workshop-misc-materials',
    surface: 'pc',
    label: '车间杂项材料出库',
  },
  {
    key: WORKSHOP_MISC_MATERIALS_INVENTORY_PERMISSION_KEY,
    scope: 'page',
    module: 'workshop-misc-materials',
    surface: 'pc',
    label: '车间杂项材料库存',
  },
  {
    key: WORKSHOP_MISC_MATERIALS_MONTHLY_REPORT_PERMISSION_KEY,
    scope: 'page',
    module: 'workshop-misc-materials',
    surface: 'pc',
    label: '车间杂项材料月度报表',
  },
]

export const WORKSHOP_MISC_MATERIALS_STOCK_PERMISSION_KEYS = {
  in: WORKSHOP_MISC_MATERIALS_STOCK_IN_PERMISSION_KEY,
  out: WORKSHOP_MISC_MATERIALS_STOCK_OUT_PERMISSION_KEY,
} as const
