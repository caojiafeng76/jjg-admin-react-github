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

  // 订单管理 feature 权限
  {
    key: 'feature:workshop-order.delete',
    scope: 'feature',
    module: 'workshop-order-list',
    surface: 'pc',
    label: '订单管理-删除',
    description: '控制订单列表中"删除"按钮与批量删除入口',
  },
  {
    key: 'feature:workshop-order.manage-status',
    scope: 'feature',
    module: 'workshop-order-list',
    surface: 'pc',
    label: '订单管理-状态变更',
    description: '控制订单结案/反结案等状态批量操作入口',
  },

  // 订单现状
  {
    key: 'nav:production-scheduling',
    scope: 'nav',
    module: 'production-scheduling',
    surface: 'pc',
    label: '订单现状菜单',
  },
  {
    key: 'page:production-scheduling',
    scope: 'page',
    module: 'production-scheduling',
    surface: 'pc',
    label: '订单现状',
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
  {
    key: 'feature:standard-time-list.create',
    scope: 'feature',
    module: 'standard-time-list',
    surface: 'pc',
    label: '成本核算-新建',
    description: '控制成本核算列表"添加"按钮入口',
  },
  {
    key: 'feature:standard-time-list.edit',
    scope: 'feature',
    module: 'standard-time-list',
    surface: 'pc',
    label: '成本核算-编辑',
    description: '控制成本核算列表"编辑"按钮入口',
  },
  {
    key: 'feature:standard-time-list.delete',
    scope: 'feature',
    module: 'standard-time-list',
    surface: 'pc',
    label: '成本核算-删除',
    description: '控制成本核算列表"删除"按钮入口',
  },
  {
    key: 'feature:standard-time-list.export-cost',
    scope: 'feature',
    module: 'standard-time-list',
    surface: 'pc',
    label: '成本核算-导出成本数据',
    description: '控制"导出已选/按筛选条件导出"按钮（含敏感成本字段）',
  },
  {
    key: 'field:standard-time-list.cost-detail.view',
    scope: 'field',
    module: 'standard-time-list',
    surface: 'pc',
    label: '成本核算-查看成本明细面板',
    description:
      '控制右侧成本明细 Splitter 面板的可见性（含人工/设备/总成本等敏感字段）',
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
