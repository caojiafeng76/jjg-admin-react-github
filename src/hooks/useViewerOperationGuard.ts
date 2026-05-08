import { isViewerRole } from '@/config/access'
import { useAuth } from '@/contexts'
import { usePermissionContext } from '@/contexts'

export const VIEWER_OPERATION_TIP = '查看员仅可查看数据'

interface ViewerOperationGuardOptions {
  bypassPermissionKey?: string | string[]
}

export function useViewerOperationGuard(
  options: ViewerOperationGuardOptions = {},
) {
  const { role } = useAuth()
  const { permissions } = usePermissionContext()
  const bypassPermissionKeys = Array.isArray(options.bypassPermissionKey)
    ? options.bypassPermissionKey
    : options.bypassPermissionKey
      ? [options.bypassPermissionKey]
      : []
  const canBypassViewerGuard = bypassPermissionKeys.some(
    (key) => permissions[key] === true,
  )
  const viewerDenied = isViewerRole(role) && !canBypassViewerGuard

  return {
    viewerDenied,
    viewerOperationTip: VIEWER_OPERATION_TIP,
  }
}
