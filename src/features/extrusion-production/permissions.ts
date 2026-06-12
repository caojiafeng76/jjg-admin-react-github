import type { PermissionDefinition } from '@/types/permission'

export const EXTRUSION_PRODUCTION_PERMISSIONS: PermissionDefinition[] = [
  {
    key: 'nav:extrusion-production',
    scope: 'nav',
    module: 'extrusion-production',
    surface: 'pc',
    label: '挤压菜单分组',
  },
  {
    key: 'page:extrusion-production',
    scope: 'page',
    module: 'extrusion-production',
    surface: 'pc',
    label: '挤压生产单',
  },
  {
    key: 'page:extrusion-production-daily-report',
    scope: 'page',
    module: 'extrusion-production',
    surface: 'pc',
    label: '挤压生产日报表',
  },
  {
    key: 'feature:extrusion-production.create',
    scope: 'feature',
    module: 'extrusion-production',
    surface: 'pc',
    label: '挤压生产单-新建',
  },
  {
    key: 'feature:extrusion-production.audit',
    scope: 'feature',
    module: 'extrusion-production',
    surface: 'pc',
    label: '挤压生产单-审核',
  },
  {
    key: 'feature:extrusion-production.delete',
    scope: 'feature',
    module: 'extrusion-production',
    surface: 'pc',
    label: '挤压生产单-删除',
  },
]
