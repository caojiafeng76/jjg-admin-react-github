import type { PermissionDefinition } from '@/types/permission'

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
]
