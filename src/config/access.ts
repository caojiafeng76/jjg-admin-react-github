export type AppRole =
  | 'admin'
  | 'employee'
  | 'team_leader'
  | 'precision_cutting_admin'

export const PRECISION_CUTTING_ADMIN_ROLE: AppRole =
  'precision_cutting_admin'

export const EMPLOYEE_SIDE_ROLES: AppRole[] = ['employee', 'team_leader']

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: '管理员',
  employee: '员工',
  team_leader: '班组长',
  precision_cutting_admin: '精切管理员',
}

export const ROLE_OPTIONS: Array<{ label: string; value: AppRole }> = [
  { label: ROLE_LABELS.employee, value: 'employee' },
  { label: ROLE_LABELS.team_leader, value: 'team_leader' },
  {
    label: ROLE_LABELS.precision_cutting_admin,
    value: PRECISION_CUTTING_ADMIN_ROLE,
  },
  { label: ROLE_LABELS.admin, value: 'admin' },
]

export const DEFAULT_HOME_BY_ROLE: Record<AppRole, string> = {
  admin: '/dashboard',
  employee: '/production-order',
  team_leader: '/production-order',
  precision_cutting_admin: '/workshop-order-list',
}

export function isEmployeeSideRole(role: AppRole | null | undefined) {
  return role === 'employee' || role === 'team_leader'
}

export function isPrecisionCuttingAdminRole(role: AppRole | null | undefined) {
  return role === PRECISION_CUTTING_ADMIN_ROLE
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