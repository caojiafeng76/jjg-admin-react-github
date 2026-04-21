import type { PermissionDefinition } from '@/types/permission'

export const MATERIAL_TRANSFER_PERMISSIONS: PermissionDefinition[] = [
  // PC + 移动端共享页面
  {
    key: 'page:material-transfer',
    scope: 'page',
    module: 'material-transfer',
    surface: 'both',
    label: '物料转移单',
  },

  // PC 端功能
  {
    key: 'feature:material-transfer.audit',
    scope: 'feature',
    module: 'material-transfer',
    surface: 'pc',
    label: '物料转移单-审核',
  },
  {
    key: 'feature:material-transfer.delete',
    scope: 'feature',
    module: 'material-transfer',
    surface: 'pc',
    label: '物料转移单-删除',
  },
  {
    key: 'feature:material-transfer.create',
    scope: 'feature',
    module: 'material-transfer',
    surface: 'both',
    label: '物料转移单-新建',
  },

  // 移动端扫码页面
  {
    key: 'page:mobile-scan-hub',
    scope: 'page',
    module: 'mobile-scan',
    surface: 'mobile',
    label: '移动端：扫码中心',
  },
  {
    key: 'page:mobile-scan-material-transfer',
    scope: 'page',
    module: 'mobile-scan',
    surface: 'mobile',
    label: '移动端：物料转移扫码',
  },
  {
    key: 'nav:mobile-scan',
    scope: 'nav',
    module: 'mobile-scan',
    surface: 'mobile',
    label: '扫码中心入口',
  },
]
