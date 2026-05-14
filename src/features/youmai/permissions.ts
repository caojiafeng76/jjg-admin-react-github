import type { PermissionDefinition } from '@/types/permission'

export const YOUMAI_MANAGE_PERMISSION_KEY = 'feature:youmai.manage'

export const YOUMAI_PERMISSIONS: PermissionDefinition[] = [
  // 导航
  {
    key: 'nav:youmai',
    scope: 'nav',
    module: 'youmai',
    surface: 'pc',
    label: '优迈菜单分组',
  },

  // 页面
  {
    key: 'page:youmai-product-data',
    scope: 'page',
    module: 'youmai',
    surface: 'pc',
    label: '优迈货品资料',
  },
  {
    key: 'page:youmai-finished-goods-inventory',
    scope: 'page',
    module: 'youmai',
    surface: 'pc',
    label: '优迈成品库存',
  },
  {
    key: 'page:youmai-finished-goods-stock-in',
    scope: 'page',
    module: 'youmai',
    surface: 'pc',
    label: '优迈成品入库',
  },
  {
    key: 'page:youmai-finished-goods-stock-out',
    scope: 'page',
    module: 'youmai',
    surface: 'pc',
    label: '优迈成品出库',
  },
  {
    key: 'page:youmai-raw-material-inventory',
    scope: 'page',
    module: 'youmai',
    surface: 'pc',
    label: '优迈原料库存',
  },
  {
    key: 'page:youmai-raw-material-stock-in',
    scope: 'page',
    module: 'youmai',
    surface: 'pc',
    label: '优迈原料入库',
  },
  {
    key: 'page:youmai-raw-material-stock-out',
    scope: 'page',
    module: 'youmai',
    surface: 'pc',
    label: '优迈原料出库',
  },

  // 操作
  {
    key: YOUMAI_MANAGE_PERMISSION_KEY,
    scope: 'feature',
    module: 'youmai',
    surface: 'pc',
    label: '优迈模块-全部操作',
    description:
      '允许查看员绕过只读限制，执行优迈货品资料、成品库存、成品入库、成品出库、原料库存、原料入库和原料出库操作',
  },
]
