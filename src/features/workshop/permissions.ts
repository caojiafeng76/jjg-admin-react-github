import type { PermissionDefinition } from '@/types/permission'

export const WORKSHOP_PERMISSIONS: PermissionDefinition[] = [
  // 订单管理导航
  {
    key: 'nav:workshop-order-list',
    scope: 'nav',
    module: 'workshop-order-list',
    surface: 'pc',
    label: '订单管理菜单',
  },

  // 订单管理页面
  {
    key: 'page:workshop-order-production',
    scope: 'page',
    module: 'workshop-order-list',
    surface: 'pc',
    label: '订单管理-生产中',
  },
  {
    key: 'page:workshop-order-closed',
    scope: 'page',
    module: 'workshop-order-list',
    surface: 'pc',
    label: '订单管理-已结案',
  },
  {
    key: 'page:workshop-order-qr-detail',
    scope: 'page',
    module: 'workshop-order-list',
    surface: 'both',
    label: '订单二维码详情',
  },

  // 排产计划
  {
    key: 'nav:production-scheduling',
    scope: 'nav',
    module: 'production-scheduling',
    surface: 'pc',
    label: '排产计划菜单',
  },
  {
    key: 'page:production-scheduling',
    scope: 'page',
    module: 'production-scheduling',
    surface: 'pc',
    label: '排产计划',
  },

  // 员工管理
  {
    key: 'page:employee-list',
    scope: 'page',
    module: 'employee-list',
    surface: 'pc',
    label: '员工管理',
  },
  {
    key: 'feature:employee-list.create',
    scope: 'feature',
    module: 'employee-list',
    surface: 'pc',
    label: '员工管理-新建',
  },
  {
    key: 'feature:employee-list.edit',
    scope: 'feature',
    module: 'employee-list',
    surface: 'pc',
    label: '员工管理-编辑',
  },
  {
    key: 'feature:employee-list.edit-role',
    scope: 'feature',
    module: 'employee-list',
    surface: 'pc',
    label: '员工管理-修改角色',
  },
  {
    key: 'feature:employee-list.reset-password',
    scope: 'feature',
    module: 'employee-list',
    surface: 'pc',
    label: '员工管理-重置密码',
  },
  {
    key: 'feature:employee-list.delete',
    scope: 'feature',
    module: 'employee-list',
    surface: 'pc',
    label: '员工管理-删除',
  },

  // 基础资料
  {
    key: 'nav:workshop-basic',
    scope: 'nav',
    module: 'workshop-basic',
    surface: 'pc',
    label: '基础资料菜单',
  },
  {
    key: 'page:job-base-setting',
    scope: 'page',
    module: 'job-base-setting',
    surface: 'pc',
    label: '岗位基础数值设定',
  },

  // 成本核算
  {
    key: 'nav:standard-time-list',
    scope: 'nav',
    module: 'standard-time-list',
    surface: 'pc',
    label: '成本核算菜单',
  },
  {
    key: 'page:standard-time-list',
    scope: 'page',
    module: 'standard-time-list',
    surface: 'pc',
    label: '成本核算',
  },

  // 报表
  {
    key: 'nav:reports',
    scope: 'nav',
    module: 'reports',
    surface: 'pc',
    label: '报表菜单',
  },
]
