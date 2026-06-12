export type AppRole =
  | 'admin'
  | 'employee'
  | 'team_leader'
  | 'precision_cutting_admin'
  | 'warehouse_admin'
  | 'viewer'
  | 'extrusion_admin'

export const PRECISION_CUTTING_ADMIN_ROLE: AppRole = 'precision_cutting_admin'
export const WAREHOUSE_ADMIN_ROLE: AppRole = 'warehouse_admin'
export const EXTRUSION_ADMIN_ROLE: AppRole = 'extrusion_admin'
export const VIEWER_ROLE: AppRole = 'viewer'

export const EMPLOYEE_SIDE_ROLES: AppRole[] = ['employee', 'team_leader']

/**
 * 「员工/班组长」操作者视角集合（actor view），用于 layout 选择与业务规则派生。
 *
 * 注意：这不是访问控制。访问控制已统一迁移到 `page:*` 权限（PermissionProtectedRoute）。
 * 保留场景：
 *  - AppLayout 按 role 选择移动端 vs PC 布局；
 *  - 扫码页校验当前用户是否绑定 employeeProfile.id；
 *  - 精切/工单/日报中区分「员工录入视角」与「管理员审核视角」（如默认 is_audited、可编辑字段）。
 *
 * admin 因 trigger 自动获得所有权限，但不应落入员工录入分支，故此判断必须基于 role 而非权限。
 */

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: '管理员',
  employee: '员工',
  team_leader: '班组长',
  precision_cutting_admin: '精切管理员',
  warehouse_admin: '仓库管理员',
  viewer: '查看员',
  extrusion_admin: '挤压主任',
}

export const ROLE_OPTIONS: Array<{ label: string; value: AppRole }> = [
  { label: ROLE_LABELS.employee, value: 'employee' },
  { label: ROLE_LABELS.team_leader, value: 'team_leader' },
  {
    label: ROLE_LABELS.precision_cutting_admin,
    value: PRECISION_CUTTING_ADMIN_ROLE,
  },
  { label: ROLE_LABELS.warehouse_admin, value: WAREHOUSE_ADMIN_ROLE },
  { label: ROLE_LABELS.admin, value: 'admin' },
  { label: ROLE_LABELS.viewer, value: VIEWER_ROLE },
  { label: ROLE_LABELS.extrusion_admin, value: 'extrusion_admin' },
]

export const DEFAULT_HOME_BY_ROLE: Record<AppRole, string> = {
  admin: '/dashboard',
  employee: '/production-order',
  team_leader: '/production-order',
  precision_cutting_admin: '/workshop-order-list',
  warehouse_admin: '/youmai-raw-material-inventory',
  viewer: '/dashboard',
  extrusion_admin: '/workshop-order-list',
}

/**
 * Role 空值安全检查工具
 *
 * useAuth() 返回的 role 类型为 AppRole | null，在首次加载时为 null。
 * 直接使用 role === 'xxx' 不会报错，但语义不清晰，且容易在类型收紧时产生 TS 警告。
 * 使用以下工具函数替代直接比较：
 *
 *  - isEmployeeOnlyRole(role)  — 仅员工角色（非班组长）
 *  - isTeamLeaderOnly(role)   — 仅班组长角色
 *  - isAdminRole(role)        — 管理员角色（排除 null）
 */

/** 仅员工角色（非班组长）。role 为 null/undefined 时返回 false。 */
export function isEmployeeOnlyRole(role: AppRole | null | undefined) {
  return role === 'employee'
}

/** 仅班组长角色。role 为 null/undefined 时返回 false。 */
export function isTeamLeaderOnly(role: AppRole | null | undefined) {
  return role === 'team_leader'
}

/** 管理员角色（不含 null）。role 为 null/undefined 时返回 false。 */
export function isAdminRole(role: AppRole | null | undefined) {
  return role === 'admin'
}

export function isEmployeeSideRole(role: AppRole | null | undefined) {
  return role === 'employee' || role === 'team_leader'
}

export function isPrecisionCuttingAdminRole(role: AppRole | null | undefined) {
  return role === PRECISION_CUTTING_ADMIN_ROLE
}

export function isExtrusionAdminRole(role: AppRole | null | undefined) {
  return role === EXTRUSION_ADMIN_ROLE
}

export function isViewerRole(role: AppRole | null | undefined) {
  return role === VIEWER_ROLE
}

export function getRoleLabel(role: AppRole | null | undefined) {
  return role ? ROLE_LABELS[role] : ''
}

export function getDefaultHomeByRole(role: AppRole | null) {
  if (!role) {
    return '/access-denied'
  }

  return DEFAULT_HOME_BY_ROLE[role]
}
