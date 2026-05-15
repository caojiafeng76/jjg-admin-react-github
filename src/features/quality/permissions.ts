import type { PermissionDefinition } from '@/types/permission'

export const QUALITY_PERMISSIONS: PermissionDefinition[] = [
  {
    key: 'nav:quality',
    scope: 'nav',
    module: 'quality',
    surface: 'pc',
    label: '质量菜单分组',
  },
  {
    key: 'page:quality-rework-repair',
    scope: 'page',
    module: 'quality',
    surface: 'pc',
    label: '质量返工返修',
  },
  {
    key: 'page:quality-issue-record',
    scope: 'page',
    module: 'quality',
    surface: 'pc',
    label: '质量问题记录单',
  },
]
