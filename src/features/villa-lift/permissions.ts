import type { PermissionDefinition } from '@/types/permission'

export const VILLA_LIFT_PERMISSIONS: PermissionDefinition[] = [
  // 导航
  {
    key: 'nav:villa-lift',
    scope: 'nav',
    module: 'villa-lift',
    surface: 'pc',
    label: '别墅梯菜单分组',
  },

  // 页面
  {
    key: 'page:villa-lift-order-list',
    scope: 'page',
    module: 'villa-lift',
    surface: 'pc',
    label: '别墅梯订单管理',
  },
  {
    key: 'page:villa-lift-cutting-process',
    scope: 'page',
    module: 'villa-lift',
    surface: 'pc',
    label: '别墅梯切割工序',
  },
  {
    key: 'page:villa-lift-processing',
    scope: 'page',
    module: 'villa-lift',
    surface: 'pc',
    label: '别墅梯加工工序',
  },
]
