import type { PermissionDefinition } from '@/types/permission'

export const PACKAGING_PROCESS_PERMISSIONS: PermissionDefinition[] = [
  // 导航
  {
    key: 'nav:packaging-process',
    scope: 'nav',
    module: 'packaging-process',
    surface: 'pc',
    label: '包装工序菜单分组',
  },

  // 页面
  {
    key: 'page:packaging-process-employee-list',
    scope: 'page',
    module: 'packaging-process',
    surface: 'pc',
    label: '包装工序-员工管理',
  },

  // 操作
  {
    key: 'feature:packaging-process-employee-list.create',
    scope: 'feature',
    module: 'packaging-process',
    surface: 'pc',
    label: '包装工序员工管理-新建',
  },
  {
    key: 'feature:packaging-process-employee-list.edit',
    scope: 'feature',
    module: 'packaging-process',
    surface: 'pc',
    label: '包装工序员工管理-编辑',
  },
  {
    key: 'feature:packaging-process-employee-list.delete',
    scope: 'feature',
    module: 'packaging-process',
    surface: 'pc',
    label: '包装工序员工管理-删除',
  },

  // 页面 - 标准工时
  {
    key: 'page:packaging-process-standard-time-list',
    scope: 'page',
    module: 'packaging-process',
    surface: 'pc',
    label: '包装工序-标准工时',
  },

  // 操作 - 标准工时
  {
    key: 'feature:packaging-process-standard-time-list.create',
    scope: 'feature',
    module: 'packaging-process',
    surface: 'pc',
    label: '包装工序标准工时-新建',
  },
  {
    key: 'feature:packaging-process-standard-time-list.edit',
    scope: 'feature',
    module: 'packaging-process',
    surface: 'pc',
    label: '包装工序标准工时-编辑',
  },
  {
    key: 'feature:packaging-process-standard-time-list.delete',
    scope: 'feature',
    module: 'packaging-process',
    surface: 'pc',
    label: '包装工序标准工时-删除',
  },
]
