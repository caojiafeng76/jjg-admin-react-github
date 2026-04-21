import type { PermissionDefinition } from '@/types/permission'

export const PRODUCTION_ORDER_PERMISSIONS: PermissionDefinition[] = [
  // PC + 移动端共享页面
  {
    key: 'page:production-order',
    scope: 'page',
    module: 'production-order',
    surface: 'both',
    label: '生产工单',
  },
  {
    key: 'page:production-daily-report',
    scope: 'page',
    module: 'production-daily-report',
    surface: 'both',
    label: '生产日报表',
  },

  // PC 端功能
  {
    key: 'feature:production-order.close',
    scope: 'feature',
    module: 'production-order',
    surface: 'pc',
    label: '生产工单-结单',
  },
  {
    key: 'feature:production-order.delete',
    scope: 'feature',
    module: 'production-order',
    surface: 'pc',
    label: '生产工单-删除',
  },
  {
    key: 'feature:production-order.create',
    scope: 'feature',
    module: 'production-order',
    surface: 'both',
    label: '生产工单-新建',
  },

  // 移动端导航
  {
    key: 'nav:mobile-workspace',
    scope: 'nav',
    module: 'mobile-workspace',
    surface: 'mobile',
    label: '员工工作台',
  },
  {
    key: 'nav:mobile-daily-report',
    scope: 'nav',
    module: 'mobile-daily-report',
    surface: 'mobile',
    label: '我的日报 Tab',
  },

  // 移动端页面
  {
    key: 'page:mobile-production-order',
    scope: 'page',
    module: 'mobile-production-order',
    surface: 'mobile',
    label: '移动端：我的工单',
  },
  {
    key: 'page:mobile-production-daily-report',
    scope: 'page',
    module: 'mobile-production-daily-report',
    surface: 'mobile',
    label: '移动端：我的日报',
  },
  {
    key: 'page:mobile-change-password',
    scope: 'page',
    module: 'mobile-workspace',
    surface: 'mobile',
    label: '移动端：修改密码',
  },

  // 移动端功能
  {
    key: 'feature:mobile-production-order.create',
    scope: 'feature',
    module: 'mobile-production-order',
    surface: 'mobile',
    label: '移动端工单-新建',
  },
  {
    key: 'feature:mobile-production-order.edit',
    scope: 'feature',
    module: 'mobile-production-order',
    surface: 'mobile',
    label: '移动端工单-编辑',
  },
]
