import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState, type ReactNode } from 'react'

import Loading from '@ui/Loading'
import { useAuth } from '@/contexts'
import { usePermissionContext } from '@/contexts'
import { getDefaultHomeByRole, type AppRole } from '@/config/access'
import { deriveDefaultHome } from './pageHome'

function buildLoginRedirectPath(targetPath: string) {
  return `/login?redirect=${encodeURIComponent(targetPath)}`
}

export function ProtectedRoute({ element }: { element: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Loading />
  }

  if (!user) {
    return (
      <Navigate
        to={buildLoginRedirectPath(
          `${location.pathname}${location.search}${location.hash}`,
        )}
        replace
      />
    )
  }

  return <>{element}</>
}

export function RoleProtectedRoute({
  element,
  allow,
}: {
  element: ReactNode
  allow: AppRole[]
}) {
  const { user, loading, role, employeeProfile } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Loading />
  }

  if (!user) {
    return (
      <Navigate
        to={buildLoginRedirectPath(
          `${location.pathname}${location.search}${location.hash}`,
        )}
        replace
      />
    )
  }

  if (!employeeProfile || employeeProfile.is_active === false || !role) {
    return <Navigate to="/access-denied" replace />
  }

  if (!allow.includes(role)) {
    return <Navigate to={getDefaultHomeByRole(role)} replace />
  }

  return <>{element}</>
}

export function RoleHomeRedirect() {
  const { user, loading, role, employeeProfile } = useAuth()
  const { permissions, isLoading: permLoading } = usePermissionContext()
  const [target, setTarget] = useState<string | null>(null)

  useEffect(() => {
    if (loading || permLoading || !user || !employeeProfile || !role) return
    let cancelled = false
    deriveDefaultHome(role, permissions).then((path) => {
      if (!cancelled) setTarget(path)
    })
    return () => {
      cancelled = true
    }
  }, [loading, permLoading, user, employeeProfile, role, permissions])

  if (loading || permLoading) {
    return <Loading />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!employeeProfile || employeeProfile.is_active === false || !role) {
    return <Navigate to="/access-denied" replace />
  }

  if (!target) {
    return <Loading />
  }

  return <Navigate replace to={target} />
}

/**
 * 基于 `page:*` 权限的路由守卫（权限系统版）。
 * 权限加载中时显示 Loading；无权限时重定向到角色默认首页并显示 access-denied。
 */
export function PermissionProtectedRoute({
  element,
  permissionKey,
}: {
  element: ReactNode
  permissionKey: string
}) {
  const { user, loading: authLoading, role, employeeProfile } = useAuth()
  const { can, isLoading: permLoading } = usePermissionContext()
  const location = useLocation()

  if (authLoading || permLoading) {
    return <Loading />
  }

  if (!user) {
    return (
      <Navigate
        to={buildLoginRedirectPath(
          `${location.pathname}${location.search}${location.hash}`,
        )}
        replace
      />
    )
  }

  if (!employeeProfile || employeeProfile.is_active === false || !role) {
    return <Navigate to="/access-denied" replace />
  }

  if (!can(permissionKey)) {
    return <Navigate to="/access-denied" replace />
  }

  return <>{element}</>
}
