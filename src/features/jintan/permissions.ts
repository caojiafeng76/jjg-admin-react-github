import type { PermissionDefinition } from '@/types/permission'

export const JINTAN_PARTS_DATA_PERMISSION_KEY = 'page:jintan-parts-data'

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
    key: 'page:jintan-parts-inventory',
    scope: 'page',
    module: 'jintan',
    surface: 'pc',
    label: '配件库存',
  },
  {
    key: 'page:jintan-parts-stock-in',
    scope: 'page',
    module: 'jintan',
    surface: 'pc',
    label: '配件入库',
  },
  {
    key: 'page:jintan-parts-stock-out',
    scope: 'page',
    module: 'jintan',
    surface: 'pc',
    label: '配件出库',
  },
]
