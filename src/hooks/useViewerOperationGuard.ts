import { isViewerRole } from '@/config/access'
import { useAuth } from '@/contexts/useAuth'

export const VIEWER_OPERATION_TIP = '查看员仅可查看数据'

export function useViewerOperationGuard() {
  const { role } = useAuth()
  const viewerDenied = isViewerRole(role)

  return {
    viewerDenied,
    viewerOperationTip: VIEWER_OPERATION_TIP,
  }
}
