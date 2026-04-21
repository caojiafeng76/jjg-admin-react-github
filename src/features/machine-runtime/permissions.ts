import type { PermissionDefinition } from '@/types/permission'

export const MACHINE_RUNTIME_PERMISSIONS: PermissionDefinition[] = [
  // 页面
  {
    key: 'page:machine-equipment-maintenance',
    scope: 'page',
    module: 'machine-equipment',
    surface: 'pc',
    label: '机器设备维护',
  },
  {
    key: 'page:machine-runtime',
    scope: 'page',
    module: 'machine-runtime',
    surface: 'pc',
    label: '设备运行时间',
  },
]
