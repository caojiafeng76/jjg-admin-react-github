export type AppRole = 'admin' | 'employee'

export const DEFAULT_HOME_BY_ROLE: Record<AppRole, string> = {
  admin: '/dashboard',
  employee: '/production-order',
}

export function getDefaultHomeByRole(role: AppRole | null) {
  if (!role) {
    return '/access-denied'
  }

  return DEFAULT_HOME_BY_ROLE[role]
}