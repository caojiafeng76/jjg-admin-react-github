const routeToLabelMap: Record<string, string> = {
  dashboard: '首页',
  'syney-po-list': '订单列表',
  'syney-store-report-list': '入库单列表',
  'syney-spec-list': '踏板规格列表',
  'syney-safe-part-setting': '件号配置',
  'syney-setting': '编号设置',
  'workshop-order-list': '订单管理',
  'production-scheduling': '订单现状',
  'order-scheduling': '订单排产',
  'workshop-process-list': '工序管理',
  'workshop-defect-reason-list': '不良原因管理',
  'employee-list': '员工管理',
  'employee/change-password': '修改密码',
  'standard-time-list': '成本核算',
  'job-base-setting': '岗位基础数值设定',
  'machine-equipment-maintenance': '机器设备维护',
  'material-transfer': '物料转移单',
  'material-transfer/scan': '扫码物料转移单',
  scan: '扫码导航',
  'production-order': '生产工单',
  'production-order/create': '手动新建工单',
  'production-order/scan': '扫码工单',
  'production-daily-report': '生产日报表',
  'quality-rework-repair': '质量 / 返工返修',
  'quality-issue-record': '质量 / 质量问题记录',
  'precision-finishing-cutting': '精加工切割单',
  'precision-finishing-cutting/scan': '扫码精加工切割单',
  'precision-cutting-transfer': '精切转移单',
  'tooling-data': '刀具资料',
  'tooling-inventory': '刀具库存',
  'tooling-stock-in': '刀具入库',
  'tooling-stock-out': '刀具出库',
  'labor-protection-data': '劳保资料',
  'labor-protection-requisition': '领料单',
  'youmai-product-data': '优迈 / 货品资料',
  'youmai-finished-goods-inventory': '优迈 / 成品库存',
  'youmai-finished-goods-stock-in': '优迈 / 成品入库',
  'youmai-finished-goods-stock-out': '优迈 / 成品出库',
  'youmai-raw-material-inventory': '优迈 / 原料库存',
  'youmai-raw-material-stock-in': '优迈 / 原料入库',
  'youmai-raw-material-stock-out': '优迈 / 原料出库',
  'attendance-detail': '考勤明细',
  'attendance-summary': '考勤统计',
  'machine-runtime': '设备运行时间',
  'access-management': '权限管理',
  'villa-lift-order-list': '别墅梯 / 订单管理',
  'villa-lift-cutting-process': '别墅梯 / 切割工序',
  'villa-lift-processing': '别墅梯 / 加工工序',
  'extrusion-production': '挤压生产单',
  'extrusion-production-daily-report': '挤压生产日报表',
  'access-denied': '无权限',
}

function normalizeRoutePath(pathname: string) {
  const [pathWithoutQuery] = pathname.split(/[?#]/)
  return pathWithoutQuery.replace(/^\/+/, '') || 'dashboard'
}

export function getRouteLabel(pathname: string) {
  const currentPath = normalizeRoutePath(pathname)

  if (routeToLabelMap[currentPath]) {
    return routeToLabelMap[currentPath]
  }

  if (currentPath.startsWith('workshop-order-list/qr/')) {
    return '订单扫码详情'
  }

  if (currentPath.startsWith('syney-po-list/')) {
    return '订单详情'
  }

  if (currentPath.startsWith('syney-store-report-list/')) {
    return '入库单详情'
  }

  if (/^production-order\/[^/]+\/edit$/.test(currentPath)) {
    return '编辑工单'
  }

  if (/^production-order\/[^/]+$/.test(currentPath)) {
    return '工单详情'
  }

  return ''
}
