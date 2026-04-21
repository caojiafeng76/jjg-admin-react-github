import type { PermissionDefinition } from '@/types/permission'

export const PRECISION_FINISHING_CUTTING_PERMISSIONS: PermissionDefinition[] = [
  // PC + 移动端共享页面
  {
    key: 'page:precision-finishing-cutting',
    scope: 'page',
    module: 'precision-finishing-cutting',
    surface: 'both',
    label: '精加工切割单',
  },

  // 移动端扫码页面
  {
    key: 'page:mobile-scan-precision-finishing',
    scope: 'page',
    module: 'mobile-scan',
    surface: 'mobile',
    label: '移动端：精加工切割扫码',
  },

  // 移动端扫码添加工单
  {
    key: 'page:mobile-scan-production-order',
    scope: 'page',
    module: 'mobile-scan',
    surface: 'mobile',
    label: '移动端：扫码添加工单',
  },
]
