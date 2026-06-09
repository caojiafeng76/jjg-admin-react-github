import type { PermissionDefinition } from '@/types/permission'
import { SYNEY_PERMISSIONS } from '@/features/syney/permissions'
import { WORKSHOP_PERMISSIONS } from '@/features/workshop/permissions'
import { PRODUCTION_ORDER_PERMISSIONS } from '@/features/production-order/permissions'
import { MATERIAL_TRANSFER_PERMISSIONS } from '@/features/material-transfer/permissions'
import { PRECISION_FINISHING_CUTTING_PERMISSIONS } from '@/features/precision-finishing-cutting/permissions'
import { PRECISION_CUTTING_PERMISSIONS } from '@/features/precision-cutting-transfer/permissions'
import { MACHINE_RUNTIME_PERMISSIONS } from '@/features/machine-runtime/permissions'
import { TOOLING_PERMISSIONS } from '@/features/tooling/permissions'
import { LABOR_PROTECTION_PERMISSIONS } from '@/features/labor-protection/permissions'
import { YOUMAI_PERMISSIONS } from '@/features/youmai/permissions'
import { ATTENDANCE_PERMISSIONS } from '@/features/attendance/permissions'
import { VILLA_LIFT_PERMISSIONS } from '@/features/villa-lift/permissions'
import { QUALITY_PERMISSIONS } from '@/features/quality/permissions'
import { EXTRUSION_PRODUCTION_PERMISSIONS } from '@/features/extrusion-production/permissions'

/** 全局页面权限（没有独立 feature 目录的权限） */
const GLOBAL_PERMISSIONS: PermissionDefinition[] = [
  {
    key: 'page:dashboard',
    scope: 'page',
    module: 'dashboard',
    surface: 'pc',
    label: '首页',
  },
  {
    key: 'nav:access-management',
    scope: 'nav',
    module: 'access-management',
    surface: 'pc',
    label: '权限管理菜单',
  },
  {
    key: 'page:access-management',
    scope: 'page',
    module: 'access-management',
    surface: 'pc',
    label: '权限管理',
  },
  // 全局 feature 权限：通知中心、管理密码
  {
    key: 'feature:admin-notifications.view',
    scope: 'feature',
    module: 'admin-notifications',
    surface: 'pc',
    label: '通知中心-查看',
    description:
      '控制顶栏通知铃图标与通知列表的可见性，未授权用户不订阅 admin 通知 realtime',
  },
  {
    key: 'feature:admin-management-password.update',
    scope: 'feature',
    module: 'admin-management-password',
    surface: 'pc',
    label: '管理密码-修改',
    description: '控制顶栏「修改管理密码」入口可见性',
  },
]

/**
 * 全局权限注册表。
 * 前端通过 syncPermissionRegistry() 将此列表 upsert 到 permissions 表，
 * 与数据库 migration 中的种子数据保持同步。
 */
export const PERMISSION_REGISTRY: PermissionDefinition[] = [
  ...GLOBAL_PERMISSIONS,
  ...SYNEY_PERMISSIONS,
  ...WORKSHOP_PERMISSIONS,
  ...PRODUCTION_ORDER_PERMISSIONS,
  ...MATERIAL_TRANSFER_PERMISSIONS,
  ...PRECISION_FINISHING_CUTTING_PERMISSIONS,
  ...PRECISION_CUTTING_PERMISSIONS,
  ...MACHINE_RUNTIME_PERMISSIONS,
  ...TOOLING_PERMISSIONS,
  ...LABOR_PROTECTION_PERMISSIONS,
  ...YOUMAI_PERMISSIONS,
  ...ATTENDANCE_PERMISSIONS,
  ...VILLA_LIFT_PERMISSIONS,
  ...QUALITY_PERMISSIONS,
  ...EXTRUSION_PRODUCTION_PERMISSIONS,
]
