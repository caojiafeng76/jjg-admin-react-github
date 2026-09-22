import type { PermissionDefinition } from '@/types/permission'

export const PRECISION_CUTTING_TRANSFER_MANAGE_PERMISSION_KEY =
  'feature:precision-cutting-transfer.manage'

export const PRECISION_CUTTING_PERMISSIONS: PermissionDefinition[] = [
  {
    key: PRECISION_CUTTING_TRANSFER_MANAGE_PERMISSION_KEY,
    scope: 'feature',
    module: 'precision-cutting',
    surface: 'pc',
    label: '精切转移单-全部操作',
    description: '允许查看员执行精切转移单新增、编辑、删除、审核、反审核和导出',
  },
  // 导航
  {
    key: 'nav:precision-cutting',
    scope: 'nav',
    module: 'precision-cutting',
    surface: 'pc',
    label: '精切菜单分组',
  },

  // 页面
  {
    key: 'page:precision-cutting-transfer',
    scope: 'page',
    module: 'precision-cutting',
    surface: 'pc',
    label: '精切转移单',
  },
]
