import { DocumentArrowDownIcon } from '@heroicons/react/16/solid'
import PermissionButton from '@/ui/PermissionButton'
import { useExportSafePartInfoAsExcel } from './useExportSafePartInfoAsExcel'

export default function ExportInfoButton() {
  const { exportSafePartInfoAsExcel, preloadExcel, exporting }
    = useExportSafePartInfoAsExcel()

  return (
    <PermissionButton
      type="text"
      permissionKey="feature:syney-po-list.export"
      noPermissionTip="无导出权限"
      icon={<DocumentArrowDownIcon className="size-4" />}
      onClick={exportSafePartInfoAsExcel}
      onMouseEnter={preloadExcel}
      onFocus={preloadExcel}
      loading={exporting}
    >
      导出安全部件信息
    </PermissionButton>
  )
}
