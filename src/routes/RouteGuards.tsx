import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'

import Loading from '@ui/Loading'
import { useAuth } from '@/contexts/useAuth'
import { getDefaultHomeByRole, type AppRole } from '@/config/access'

export function ProtectedRoute({ element }: { element: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loading />
  }

  if (!user) {
    return <Navigate to="/login" replace />
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

  if (loading) {
    return <Loading />
  }

  if (!user) {
    return <Navigate to="/login" replace />
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

  if (loading) {
    return <Loading />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!employeeProfile || employeeProfile.is_active === false || !role) {
    return <Navigate to="/access-denied" replace />
  }

  return <Navigate replace to={getDefaultHomeByRole(role)} />
}
