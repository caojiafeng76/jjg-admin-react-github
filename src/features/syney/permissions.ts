import type { PermissionDefinition } from '@/types/permission'

export const SYNEY_PERMISSIONS: PermissionDefinition[] = [
  // 导航
  {
    key: 'nav:syney',
    scope: 'nav',
    module: 'syney',
    surface: 'pc',
    label: '西尼菜单分组',
  },

  // 页面
  {
    key: 'page:syney-po-list',
    scope: 'page',
    module: 'syney',
    surface: 'pc',
    label: '西尼订单列表',
  },
  {
    key: 'page:syney-store-report-list',
    scope: 'page',
    module: 'syney',
    surface: 'pc',
    label: '西尼入库单列表',
  },
  {
    key: 'page:syney-safe-part-setting',
    scope: 'page',
    module: 'syney',
    surface: 'pc',
    label: '件号配置',
  },
  {
    key: 'page:syney-spec-list',
    scope: 'page',
    module: 'syney',
    surface: 'pc',
    label: '踏板规格列表',
  },
  {
    key: 'page:syney-setting',
    scope: 'page',
    module: 'syney',
    surface: 'pc',
    label: '西尼编号设置',
  },

  // 功能
  {
    key: 'feature:syney-po-list.create',
    scope: 'feature',
    module: 'syney-po-list',
    surface: 'pc',
    label: '西尼订单-新建',
  },
  {
    key: 'feature:syney-po-list.edit',
    scope: 'feature',
    module: 'syney-po-list',
    surface: 'pc',
    label: '西尼订单-编辑',
  },
  {
    key: 'feature:syney-po-list.delete',
    scope: 'feature',
    module: 'syney-po-list',
    surface: 'pc',
    label: '西尼订单-删除',
  },
  {
    key: 'feature:syney-po-list.export',
    scope: 'feature',
    module: 'syney-po-list',
    surface: 'pc',
    label: '西尼订单-导出',
  },
]
