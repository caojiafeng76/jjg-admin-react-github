import type { PermissionDefinition } from '@/types/permission'

export const LABOR_PROTECTION_PERMISSIONS: PermissionDefinition[] = [
  // 导航
  {
    key: 'nav:labor-protection',
    scope: 'nav',
    module: 'labor-protection',
    surface: 'pc',
    label: '劳保菜单分组',
  },

  // 页面
  {
    key: 'page:labor-protection-data',
    scope: 'page',
    module: 'labor-protection',
    surface: 'pc',
    label: '劳保资料',
  },
  {
    key: 'page:labor-protection-requisition',
    scope: 'page',
    module: 'labor-protection',
    surface: 'pc',
    label: '劳保领料单',
  },
]
